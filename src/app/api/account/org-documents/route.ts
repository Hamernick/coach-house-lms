import { NextResponse, type NextRequest } from "next/server"

import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route"
import type { Database } from "@/lib/supabase"
import { canEditOrganization, resolveActiveOrganization } from "@/lib/organization/active-org"
import { createNotification } from "@/lib/notifications"

const BUCKET = "org-documents"
const MAX_BYTES = 15 * 1024 * 1024
const ALLOWED = new Set(["application/pdf"])
const KIND_KEY_MAP = {
  "verification-letter": "verificationLetter",
  "articles-of-incorporation": "articlesOfIncorporation",
  "bylaws": "bylaws",
  "state-registration": "stateRegistration",
  "good-standing-certificate": "goodStandingCertificate",
  "w9": "w9",
  "tax-exempt-certificate": "taxExemptCertificate",
  "uei-confirmation": "ueiConfirmation",
  "sam-active-status": "samActiveStatus",
  "grants-gov-registration": "grantsGovRegistration",
  "gata-pre-qualification": "gataPreQualification",
  "ein-confirmation-letter": "einConfirmationLetter",
  "irs-990s": "irs990s",
  "audited-financials": "auditedFinancials",
} as const

type DocumentKey = (typeof KIND_KEY_MAP)[keyof typeof KIND_KEY_MAP]

type DocumentMeta = {
  name: string
  path: string
  size: number
  mime: string
  updatedAt: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function getDocumentKey(kind: string | null): DocumentKey | null {
  if (!kind) return null
  return KIND_KEY_MAP[kind as keyof typeof KIND_KEY_MAP] ?? null
}

function sanitizeFilename(name: string) {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-")
  return cleaned.length > 0 ? cleaned : "document.pdf"
}

async function loadProfile(supabase: ReturnType<typeof createSupabaseRouteHandlerClient>, orgId: string) {
  const { data: orgRow, error } = await supabase
    .from("organizations")
    .select("profile")
    .eq("user_id", orgId)
    .maybeSingle<{ profile: Record<string, unknown> | null }>()

  if (error) {
    throw new Error(error.message)
  }

  return (orgRow?.profile ?? {}) as Record<string, unknown>
}

function updateDocumentsProfile(profile: Record<string, unknown>, key: DocumentKey, nextDoc: DocumentMeta | null) {
  const documents = isRecord(profile["documents"]) ? { ...profile["documents"] } : {}
  if (nextDoc) {
    documents[key] = nextDoc
  } else {
    delete documents[key]
  }
  return { ...profile, documents }
}

export async function GET(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createSupabaseRouteHandlerClient(request, response)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: error?.message ?? "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const key = getDocumentKey(searchParams.get("kind"))
  if (!key) {
    return NextResponse.json({ error: "Unsupported document kind" }, { status: 400 })
  }

  try {
    const { orgId } = await resolveActiveOrganization(supabase, user.id)
    const profile = await loadProfile(supabase, orgId)
    const documents = isRecord(profile["documents"]) ? (profile["documents"] as Record<string, unknown>) : {}
    const doc = documents[key]
    if (!isRecord(doc) || typeof doc.path !== "string") {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const { data: signed, error: signedError } = await supabase.storage.from(BUCKET).createSignedUrl(doc.path, 60 * 15)
    if (signedError || !signed?.signedUrl) {
      return NextResponse.json({ error: signedError?.message ?? "Unable to access document" }, { status: 500 })
    }

    return NextResponse.json({ url: signed.signedUrl }, { status: 200 })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to load document" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createSupabaseRouteHandlerClient(request, response)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: error?.message ?? "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const key = getDocumentKey(searchParams.get("kind"))
  if (!key) {
    return NextResponse.json({ error: "Unsupported document kind" }, { status: 400 })
  }

  const form = await request.formData()
  const file = form.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 })
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Only PDF files are supported." }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large. Max size is 15 MB." }, { status: 400 })
  }

  try {
    const { orgId, role } = await resolveActiveOrganization(supabase, user.id)
    if (!canEditOrganization(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const profile = await loadProfile(supabase, orgId)
    const documents = isRecord(profile["documents"]) ? (profile["documents"] as Record<string, unknown>) : {}
    const existing = documents[key]
    const existingPath = isRecord(existing) && typeof existing.path === "string" ? existing.path : null

    if (existingPath) {
      await supabase.storage.from(BUCKET).remove([existingPath])
    }

    const safeName = sanitizeFilename(file.name)
    const objectName = `${orgId}/${key}/${Date.now()}-${safeName}`
    const buf = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(objectName, buf, { contentType: file.type })
    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const doc: DocumentMeta = {
      name: file.name,
      path: objectName,
      size: file.size,
      mime: file.type,
      updatedAt: new Date().toISOString(),
    }

    const nextProfile = updateDocumentsProfile(profile, key, doc)
    const { error: upsertError } = await supabase
      .from("organizations")
      .upsert(
        {
          user_id: orgId,
          profile: nextProfile as Database["public"]["Tables"]["organizations"]["Insert"]["profile"],
        },
        { onConflict: "user_id" },
      )

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }

    const notifyResult = await createNotification(supabase, {
      userId: user.id,
      title: "Document uploaded",
      description: `${file.name} added to your documents.`,
      href: "/organization/documents",
      tone: "success",
      type: "document_uploaded",
      actorId: user.id,
      metadata: { kind: key, filename: file.name },
    })
    if ("error" in notifyResult) {
      console.error("Failed to create document notification", notifyResult.error)
    }

    return NextResponse.json({ document: doc }, { status: 200 })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload failed" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createSupabaseRouteHandlerClient(request, response)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: error?.message ?? "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const key = getDocumentKey(searchParams.get("kind"))
  if (!key) {
    return NextResponse.json({ error: "Unsupported document kind" }, { status: 400 })
  }

  const payload = await request.json().catch(() => null)
  const nextName = typeof payload?.name === "string" ? payload.name.trim() : ""
  if (!nextName) {
    return NextResponse.json({ error: "Document title is required" }, { status: 400 })
  }

  try {
    const { orgId, role } = await resolveActiveOrganization(supabase, user.id)
    if (!canEditOrganization(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const profile = await loadProfile(supabase, orgId)
    const documents = isRecord(profile["documents"]) ? (profile["documents"] as Record<string, unknown>) : {}
    const current = documents[key]
    if (!isRecord(current) || typeof current.path !== "string") {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const doc: DocumentMeta = {
      name: nextName,
      path: String(current.path),
      size: typeof current.size === "number" ? current.size : 0,
      mime: typeof current.mime === "string" ? current.mime : "application/pdf",
      updatedAt: new Date().toISOString(),
    }

    const nextProfile = updateDocumentsProfile(profile, key, doc)
    const { error: upsertError } = await supabase
      .from("organizations")
      .upsert(
        {
          user_id: orgId,
          profile: nextProfile as Database["public"]["Tables"]["organizations"]["Insert"]["profile"],
        },
        { onConflict: "user_id" },
      )

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }

    return NextResponse.json({ document: doc }, { status: 200 })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Update failed" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createSupabaseRouteHandlerClient(request, response)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: error?.message ?? "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const key = getDocumentKey(searchParams.get("kind"))
  if (!key) {
    return NextResponse.json({ error: "Unsupported document kind" }, { status: 400 })
  }

  try {
    const { orgId, role } = await resolveActiveOrganization(supabase, user.id)
    if (!canEditOrganization(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const profile = await loadProfile(supabase, orgId)
    const documents = isRecord(profile["documents"]) ? (profile["documents"] as Record<string, unknown>) : {}
    const current = documents[key]
    const path = isRecord(current) && typeof current.path === "string" ? current.path : null

    if (path) {
      await supabase.storage.from(BUCKET).remove([path])
    }

    const nextProfile = updateDocumentsProfile(profile, key, null)
    const { error: upsertError } = await supabase
      .from("organizations")
      .upsert(
        {
          user_id: orgId,
          profile: nextProfile as Database["public"]["Tables"]["organizations"]["Insert"]["profile"],
        },
        { onConflict: "user_id" },
      )

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Delete failed" }, { status: 500 })
  }
}
