"use server"

import { randomUUID } from "node:crypto"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import { requireAdmin } from "@/lib/admin/auth"

export async function createClassAction() {
  const { supabase } = await requireAdmin()

  const slug = `class-${randomUUID().slice(0, 8)}`

  const { data, error } = await supabase
    .from("classes")
    .insert({
      title: "Untitled Class",
      slug,
      description: "",
      published: false,
    })
    .select("id")
    .single()

  if (error) {
    throw error
  }

  redirect(`/admin/classes/${data.id}`)
}

export async function deleteClassAction(formData: FormData) {
  const classId = formData.get("classId")

  if (typeof classId !== "string") {
    return
  }

  const { supabase } = await requireAdmin()

  const { error } = await supabase.from("classes").delete().eq("id", classId)

  if (error) {
    throw error
  }

  revalidatePath("/admin/classes")
}

export async function setClassPublishedAction(classId: string, published: boolean) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from("classes")
    .update({ published })
    .eq("id", classId)

  if (error) {
    throw error
  }

  revalidatePath("/admin/classes")
  revalidatePath(`/admin/classes/${classId}`)
}
