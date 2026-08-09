import { createHash, randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import { NextResponse, type NextRequest } from "next/server"

import {
  getWorkspaceFinanceRecordTypeLabel,
  normalizeWorkspaceFinanceManualRecord,
  type WorkspaceFinanceManualRecordType,
  type WorkspaceFinanceRecordCorrectionResult,
} from "@/features/workspace-finance"
import {
  resolveAuthenticatedAppContext,
  type AuthenticatedAppRequestContext,
} from "@/lib/auth/request-context"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import {
  canManageWorkspaceFinance,
  canViewWorkspaceFinance,
} from "@/lib/workspace/workspace-finance-access"

const BUCKET = "finance-evidence"
const MAX_BYTES = 10 * 1024 * 1024
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const MIME_EXTENSIONS = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
} as const

type AllowedMime = keyof typeof MIME_EXTENSIONS

type FinanceEvidenceRow = {
  id: string
  external_reference: string
  file_name: string
  file_sha256: string
  mime_type: string
  org_id: string
  storage_bucket: string
  storage_path: string
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status })
}

function revalidateFinanceRoutes() {
  revalidatePath("/workspace")
  revalidatePath("/my-organization")
  revalidatePath("/organization/workspace")
}

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin")
  return Boolean(origin && origin === new URL(request.url).origin)
}

function sanitizeFilename(value: string, mime: AllowedMime) {
  const extension = MIME_EXTENSIONS[mime]
  const base = value
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 150)
  return `${base || "finance-evidence"}.${extension}`
}

function matchesFileSignature(bytes: Uint8Array, mime: AllowedMime) {
  if (mime === "application/pdf") {
    return String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-"
  }
  if (mime === "image/png") {
    const signature = [137, 80, 78, 71, 13, 10, 26, 10]
    return signature.every((value, index) => bytes[index] === value)
  }
  return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
}

async function resolveContext() {
  try {
    return await resolveAuthenticatedAppContext()
  } catch {
    return null
  }
}

function resolveAdmin() {
  try {
    return createSupabaseAdminClient()
  } catch {
    return null
  }
}

async function canAccess(
  context: AuthenticatedAppRequestContext,
  manage: boolean
) {
  const input = {
    activeOrg: context.activeOrg,
    supabase: context.supabase,
    userId: context.user.id,
  }
  return manage
    ? canManageWorkspaceFinance(input)
    : canViewWorkspaceFinance(input)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ recordId: string }> }
) {
  if (!sameOrigin(request)) return jsonError("Invalid request origin.", 403)

  const context = await resolveContext()
  if (!context) return jsonError("Unauthorized", 401)
  if (!(await canAccess(context, true))) return jsonError("Forbidden", 403)

  const { recordId } = await params
  if (!UUID_PATTERN.test(recordId)) {
    return jsonError("Finance record not found.", 404)
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return jsonError("Unable to read verification evidence.", 400)
  }

  const reference = String(form.get("reference") ?? "").trim()
  const file = form.get("file")
  if (!reference || reference.length > 160) {
    return jsonError("Enter an external reference up to 160 characters.", 400)
  }
  if (!(file instanceof File) || file.size < 1 || file.size > MAX_BYTES) {
    return jsonError("Choose a PDF, JPG, or PNG up to 10 MB.", 400)
  }
  if (!(file.type in MIME_EXTENSIONS)) {
    return jsonError("Choose a PDF, JPG, or PNG.", 400)
  }

  const mime = file.type as AllowedMime
  const bytes = new Uint8Array(await file.arrayBuffer())
  if (!matchesFileSignature(bytes, mime)) {
    return jsonError("The evidence file does not match its file type.", 400)
  }

  const fileName = sanitizeFilename(file.name, mime)
  const storagePath = `${context.activeOrg.orgId}/${recordId}/${randomUUID()}-${fileName}`
  const fileSha256 = createHash("sha256").update(bytes).digest("hex")
  const admin = resolveAdmin()
  if (!admin) return jsonError("Finance evidence is not configured.", 503)
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, bytes, { contentType: mime, upsert: false })

  if (uploadError) {
    return jsonError("Unable to store verification evidence.", 500)
  }

  const { data, error } = await admin.rpc(
    "reconcile_organization_finance_record",
    {
      p_actor_id: context.user.id,
      p_org_id: context.activeOrg.orgId,
      p_record_id: recordId,
      p_external_reference: reference,
      p_storage_path: storagePath,
      p_file_name: fileName,
      p_mime_type: mime,
      p_size_bytes: file.size,
      p_file_sha256: fileSha256,
    }
  )

  if (error || !data || typeof data !== "object" || Array.isArray(data)) {
    await admin.storage.from(BUCKET).remove([storagePath])
    return jsonError(
      error?.message.includes("not available")
        ? "This record is no longer available for verification."
        : "Unable to verify this Finance record.",
      error?.message.includes("not available") ? 409 : 500
    )
  }

  const evidenceId = data.evidenceId
  const reconciledAt = data.reconciledAt
  if (typeof evidenceId !== "string" || typeof reconciledAt !== "string") {
    return jsonError("Unable to confirm this verification.", 500)
  }

  revalidateFinanceRoutes()
  return NextResponse.json({
    reconciliation: {
      evidenceId,
      externalReference: reference,
      fileName,
      reconciledAt,
    },
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ recordId: string }> }
) {
  if (!sameOrigin(request)) return jsonError("Invalid request origin.", 403)

  const context = await resolveContext()
  if (!context) return jsonError("Unauthorized", 401)
  if (!(await canAccess(context, true))) return jsonError("Forbidden", 403)

  const { recordId } = await params
  if (!UUID_PATTERN.test(recordId)) {
    return jsonError("Finance record not found.", 404)
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return jsonError("Unable to read correction evidence.", 400)
  }

  const reason = String(form.get("reason") ?? "").trim()
  const reference = String(form.get("reference") ?? "").trim()
  const programValue = String(form.get("programId") ?? "").trim()
  const normalized = normalizeWorkspaceFinanceManualRecord({
    amount: String(form.get("amount") ?? ""),
    effectiveDate: String(form.get("effectiveDate") ?? ""),
    programId: programValue || null,
    recordType: String(
      form.get("recordType") ?? ""
    ) as WorkspaceFinanceManualRecordType,
    sourceLabel: String(form.get("sourceLabel") ?? ""),
  })
  const file = form.get("file")

  if (!reason || reason.length > 300) {
    return jsonError("Enter a correction reason up to 300 characters.", 400)
  }
  if (!reference || reference.length > 160) {
    return jsonError("Enter an external reference up to 160 characters.", 400)
  }
  if (!normalized) {
    return jsonError("Check the date, amount, source, and record type.", 400)
  }
  if (!(file instanceof File) || file.size < 1 || file.size > MAX_BYTES) {
    return jsonError("Choose a PDF, JPG, or PNG up to 10 MB.", 400)
  }
  if (!(file.type in MIME_EXTENSIONS)) {
    return jsonError("Choose a PDF, JPG, or PNG.", 400)
  }

  const admin = resolveAdmin()
  if (!admin) return jsonError("Finance evidence is not configured.", 503)

  let programTitle: string | null = null
  if (normalized.programId) {
    const { data: program, error: programError } = await admin
      .from("programs")
      .select("id,title")
      .eq("id", normalized.programId)
      .eq("user_id", context.activeOrg.orgId)
      .maybeSingle<{ id: string; title: string | null }>()
    if (programError || !program) {
      return jsonError("Choose a program from this organization.", 400)
    }
    programTitle = program.title?.trim() || "Untitled program"
  }

  const mime = file.type as AllowedMime
  const bytes = new Uint8Array(await file.arrayBuffer())
  if (!matchesFileSignature(bytes, mime)) {
    return jsonError("The evidence file does not match its file type.", 400)
  }

  const replacementRecordId = randomUUID()
  const fileName = sanitizeFilename(file.name, mime)
  const storagePath = `${context.activeOrg.orgId}/${recordId}/corrections/${replacementRecordId}/${randomUUID()}-${fileName}`
  const fileSha256 = createHash("sha256").update(bytes).digest("hex")
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, bytes, { contentType: mime, upsert: false })
  if (uploadError) {
    return jsonError("Unable to store correction evidence.", 500)
  }

  const { data, error } = await admin.rpc(
    "correct_organization_finance_record",
    {
      p_actor_id: context.user.id,
      p_org_id: context.activeOrg.orgId,
      p_original_record_id: recordId,
      p_replacement_record_id: replacementRecordId,
      p_program_id: normalized.programId,
      p_effective_at: normalized.effectiveAt,
      p_record_type: normalized.recordType,
      p_direction: normalized.direction,
      p_source_kind: normalized.sourceKind,
      p_source_label: normalized.sourceLabel,
      p_amount_cents: normalized.amountCents,
      p_currency_code: normalized.currencyCode,
      p_reason: reason,
      p_external_reference: reference,
      p_storage_path: storagePath,
      p_file_name: fileName,
      p_mime_type: mime,
      p_size_bytes: file.size,
      p_file_sha256: fileSha256,
    }
  )

  if (error || !data || typeof data !== "object" || Array.isArray(data)) {
    await admin.storage.from(BUCKET).remove([storagePath])
    const unavailable = error?.message.includes("available for correction")
    return jsonError(
      unavailable
        ? "This record is no longer available for correction."
        : "Unable to correct this Finance record.",
      unavailable ? 409 : 500
    )
  }

  const correctionId = data.correctionId
  const evidenceId = data.evidenceId
  const correctedAt = data.correctedAt
  if (
    typeof correctionId !== "string" ||
    typeof evidenceId !== "string" ||
    typeof correctedAt !== "string"
  ) {
    return jsonError("Unable to confirm this correction.", 500)
  }

  const result: WorkspaceFinanceRecordCorrectionResult = {
    originalRecordId: recordId,
    originalCorrection: {
      correctionId,
      correctedAt,
      reason,
      relatedRecordId: replacementRecordId,
      state: "corrected",
    },
    replacementRecord: {
      id: replacementRecordId,
      programId: normalized.programId,
      programTitle,
      effectiveAt: normalized.effectiveAt,
      sourceLabel: normalized.sourceLabel,
      recordType: normalized.recordType,
      typeLabel: getWorkspaceFinanceRecordTypeLabel(normalized.recordType),
      amountCents: normalized.amountCents,
      currencyCode: normalized.currencyCode,
      direction: normalized.direction,
      status: "reconciled",
      sourceKind: normalized.sourceKind,
      reconciliation: {
        evidenceId,
        externalReference: reference,
        fileName,
        reconciledAt: correctedAt,
      },
      correction: {
        correctionId,
        correctedAt,
        reason,
        relatedRecordId: recordId,
        state: "replacement",
      },
    },
  }

  revalidateFinanceRoutes()
  return NextResponse.json({ correction: result })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ recordId: string }> }
) {
  const context = await resolveContext()
  if (!context) return jsonError("Unauthorized", 401)
  if (!(await canAccess(context, false))) return jsonError("Not found", 404)

  const { recordId } = await params
  if (!UUID_PATTERN.test(recordId)) return jsonError("Not found", 404)

  const { data: evidence, error } = await context.supabase
    .from("organization_finance_record_evidence")
    .select(
      "id,external_reference,file_name,file_sha256,mime_type,org_id,storage_bucket,storage_path"
    )
    .eq("record_id", recordId)
    .eq("org_id", context.activeOrg.orgId)
    .maybeSingle<FinanceEvidenceRow>()

  if (error || !evidence) return jsonError("Not found", 404)

  const admin = resolveAdmin()
  if (!admin) return jsonError("Evidence unavailable.", 404)
  const { data, error: downloadError } = await admin.storage
    .from(evidence.storage_bucket)
    .download(evidence.storage_path)
  if (downloadError || !data) return jsonError("Evidence unavailable.", 404)

  const bytes = Buffer.from(await data.arrayBuffer())
  const actualSha256 = createHash("sha256").update(bytes).digest("hex")
  if (actualSha256 !== evidence.file_sha256) {
    return jsonError("Evidence integrity verification failed.", 409)
  }

  const download = new URL(request.url).searchParams.get("download") === "1"
  return new Response(bytes, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${evidence.file_name.replaceAll('"', "")}"`,
      "Content-Type": evidence.mime_type,
      "X-Content-Type-Options": "nosniff",
      "X-Document-SHA256": actualSha256,
    },
  })
}
