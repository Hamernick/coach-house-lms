"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireAdmin } from "@/lib/admin/auth"
import { uploadModuleDeck, removeModuleDeck } from "@/lib/storage/decks"

export async function updateModuleDetailsAction(formData: FormData) {
  const moduleId = formData.get("moduleId")
  const classId = formData.get("classId")
  const title = formData.get("title")
  const slug = formData.get("slug")
  const description = formData.get("description")
  const videoUrl = formData.get("videoUrl")
  const duration = formData.get("durationMinutes")
  const content = formData.get("contentMd")

  if (
    typeof moduleId !== "string" ||
    typeof classId !== "string" ||
    typeof title !== "string" ||
    typeof slug !== "string"
  ) {
    return
  }

  const { supabase } = await requireAdmin()

  const durationValue =
    typeof duration === "string" && duration.length > 0
      ? Number.parseInt(duration, 10)
      : null

  const { error } = await supabase
    .from("modules")
    .update({
      title: title.trim(),
      slug: slug.trim(),
      description: typeof description === "string" ? description : null,
      video_url: typeof videoUrl === "string" && videoUrl.length > 0 ? videoUrl : null,
      duration_minutes: Number.isFinite(durationValue) ? durationValue : null,
      content_md: typeof content === "string" ? content : null,
    })
    .eq("id", moduleId)

  if (error) {
    throw error
  }

  revalidatePath(`/admin/classes/${classId}`)
  revalidatePath(`/admin/modules/${moduleId}`)
}

export async function deleteModuleFromDetailAction(formData: FormData) {
  const moduleId = formData.get("moduleId")
  const classId = formData.get("classId")

  if (typeof moduleId !== "string" || typeof classId !== "string") {
    return
  }

  const { supabase } = await requireAdmin()

  const { error } = await supabase.from("modules").delete().eq("id", moduleId)

  if (error) {
    throw error
  }

  revalidatePath(`/admin/classes/${classId}`)
  redirect(`/admin/classes/${classId}`)
}

export async function uploadModuleDeckAction(formData: FormData) {
  const moduleId = formData.get("moduleId")
  const classId = formData.get("classId")
  const file = formData.get("deck")

  if (typeof moduleId !== "string" || typeof classId !== "string" || !(file instanceof File)) {
    return
  }

  if (file.size === 0) {
    return
  }

  if (file.type !== "application/pdf") {
    throw new Error("Deck must be a PDF file")
  }

  if (file.size > 15 * 1024 * 1024) {
    throw new Error("Deck exceeds 15MB limit")
  }

  const { supabase } = await requireAdmin()

  const { data: moduleRow, error } = await supabase
    .from("modules")
    .select("deck_path")
    .eq("id", moduleId)
    .maybeSingle()

  if (error) {
    throw error
  }

  const deckPath = await uploadModuleDeck({
    moduleId,
    filename: file.name,
    fileBuffer: await file.arrayBuffer(),
    previousPath: moduleRow?.deck_path ?? undefined,
  })

  const { error: updateError } = await supabase
    .from("modules")
    .update({ deck_path: deckPath })
    .eq("id", moduleId)

  if (updateError) {
    throw updateError
  }

  revalidatePath(`/admin/modules/${moduleId}`)
  revalidatePath(`/admin/classes/${classId}`)
}

export async function removeModuleDeckAction(formData: FormData) {
  const moduleId = formData.get("moduleId")
  const classId = formData.get("classId")

  if (typeof moduleId !== "string" || typeof classId !== "string") {
    return
  }

  const { supabase } = await requireAdmin()

  const { data, error } = await supabase
    .from("modules")
    .select("deck_path")
    .eq("id", moduleId)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (data?.deck_path) {
    await removeModuleDeck(data.deck_path)
  }

  const { error: updateError } = await supabase
    .from("modules")
    .update({ deck_path: null })
    .eq("id", moduleId)

  if (updateError) {
    throw updateError
  }

  revalidatePath(`/admin/modules/${moduleId}`)
  revalidatePath(`/admin/classes/${classId}`)
}
