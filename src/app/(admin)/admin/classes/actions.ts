"use server"

import { randomUUID } from "node:crypto"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import { requireAdmin } from "@/lib/admin/auth"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase"

export async function createClassAction() {
  await requireAdmin()
  const supabase = createSupabaseServerClient()

  const slug = `class-${randomUUID().slice(0, 8)}`

  const insertPayload: Database["public"]["Tables"]["classes"]["Insert"] = {
    title: "Untitled Class",
    slug,
    description: "",
    published: false,
  }

  const { data, error } = await supabase
    .from("classes" satisfies keyof Database["public"]["Tables"])
    .insert(insertPayload)
    .select("id")
    .single()

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
  const supabase = createSupabaseServerClient()

  const { error } = await supabase
    .from("classes" satisfies keyof Database["public"]["Tables"])
    .delete()
    .eq("id", classId)

  if (error) {
    throw error
  }

  revalidatePath("/admin/classes")
}

export async function setClassPublishedAction(classId: string, published: boolean) {
  await requireAdmin()
  const supabase = createSupabaseServerClient()

  const updatePayload: Database["public"]["Tables"]["classes"]["Update"] = { published }

  const { error } = await supabase
    .from("classes" satisfies keyof Database["public"]["Tables"])
    .update(updatePayload)
    .eq("id", classId)

  if (error) {
    throw error
  }

  revalidatePath("/admin/classes")
  revalidatePath(`/admin/classes/${classId}`)
}
