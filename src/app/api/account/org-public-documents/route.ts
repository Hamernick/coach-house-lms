import { NextResponse, type NextRequest } from "next/server"
import { revalidatePath } from "next/cache"

import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route"
import type { Database } from "@/lib/supabase"
import { ORG_MEDIA_BUCKET } from "@/lib/storage/org-media"
import { canEditOrganization, resolveActiveOrganization } from "@/lib/organization/active-org"
import { createNotification } from "@/lib/notifications"

const MAX_BYTES = 15 * 1024 * 1024
const ALLOWED = new Set(["application/pdf"])
const KIND_KEY_MAP = {
  programs: "programs",
  reports: "reports",
} as const

type PublicDocumentKind = keyof typeof KIND_KEY_MAP

type PublicDocumentMeta = {
  name: string
  path: string
  url: string
  size: number
  mime: string
  updatedAt: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function sanitizeFilename(name: string) {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-")
  return cleaned.length > 0 ? cleaned : "document.pdf"
}

function validatePdf(file: File): string | null {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  if (!isPdf) return "Only PDF files are supported."
  if (file.size > MAX_BYTES) return "File too large. Max size is 15 MB."
  return null
}

function getKind(searchParams: URLSearchParams): PublicDocumentKind | null {
  const kind = searchParams.get("kind")
  if (!kind) return null
  return (Object.keys(KIND_KEY_MAP) as PublicDocumentKind[]).includes(kind as PublicDocumentKind)
    ? (kind as PublicDocumentKind)
    : null
}

function getAttachments(profile: Record<string, unknown>): Record<PublicDocumentKind, PublicDocumentMeta[]> {
  const root = isRecord(profile["publicAttachments"]) ? (profile["publicAttachments"] as Record<string, unknown>) : {}
  const output = {} as Record<PublicDocumentKind, PublicDocumentMeta[]>
  for (const key of Object.keys(KIND_KEY_MAP) as PublicDocumentKind[]) {
    const list = root[key]
    output[key] = Array.isArray(list)
      ? list
          .filter((entry): entry is Record<string, unknown> => isRecord(entry))
          .map((entry) => ({
            name: typeof entry.name === "string" ? entry.name : "",
            path: typeof entry.path === "string" ? entry.path : "",
            url: typeof entry.url === "string" ? entry.url : "",
            size: typeof entry.size === "number" ? entry.size : 0,
            mime: typeof entry.mime === "string" ? entry.mime : "application/pdf",
            updatedAt: typeof entry.updatedAt === "string" ? entry.updatedAt : "",
          }))
          .filter((entry) => entry.path.length > 0 && entry.url.length > 0)
      : []
  }
  return output
}

function updateAttachmentsProfile(
  profile: Record<string, unknown>,
  kind: PublicDocumentKind,
  nextList: PublicDocumentMeta[],
) {
  const current = isRecord(profile["publicAttachments"]) ? { ...(profile["publicAttachments"] as Record<string, unknown>) } : {}
  current[kind] = nextList
  return { ...profile, publicAttachments: current }
}

async function loadOrgRow(
  supabase: ReturnType<typeof createSupabaseRouteHandlerClient>,
  userId: string,
) {
  const { data: orgRow, error } = await supabase
    .from("organizations")
    .select("profile, public_slug, is_public")
    .eq("user_id", userId)
    .maybeSingle<{ profile: Record<string, unknown> | null; public_slug: string | null; is_public: boolean | null }>()

  if (error) {
    throw new Error(error.message)
  }

  return {
    profile: (orgRow?.profile ?? {}) as Record<string, unknown>,
    publicSlug: typeof orgRow?.public_slug === "string" ? orgRow.public_slug : null,
    isPublic: Boolean(orgRow?.is_public),
  }
}

function revalidateOrgPaths(publicSlug: string | null) {
  revalidatePath("/organization")
  if (publicSlug) {
    revalidatePath(`/${publicSlug}`)
  }
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

  try {
    const { orgId } = await resolveActiveOrganization(supabase, user.id)
    const { profile } = await loadOrgRow(supabase, orgId)
    return NextResponse.json({ attachments: getAttachments(profile) }, { status: 200 })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to load uploads" }, { status: 500 })
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
  const kind = getKind(searchParams)
  if (!kind) {
    return NextResponse.json({ error: "Unsupported upload kind" }, { status: 400 })
  }

  const form = await request.formData()
  const file = form.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 })
  }

  const validationError = validatePdf(file)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  try {
    const { orgId, role } = await resolveActiveOrganization(supabase, user.id)
    if (!canEditOrganization(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { profile, publicSlug } = await loadOrgRow(supabase, orgId)
    const currentAttachments = getAttachments(profile)[kind]

    const safeName = sanitizeFilename(file.name)
    const objectName = `${orgId}/public-documents/${kind}/${Date.now()}-${safeName}`
    const buf = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage.from(ORG_MEDIA_BUCKET).upload(objectName, buf, {
      contentType: file.type,
    })
    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: publicUrl } = supabase.storage.from(ORG_MEDIA_BUCKET).getPublicUrl(objectName)
    const url = publicUrl.publicUrl
    const doc: PublicDocumentMeta = {
      name: file.name,
      path: objectName,
      url,
      size: file.size,
      mime: file.type,
      updatedAt: new Date().toISOString(),
    }

    const nextList = [...currentAttachments, doc].slice(-12)
    const nextProfile = updateAttachmentsProfile(profile, kind, nextList)
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
      await supabase.storage.from(ORG_MEDIA_BUCKET).remove([objectName])
      return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }

    const notifyResult = await createNotification(supabase, {
      userId: user.id,
      title: "Public document uploaded",
      description: `${file.name} added to public ${kind}.`,
      href: "/organization",
      tone: "info",
      type: "public_document_uploaded",
      actorId: user.id,
      metadata: { kind, filename: file.name },
    })
    if ("error" in notifyResult) {
      console.error("Failed to create public document notification", notifyResult.error)
    }

    revalidateOrgPaths(publicSlug)
    return NextResponse.json({ document: doc, attachments: nextList }, { status: 200 })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload failed" }, { status: 500 })
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
  const kind = getKind(searchParams)
  if (!kind) {
    return NextResponse.json({ error: "Unsupported upload kind" }, { status: 400 })
  }

  const payload = await request.json().catch(() => null)
  const path = typeof payload?.path === "string" ? payload.path.trim() : ""
  if (!path) {
    return NextResponse.json({ error: "Missing file path" }, { status: 400 })
  }
  const { orgId, role } = await resolveActiveOrganization(supabase, user.id)
  if (!canEditOrganization(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const expectedPrefix = `${orgId}/public-documents/${kind}/`
  if (!path.startsWith(expectedPrefix)) {
    return NextResponse.json({ error: "Invalid file path" }, { status: 400 })
  }

  try {
    const { profile, publicSlug } = await loadOrgRow(supabase, orgId)
    const currentAttachments = getAttachments(profile)[kind]
    const nextList = currentAttachments.filter((doc) => doc.path !== path)
    if (nextList.length === currentAttachments.length) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    await supabase.storage.from(ORG_MEDIA_BUCKET).remove([path])

    const nextProfile = updateAttachmentsProfile(profile, kind, nextList)
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

    revalidateOrgPaths(publicSlug)
    return NextResponse.json({ ok: true, attachments: nextList }, { status: 200 })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Delete failed" }, { status: 500 })
  }
}
