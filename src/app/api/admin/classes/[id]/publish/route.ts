import { NextResponse } from "next/server"

import { requireAdmin } from "@/lib/admin/auth"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import type { Database } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id: classId } = await props.params

  if (!classId) {
    return NextResponse.json({ error: "Class id is required" }, { status: 400 })
  }

  let published: boolean | undefined
  try {
    const body = await request.json()
    if (typeof body?.published !== "boolean") {
      return NextResponse.json({ error: "Published flag required" }, { status: 400 })
    }
    published = body.published
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }

  const admin = createSupabaseAdminClient()

  const updatePayload: Database["public"]["Tables"]["classes"]["Update"] = {
    is_published: published,
  }

  const { error } = await admin
    .from("classes" satisfies keyof Database["public"]["Tables"])
    .update(updatePayload)
    .eq("id", classId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: classRow } = await admin
    .from("classes" satisfies keyof Database["public"]["Tables"])
    .select("slug")
    .eq("id", classId)
    .maybeSingle<{ slug: string | null }>()

  revalidatePath("/classes")
  revalidatePath("/training")
  if (classRow?.slug) {
    revalidatePath(`/class/${classRow.slug}`)
  }

  return NextResponse.json({ published })
}
