"use server"

import { randomUUID } from "node:crypto"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireAdmin } from "@/lib/admin/auth"

export async function updateClassDetailsAction(formData: FormData) {
  const classId = formData.get("classId")
  const title = formData.get("title")
  const slug = formData.get("slug")
  const description = formData.get("description")
  const stripeProductId = formData.get("stripeProductId")
  const stripePriceId = formData.get("stripePriceId")

  if (typeof classId !== "string" || typeof title !== "string" || typeof slug !== "string") {
    return
  }

  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from("classes")
    // @ts-expect-error: @supabase/ssr currently loses table typings under Next 15 promises
    .update({
      title: title.trim(),
      slug: slug.trim(),
      description: typeof description === "string" ? description : null,
      stripe_product_id: typeof stripeProductId === "string" && stripeProductId.length > 0 ? stripeProductId : null,
      stripe_price_id: typeof stripePriceId === "string" && stripePriceId.length > 0 ? stripePriceId : null,
    })
    .eq("id", classId)

  if (error) {
    throw error
  }

  revalidatePath(`/admin/classes/${classId}`)
  revalidatePath("/admin/classes")
}

export async function createModuleAction(formData: FormData) {
  const classId = formData.get("classId")

  if (typeof classId !== "string") {
    return
  }

  const { supabase } = await requireAdmin()

  const { data: maxIdxData, error: idxError } = await supabase
    .from("modules")
    .select("idx")
    .eq("class_id", classId)
    .order("idx", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (idxError) {
    throw idxError
  }

  const currentMaxIdx = (maxIdxData as { idx: number } | null)?.idx ?? 0
  const nextIdx = currentMaxIdx + 1
  const slug = `module-${randomUUID().slice(0, 8)}`

  const { data, error } = await supabase
    .from("modules")
    // @ts-expect-error: @supabase/ssr currently loses table typings under Next 15 promises
    .insert({
      class_id: classId,
      idx: nextIdx,
      slug,
      title: "Untitled Module",
      content_md: "",
      published: false,
    })
    .select("id")
    .single()

  if (error) {
    throw error
  }

  revalidatePath(`/admin/classes/${classId}`)

  const createdModule = data as { id: string } | null
  if (createdModule?.id) {
    redirect(`/admin/modules/${createdModule.id}`)
  }
}

export async function reorderModulesAction(classId: string, orderedIds: string[]) {
  const { supabase } = await requireAdmin()

  const updates = orderedIds.map((id, index) => ({ id, idx: index + 1 }))

  const { error } = await supabase.from("modules")
    // @ts-expect-error: @supabase/ssr currently loses table typings under Next 15 promises
    .upsert(updates, { onConflict: "id" })

  if (error) {
    throw error
  }

  revalidatePath(`/admin/classes/${classId}`)
}

export async function deleteModuleAction(formData: FormData) {
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
}

export async function setModulePublishedAction(moduleId: string, classId: string, published: boolean) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from("modules")
    // @ts-expect-error: @supabase/ssr currently loses table typings under Next 15 promises
    .update({ published })
    .eq("id", moduleId)

  if (error) {
    throw error
  }

  revalidatePath(`/admin/classes/${classId}`)
  revalidatePath(`/admin/modules/${moduleId}`)
}
