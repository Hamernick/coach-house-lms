"use server"

import { randomUUID } from "node:crypto"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import { requireAdmin } from "@/lib/admin/auth"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import type { Database } from "@/lib/supabase"

export async function createClassAction() {
  await requireAdmin()
  const supabase = await createSupabaseServerClient()

  const slug = `class-${randomUUID().slice(0, 8)}`

  const insertPayload: Database["public"]["Tables"]["classes"]["Insert"] & Record<string, unknown> = {
    title: "Untitled Class",
    slug,
    description: "",
    published: false,
  }

  let { data, error } = await supabase
    .from("classes" satisfies keyof Database["public"]["Tables"]) 
    .insert(insertPayload)
    .select("id")
    .single()

  // RLS fallback for admins using service role (server-side only)
  if (error && (error.message?.toLowerCase().includes("row-level security") || error.code === "42501")) {
    const admin = createSupabaseAdminClient()
    const res = await admin
      .from("classes" satisfies keyof Database["public"]["Tables"]) 
      .insert(insertPayload)
      .select("id")
      .single()
    data = res.data as typeof data
    error = res.error as typeof error
  }

  if (error) {
    throw error
  }

  if (data?.id) {
    redirect(`/admin/classes/${data.id}`)
  }
}

export async function deleteClassAction(formData: FormData) {
  const classId = formData.get("classId")

  if (typeof classId !== "string") {
    return
  }

  await requireAdmin()
  const supabase = await createSupabaseServerClient()
  let { error } = await supabase
    .from("classes" satisfies keyof Database["public"]["Tables"]) 
    .delete()
    .eq("id", classId)

  if (error && (error.message?.toLowerCase().includes("row-level security") || error.code === "42501")) {
    const admin = createSupabaseAdminClient()
    const res = await admin
      .from("classes" satisfies keyof Database["public"]["Tables"]) 
      .delete()
      .eq("id", classId)
    error = res.error as typeof error
  }

  if (error) {
    throw error
  }

  revalidatePath("/admin/classes")
}

export async function setClassPublishedAction(classId: string, published: boolean) {
  await requireAdmin()
  const supabase = await createSupabaseServerClient()

  const updatePayload: Database["public"]["Tables"]["classes"]["Update"] = { published }

  let { error } = await supabase
    .from("classes" satisfies keyof Database["public"]["Tables"]) 
    .update(updatePayload)
    .eq("id", classId)

  if (error && (error.message?.toLowerCase().includes("row-level security") || error.code === "42501")) {
    const admin = createSupabaseAdminClient()
    const res = await admin
      .from("classes" satisfies keyof Database["public"]["Tables"]) 
      .update(updatePayload)
      .eq("id", classId)
    error = res.error as typeof error
  }

  if (error) {
    throw error
  }

  revalidatePath("/admin/classes")
  revalidatePath(`/admin/classes/${classId}`)
}

export async function createClassWizardAction(formData: FormData) {
  const title = formData.get("title")
  const slug = formData.get("slug")
  const description = formData.get("description")
  const published = formData.get("published") === "true"
  const sessionNumber = formData.get("sessionNumber")
  const initialModules = formData.get("initialModules")

  if (typeof title !== "string" || typeof slug !== "string") {
    return { error: "Missing title or slug" }
  }

  await requireAdmin()
  const supabase = await createSupabaseServerClient()

  // Determine next position
  const { data: rows } = await supabase
    .from("classes" satisfies keyof Database["public"]["Tables"]) 
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
  const nextPos = ((rows?.[0] as { position?: number } | undefined)?.position ?? 0) + 1

  const insertPayload: Database["public"]["Tables"]["classes"]["Insert"] = {
    title: title.trim(),
    slug: slug.trim(),
    description: typeof description === "string" ? description : null,
    published,
    // @ts-expect-error local types may not include 'position' in classes yet
    position: nextPos,
    // Note: session_number may not exist in local generated types; cast via any to allow insert
    ...(typeof sessionNumber === 'string' && sessionNumber ? { session_number: Number.parseInt(sessionNumber, 10) } : {}),
  }

  let { data: created, error } = await supabase
    .from("classes" satisfies keyof Database["public"]["Tables"]) 
    .insert(insertPayload)
    .select("id")
    .single()

  if (error && (error.message?.toLowerCase().includes("row-level security") || error.code === "42501")) {
    const admin = createSupabaseAdminClient()
    const res = await admin
      .from("classes" satisfies keyof Database["public"]["Tables"]) 
      .insert(insertPayload)
      .select("id")
      .single()
    created = res.data as typeof created
    error = res.error as typeof error
  }

  if (error) return { error: error.message }
  const classId = (created as { id: string }).id

  const modulesCount = typeof initialModules === 'string' && initialModules ? Math.max(0, Math.min(10, Number.parseInt(initialModules, 10))) : 0
  if (modulesCount > 0) {
    const inserts: Database["public"]["Tables"]["modules"]["Insert"][] = []
    for (let i = 1; i <= modulesCount; i++) {
      inserts.push({ class_id: classId, idx: i, slug: `m${i}`, title: `Module ${i}`, published: false })
    }
    let { error: mErr } = await supabase
      .from("modules" satisfies keyof Database["public"]["Tables"]) 
      .insert(inserts)
    if (mErr && (mErr.message?.toLowerCase().includes("row-level security") || (mErr as any).code === "42501")) {
      const admin = createSupabaseAdminClient()
      const res = await admin
        .from("modules" satisfies keyof Database["public"]["Tables"]) 
        .insert(inserts)
      mErr = res.error as typeof mErr
    }
    if (mErr) return { error: mErr.message, id: classId }
  }

  revalidatePath("/admin/academy")
  revalidatePath("/admin/classes")
  return { id: classId }
}

export async function moveClassPositionAction(formData: FormData) {
  const classId = formData.get("classId")
  const direction = formData.get("direction")
  if (typeof classId !== 'string' || (direction !== 'up' && direction !== 'down')) return

  await requireAdmin()
  const supabase = await createSupabaseServerClient()

  const { data } = await supabase
    .from("classes" satisfies keyof Database["public"]["Tables"]) 
    .select("id, position")
    .order("position")

  const list = ((data ?? []) as unknown as Array<{ id: string; position?: number | null }>).
    map((r, idx) => ({ id: r.id, position: typeof r.position === 'number' ? r.position! : idx + 1 }))

  const idx = list.findIndex((x) => x.id === classId)
  if (idx < 0) return
  const swapWith = direction === 'up' ? idx - 1 : idx + 1
  if (swapWith < 0 || swapWith >= list.length) return

  const a = list[idx]
  const b = list[swapWith]
  const updates: Array<{ id: string; position: number }> = [
    { id: a.id, position: b.position },
    { id: b.id, position: a.position },
  ]

  // Persist swaps
  for (const u of updates) {
    // @ts-expect-error local types may not include 'position' in classes yet
    let { error } = await supabase.from("classes").update({ position: u.position }).eq("id", u.id)
    if (error && (error.message?.toLowerCase().includes("row-level security") || error.code === "42501")) {
      const admin = createSupabaseAdminClient()
      const res = await admin.from("classes").update({ position: u.position }).eq("id", u.id)
      error = res.error as typeof error
    }
    if (error) throw error
  }

  revalidatePath("/admin/academy")
  revalidatePath("/admin/classes")
}

export async function reorderClassesAction(orderedIds: string[]) {
  await requireAdmin()
  const supabase = await createSupabaseServerClient()

  const updates = orderedIds.map((id, idx) => ({ id, position: idx + 1 }))
  for (const u of updates) {
    // @ts-expect-error local types may not include 'position' in classes yet
    let { error } = await supabase.from('classes').update({ position: u.position }).eq('id', u.id)
    if (error && (error.message?.toLowerCase().includes("row-level security") || error.code === "42501")) {
      const admin = createSupabaseAdminClient()
      const res = await admin.from('classes').update({ position: u.position }).eq('id', u.id)
      error = res.error as typeof error
    }
    if (error) throw error
  }

  revalidatePath('/admin/academy')
  revalidatePath('/admin/classes')
}
