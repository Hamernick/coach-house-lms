import { NextResponse, type NextRequest } from "next/server"

import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route"

const BUCKET = "lms-resources"
const MAX_BYTES = 25 * 1024 * 1024

// Use a broad context type to satisfy Next's route handler typing
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

  // Check admin role
  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: string | null }>()
  if (!prof || prof.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const form = await request.formData()
  const file = form.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 25 MB)" }, { status: 400 })
  }

  // Extract moduleId from URL path to avoid context typing issues
  const segs = request.nextUrl.pathname.split("/")
  const idx = segs.findIndex((s) => s === "modules")
  const moduleId = idx >= 0 && segs.length > idx + 1 ? segs[idx + 1] : ""
  const cleanName = (file.name || "upload").replace(/[^a-zA-Z0-9._-]+/g, "-")
  const objectName = `${user.id}/modules/${moduleId}/${Date.now()}-${cleanName}`
  const buf = Buffer.from(await file.arrayBuffer())

  const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(objectName, buf, { contentType: file.type || undefined })
  if (uploadErr) {
    return NextResponse.json({ error: uploadErr.message }, { status: 500 })
  }
  const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(objectName)
  const label = cleanName
  return NextResponse.json({ url: publicUrl.publicUrl, label, path: objectName }, { status: 200 })
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
  // Admin check
  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: string | null }>()
  if (!prof || prof.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const path = request.nextUrl.searchParams.get('path')
  if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 })

  const { error: delErr } = await supabase.storage.from(BUCKET).remove([path])
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
