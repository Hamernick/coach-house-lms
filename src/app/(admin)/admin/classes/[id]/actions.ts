"use server"

import { randomUUID } from "node:crypto"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireAdmin } from "@/lib/admin/auth"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/types"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

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

  await requireAdmin()
  const supabase = await createSupabaseServerClient()

  const updatePayload: Database["public"]["Tables"]["classes"]["Update"] = {
    title: title.trim(),
    slug: slug.trim(),
    description: typeof description === "string" ? description : null,
    stripe_product_id: typeof stripeProductId === "string" && stripeProductId.length > 0 ? stripeProductId : null,
    stripe_price_id: typeof stripePriceId === "string" && stripePriceId.length > 0 ? stripePriceId : null,
  }

  const { error } = await supabase
    .from("classes" satisfies keyof Database["public"]["Tables"])
    .update<Database["public"]["Tables"]["classes"]["Update"]>(updatePayload)
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

  await requireAdmin()
  const supabase = await createSupabaseServerClient()

  const { data: maxIdxData, error: idxError } = await supabase
    .from("modules" satisfies keyof Database["public"]["Tables"])
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

  const insertPayload: Database["public"]["Tables"]["modules"]["Insert"] = {
    class_id: classId,
    idx: nextIdx,
    slug,
    title: "Untitled Module",
    content_md: "",
    published: false,
  }

  const { data, error } = await supabase
    .from("modules" satisfies keyof Database["public"]["Tables"])
    .insert(insertPayload)
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
  await requireAdmin()
  const supabase = await createSupabaseServerClient()

  const updateResponses = await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from("modules" satisfies keyof Database["public"]["Tables"])
        .update<Database["public"]["Tables"]["modules"]["Update"]>({ idx: index + 1 })
        .eq("id", id)
    )
  )

  const failed = updateResponses.find((response) => response.error)
  if (failed?.error) {
    throw failed.error
  }

  revalidatePath(`/admin/classes/${classId}`)
}

export async function deleteModuleAction(formData: FormData) {
  const moduleId = formData.get("moduleId")
  const classId = formData.get("classId")

  if (typeof moduleId !== "string" || typeof classId !== "string") {
    return
  }

  await requireAdmin()
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("modules" satisfies keyof Database["public"]["Tables"])
    .delete()
    .eq("id", moduleId)

  if (error) {
    throw error
  }

  revalidatePath(`/admin/classes/${classId}`)
}

export async function setModulePublishedAction(moduleId: string, classId: string, published: boolean) {
  await requireAdmin()
  const supabase = await createSupabaseServerClient()

  const publishPayload: Database["public"]["Tables"]["modules"]["Update"] = { published }

  const { error } = await supabase
    .from("modules" satisfies keyof Database["public"]["Tables"])
    .update(publishPayload)
    .eq("id", moduleId)

  if (error) {
    throw error
  }

  revalidatePath(`/admin/classes/${classId}`)
  revalidatePath(`/admin/modules/${moduleId}`)
}

export async function enrollUserByEmailAction(formData: FormData) {
  const classId = formData.get("classId")
  const email = formData.get("email")

  if (typeof classId !== "string" || typeof email !== "string") {
    return
  }

  await requireAdmin()
  const admin = createSupabaseAdminClient()

  // Find user by email via admin API
  const { data: userList, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (listErr) throw listErr

  const user = userList.users.find((u) => (u.email ?? "").toLowerCase() === email.toLowerCase())
  if (!user) {
    throw new Error("User not found for email")
  }

  const supabase = await createSupabaseServerClient()
  const insertPayload: Database["public"]["Tables"]["enrollments"]["Insert"] = {
    user_id: user.id,
    class_id: classId,
    status: "active",
  }

  const { error } = await supabase
    .from("enrollments" satisfies keyof Database["public"]["Tables"])
    .upsert(insertPayload, { onConflict: "user_id,class_id" })

  if (error) throw error

  revalidatePath(`/admin/classes/${classId}`)
}

export async function unenrollUserAction(formData: FormData) {
  const classId = formData.get("classId")
  const userId = formData.get("userId")

  if (typeof classId !== "string" || typeof userId !== "string") {
    return
  }

  await requireAdmin()
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("enrollments" satisfies keyof Database["public"]["Tables"])
    .delete()
    .eq("class_id", classId)
    .eq("user_id", userId)

  if (error) throw error

  revalidatePath(`/admin/classes/${classId}`)
}

export async function createEnrollmentInviteAction(formData: FormData) {
  const classId = formData.get("classId")
  const email = formData.get("email")
  const days = formData.get("days")

  if (typeof classId !== "string" || typeof email !== "string") {
    return
  }

  const expiresDays = typeof days === "string" && days.length > 0 ? Number.parseInt(days, 10) : 7
  const expiresAt = new Date(Date.now() + expiresDays * 24 * 3600 * 1000)

  await requireAdmin()
  const supabase = await createSupabaseServerClient()

  const token = randomUUID()

  const insertPayload: Database["public"]["Tables"]["enrollment_invites"]["Insert"] = {
    class_id: classId,
    email,
    token,
    expires_at: expiresAt.toISOString(),
  }

  const { error } = await supabase
    .from("enrollment_invites" satisfies keyof Database["public"]["Tables"])
    .insert(insertPayload)

  if (error) throw error

  revalidatePath(`/admin/classes/${classId}`)
}
