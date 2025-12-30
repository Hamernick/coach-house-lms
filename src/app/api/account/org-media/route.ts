import { NextResponse, type NextRequest } from "next/server"

import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route"

const BUCKET = "org-media"
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

  const { searchParams } = new URL(request.url)
  const kindParam = searchParams.get("kind")
  const kind =
    kindParam === "logo" || kindParam === "header" || kindParam === "roadmap" || kindParam === "cover"
      ? kindParam
      : "cover"

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
  const objectName = `${user.id}/${kind}/${Date.now()}.${ext}`
  const buf = Buffer.from(await file.arrayBuffer())

  const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(objectName, buf, { contentType: file.type })
  if (uploadErr) {
    return NextResponse.json({ error: uploadErr.message }, { status: 500 })
  }
  const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(objectName)
  return NextResponse.json({ url: publicUrl.publicUrl }, { status: 200 })
}
