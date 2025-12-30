import { NextResponse, type NextRequest } from "next/server"

import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route"
import { uploadAvatarWithUser, uploadAvatarAdmin } from "@/lib/storage/avatars"

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

  const form = await request.formData()
  const file = form.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 })
  }
  const MAX_BYTES = 5 * 1024 * 1024
  const allowed = new Set(["image/png", "image/jpeg", "image/webp"]) as Set<string>
  if (!allowed.has(file.type)) {
    return NextResponse.json({ error: "Unsupported image type. Use PNG, JPEG, or WebP." }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image too large. Max size is 5 MB." }, { status: 400 })
  }

  try {
    // Prefer user-credentialed upload (bucket has RLS for own folder)
    const avatarUrl = await uploadAvatarWithUser({ client: supabase, userId: user.id, file })
    await supabase.from("profiles").upsert({ id: user.id, avatar_url: avatarUrl }, { onConflict: "id" })
    return NextResponse.json({ avatarUrl }, { status: 200 })
  } catch (userUploadError: unknown) {
    // Fallback to admin upload if available (e.g., server role configured)
    try {
      const avatarUrl = await uploadAvatarAdmin({ userId: user.id, file })
      await supabase.from("profiles").upsert({ id: user.id, avatar_url: avatarUrl }, { onConflict: "id" })
      return NextResponse.json({ avatarUrl }, { status: 200 })
    } catch (adminError: unknown) {
      const adminMsg = adminError instanceof Error ? adminError.message : undefined
      const userMsg = userUploadError instanceof Error ? userUploadError.message : undefined
      return NextResponse.json({ error: adminMsg ?? userMsg ?? "Upload failed" }, { status: 500 })
    }
  }
}
