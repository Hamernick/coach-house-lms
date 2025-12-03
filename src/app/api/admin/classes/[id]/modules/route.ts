import { NextResponse } from "next/server"
import { randomUUID } from "node:crypto"

import { requireAdmin } from "@/lib/admin/auth"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase"
import { revalidateClassViews } from "@/app/(admin)/admin/classes/actions"

function isRlsError(error: { message?: string | null; code?: string | number | null } | null | undefined) {
  if (!error) return false
  const message = String(error.message ?? "").toLowerCase()
  const code = error.code != null ? String(error.code) : ""
  return message.includes("row-level security") || code === "42501"
}

export async function POST(_req: Request, props: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id: classId } = await props.params

  if (!classId) {
    return NextResponse.json({ error: "Class id is required" }, { status: 400 })
  }

  const supabase = await createSupabaseServerClient()
  const admin = createSupabaseAdminClient()

  let maxIdx = 0
  {
    const { data, error } = await supabase
      .from("modules" satisfies keyof Database["public"]["Tables"])
      .select("idx")
      .eq("class_id", classId)
      .order("idx", { ascending: false })
      .limit(1)
      .maybeSingle<{ idx: number | null }>()

    if (error && isRlsError(error)) {
      const { data: adminData, error: adminError } = await admin
        .from("modules" satisfies keyof Database["public"]["Tables"])
        .select("idx")
        .eq("class_id", classId)
        .order("idx", { ascending: false })
        .limit(1)
        .maybeSingle<{ idx: number | null }>()
      if (adminError) {
        return NextResponse.json({ error: adminError.message }, { status: 500 })
      }
      maxIdx = adminData?.idx ?? 0
    } else if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    } else {
      maxIdx = data?.idx ?? 0
    }
  }

  const nextIdx = maxIdx + 1
  const slug = `module-${randomUUID().slice(0, 8)}`

  const insertPayload: Database["public"]["Tables"]["modules"]["Insert"] = {
    class_id: classId,
    idx: nextIdx,
    slug,
    title: "Untitled Module",
    content_md: "",
    is_published: false,
  }

  let moduleId: string | null = null
  {
    const { data, error } = await supabase
      .from("modules" satisfies keyof Database["public"]["Tables"])
      .insert(insertPayload)
      .select("id")
      .single<{ id: string }>()

    if (error && isRlsError(error)) {
      const { data: adminData, error: adminError } = await admin
        .from("modules" satisfies keyof Database["public"]["Tables"])
        .insert(insertPayload)
        .select("id")
        .single<{ id: string }>()
      if (adminError) {
        return NextResponse.json({ error: adminError.message }, { status: 500 })
      }

      moduleId = adminData?.id ?? null
    } else if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    } else {
      moduleId = data?.id ?? null
    }
  }

  if (!moduleId) {
    return NextResponse.json({ error: "Failed to create module" }, { status: 500 })
  }

  let classSlug: string | null = null
  {
    const { data, error } = await supabase
      .from("classes" satisfies keyof Database["public"]["Tables"])
      .select("slug")
      .eq("id", classId)
      .maybeSingle<{ slug: string | null }>()
    if (error && isRlsError(error)) {
      const { data: adminData, error: adminError } = await admin
        .from("classes" satisfies keyof Database["public"]["Tables"])
        .select("slug")
        .eq("id", classId)
        .maybeSingle<{ slug: string | null }>()
      if (adminError) {
        return NextResponse.json({ error: adminError.message }, { status: 500 })
      }
      classSlug = adminData?.slug ?? null
    } else if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    } else {
      classSlug = data?.slug ?? null
    }
  }

  await revalidateClassViews({
    classId,
    classSlug,
    additionalTargets: [`/admin/classes/${classId}`],
  })

  return NextResponse.json({ moduleId }, { status: 201 })
}
