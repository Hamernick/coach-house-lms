import { NextResponse, type NextRequest } from "next/server"

import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route"
import { canEditOrganization, resolveActiveOrganization } from "@/lib/organization/active-org"

const BUCKET = "org-media"
const ROADMAP_INLINE_BUCKET = "roadmap-media"
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 30
const MAX_BYTES = 10 * 1024 * 1024
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]) as Set<string>

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

  const { orgId, role } = await resolveActiveOrganization(supabase, user.id)
  if (!canEditOrganization(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const kindParam = searchParams.get("kind")
  const kind =
    kindParam === "logo" ||
    kindParam === "header" ||
    kindParam === "roadmap" ||
    kindParam === "roadmap-inline" ||
    kindParam === "cover"
      ? kindParam
      : "cover"
  const bucket = kind === "roadmap-inline" ? ROADMAP_INLINE_BUCKET : BUCKET

  const form = await request.formData()
  const file = form.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 })
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Unsupported image type. Use PNG, JPEG, WebP, or SVG." }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image too large. Max size is 10 MB." }, { status: 400 })
  }

  const ext = file.type.split("/").pop() || "png"
  const objectName = `${orgId}/${kind}/${Date.now()}.${ext}`
  const buf = Buffer.from(await file.arrayBuffer())

  const { error: uploadErr } = await supabase.storage.from(bucket).upload(objectName, buf, { contentType: file.type })
  if (uploadErr) {
    return NextResponse.json({ error: uploadErr.message }, { status: 500 })
  }

  if (bucket === ROADMAP_INLINE_BUCKET) {
    const { data: signed, error: signedError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(objectName, SIGNED_URL_TTL_SECONDS)
    if (signedError || !signed?.signedUrl) {
      return NextResponse.json({ error: signedError?.message ?? "Unable to access image" }, { status: 500 })
    }
    return NextResponse.json({ url: signed.signedUrl }, { status: 200 })
  }

  const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(objectName)
  return NextResponse.json({ url: publicUrl.publicUrl }, { status: 200 })
}
