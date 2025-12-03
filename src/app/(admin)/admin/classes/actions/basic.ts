"use server"

import { randomUUID } from "node:crypto"

import { redirect } from "next/navigation"

import type { PostgrestError } from "@supabase/supabase-js"

import { requireAdmin } from "@/lib/admin/auth"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase"

import { isRlsError } from "./utils"
import { revalidateClassViews } from "./revalidate"

export async function createClassAction() {
  await requireAdmin()
  const supabase = await createSupabaseServerClient()

  const slug = `class-${randomUUID().slice(0, 8)}`

  const insertPayload: Database["public"]["Tables"]["classes"]["Insert"] & Record<string, unknown> = {
    title: "Untitled Class",
    slug,
    description: "",
    is_published: false,
  }

  let data: { id: string } | null = null
  let error: PostgrestError | null = null

  {
    const response = await supabase
      .from("classes" satisfies keyof Database["public"]["Tables"])
      .insert(insertPayload)
      .select("id")
      .single<{ id: string }>()
    data = response.data
    error = response.error
  }

  if (error && isRlsError(error)) {
    const admin = createSupabaseAdminClient()
    const response = await admin
      .from("classes" satisfies keyof Database["public"]["Tables"]) 
      .insert(insertPayload)
      .select("id")
      .single<{ id: string }>()
    data = response.data
    error = response.error
  }

  if (error) throw error

  const classId = data?.id ?? null
  if (classId) {
    revalidateClassViews({ classId })
    redirect(`/admin/classes/${classId}`)
  }
}

export async function deleteClassAction(formData: FormData) {
  const classId = formData.get("classId")
  if (typeof classId !== "string") return

  await requireAdmin()
  const supabase = await createSupabaseServerClient()
  let { error } = await supabase
    .from("classes" satisfies keyof Database["public"]["Tables"]) 
    .delete()
    .eq("id", classId)

  if (error && isRlsError(error)) {
    const admin = createSupabaseAdminClient()
    const res = await admin
      .from("classes" satisfies keyof Database["public"]["Tables"]) 
      .delete()
      .eq("id", classId)
    error = res.error as typeof error
  }

  if (error) throw error
  revalidateClassViews()
}

export async function setClassPublishedAction(classId: string, published: boolean) {
  await requireAdmin()
  const supabase = await createSupabaseServerClient()

  const updatePayload: Database["public"]["Tables"]["classes"]["Update"] = { is_published: published }

  let { error } = await supabase
    .from("classes" satisfies keyof Database["public"]["Tables"]) 
    .update(updatePayload)
    .eq("id", classId)

  if (error && isRlsError(error)) {
    const admin = createSupabaseAdminClient()
    const res = await admin
      .from("classes" satisfies keyof Database["public"]["Tables"]) 
      .update(updatePayload)
      .eq("id", classId)
    error = res.error as typeof error
  }

  if (error) throw error

  const { data: classMeta } = await supabase
    .from("classes" satisfies keyof Database["public"]["Tables"]) 
    .select("slug")
    .eq("id", classId)
    .maybeSingle<{ slug: string | null }>()

  revalidateClassViews({
    classId,
    classSlug: classMeta?.slug ?? null,
  })
}

export async function moveClassPositionAction(formData: FormData) {
  const classId = formData.get("classId")
  const direction = formData.get("direction")
  if (typeof classId !== "string" || (direction !== "up" && direction !== "down")) return

  await requireAdmin()
  const supabase = await createSupabaseServerClient()

  const { data } = await supabase
    .from("classes" satisfies keyof Database["public"]["Tables"]) 
    .select("id, position")
    .order("position")

  const list = ((data ?? []) as unknown as Array<{ id: string; position?: number | null }>).
    map((r, idx) => ({ id: r.id, position: typeof r.position === "number" ? r.position! : idx + 1 }))

  const idx = list.findIndex((x) => x.id === classId)
  if (idx < 0) return
  const swapWith = direction === "up" ? idx - 1 : idx + 1
  if (swapWith < 0 || swapWith >= list.length) return

  const a = list[idx]
  const b = list[swapWith]
  const updates: Array<{ id: string; position: number }> = [
    { id: a.id, position: b.position },
    { id: b.id, position: a.position },
  ]

  for (const u of updates) {
    const updatePayload =
      { position: u.position } as unknown as Database["public"]["Tables"]["classes"]["Update"]
    const response = await supabase
      .from("classes" satisfies keyof Database["public"]["Tables"])
      .update(updatePayload)
      .eq("id", u.id)
    let updateError = response.error
    if (isRlsError(updateError)) {
      const admin = createSupabaseAdminClient()
      const adminResponse = await admin
        .from("classes" satisfies keyof Database["public"]["Tables"])
        .update(updatePayload)
        .eq("id", u.id)
      updateError = adminResponse.error
    }
    if (updateError) throw updateError
  }

  revalidateClassViews({ classId })
}

export async function reorderClassesAction(orderedIds: string[]) {
  await requireAdmin()
  const supabase = await createSupabaseServerClient()

  const updates = orderedIds.map((id, idx) => ({ id, position: idx + 1 }))
  for (const u of updates) {
    const updatePayload =
      { position: u.position } as unknown as Database["public"]["Tables"]["classes"]["Update"]
    const response = await supabase
      .from("classes" satisfies keyof Database["public"]["Tables"])
      .update(updatePayload)
      .eq("id", u.id)
    let updateError = response.error
    if (isRlsError(updateError)) {
      const admin = createSupabaseAdminClient()
      const adminResponse = await admin
        .from("classes" satisfies keyof Database["public"]["Tables"])
        .update(updatePayload)
        .eq("id", u.id)
      updateError = adminResponse.error
    }
    if (updateError) throw updateError
  }

  revalidateClassViews()
}
