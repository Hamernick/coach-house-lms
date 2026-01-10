"use server"

import { redirect } from "next/navigation"

import { requireAdmin } from "@/lib/admin/auth"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/types"
import { LESSON_SUBTITLE_MAX_LENGTH, LESSON_TITLE_MAX_LENGTH, MODULE_TITLE_MAX_LENGTH, clampText } from "@/lib/lessons/limits"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { revalidateClassViews } from "../actions"
import { randomId } from "../actions/utils"

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

  const trimmedTitle = title.trim()
  const normalizedTitle = clampText(trimmedTitle, LESSON_TITLE_MAX_LENGTH)

  const rawDescription = typeof description === "string" ? description : ""
  const normalizedDescription = rawDescription.trim().length > 0
    ? clampText(rawDescription.trim(), LESSON_SUBTITLE_MAX_LENGTH)
    : null

  const updatePayload: Database["public"]["Tables"]["classes"]["Update"] = {
    title: normalizedTitle,
    slug: slug.trim(),
    description: normalizedDescription,
    stripe_product_id: typeof stripeProductId === "string" && stripeProductId.length > 0 ? stripeProductId : null,
    stripe_price_id: typeof stripePriceId === "string" && stripePriceId.length > 0 ? stripePriceId : null,
  }

  // Fetch current slug to revalidate old/new paths
  const { data: before } = await supabase
    .from("classes" satisfies keyof Database["public"]["Tables"]) 
    .select("slug")
    .eq("id", classId)
    .maybeSingle<{ slug: string | null }>()

  let { error } = await supabase
    .from("classes" satisfies keyof Database["public"]["Tables"]) 
    .update<Database["public"]["Tables"]["classes"]["Update"]>(updatePayload)
    .eq("id", classId)

  if (error) {
    // RLS fallback for admins using service role (server-side only)
    const admin = createSupabaseAdminClient()
    const res = await admin
      .from("classes" satisfies keyof Database["public"]["Tables"]) 
      .update(updatePayload)
      .eq("id", classId)
    error = res.error as typeof error
  }

  if (error) throw error

  const prevSlug = before?.slug ?? null
  const nextSlug = slug.trim()

  await revalidateClassViews({
    classId,
    classSlug: nextSlug,
    additionalTargets: prevSlug && prevSlug !== nextSlug ? [`/class/${prevSlug}`] : undefined,
  })
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
  const slug = `module-${randomId().slice(0, 8)}`

  const insertPayload: Database["public"]["Tables"]["modules"]["Insert"] & Record<string, unknown> = {
    class_id: classId,
    idx: nextIdx,
    slug,
    title: clampText("Untitled Module", MODULE_TITLE_MAX_LENGTH),
    content_md: "",
    is_published: false,
    // Back-compat with test schema expecting 'published'
    published: false,
  }

  const { data, error } = await supabase
    .from("modules" satisfies keyof Database["public"]["Tables"])
    .insert(insertPayload)
    .select("id")
    .single<{ id: string }>()

  if (error) {
    throw error
  }

  await revalidateClassViews({ classId })

  if (data?.id) {
    redirect(`/admin/modules/${data.id}`)
  }
}

export async function reorderModulesAction(classId: string, orderedIds: string[]) {
  await requireAdmin()
  const supabase = await createSupabaseServerClient()

  const { data: maxRow, error: maxError } = await supabase
    .from("modules" satisfies keyof Database["public"]["Tables"])
    .select("idx")
    .eq("class_id", classId)
    .order("idx", { ascending: false })
    .limit(1)
    .maybeSingle<{ idx: number | null }>()

  if (maxError) {
    throw maxError
  }

  const currentMaxIdx = maxRow?.idx ?? 0
  const tempBase = currentMaxIdx + orderedIds.length + 1

  const bumpResponses = await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from("modules" satisfies keyof Database["public"]["Tables"])
        .update<Database["public"]["Tables"]["modules"]["Update"]>({ idx: tempBase + index })
        .eq("id", id)
    )
  )

  const bumpFailed = bumpResponses.find((response) => response.error)
  if (bumpFailed?.error) {
    throw bumpFailed.error
  }

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

  const { data: classRow } = await supabase
    .from("classes" satisfies keyof Database["public"]["Tables"])
    .select("slug")
    .eq("id", classId)
    .maybeSingle<{ slug: string | null }>()

  await revalidateClassViews({
    classId,
    classSlug: classRow?.slug ?? null,
  })
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

  await revalidateClassViews({
    classId,
    additionalTargets: [`/admin/modules/${moduleId}`],
  })
}

export async function setModulePublishedAction(moduleId: string, classId: string, published: boolean) {
  await requireAdmin()
  const supabase = await createSupabaseServerClient()

  const publishPayload: Database["public"]["Tables"]["modules"]["Update"] = { is_published: published }

  const { error } = await supabase
    .from("modules" satisfies keyof Database["public"]["Tables"])
    .update(publishPayload)
    .eq("id", moduleId)

  if (error) {
    throw error
  }

  const [{ data: moduleMeta }, { data: classMeta }] = await Promise.all([
    supabase
      .from("modules" satisfies keyof Database["public"]["Tables"])
      .select("idx, slug")
      .eq("id", moduleId)
      .maybeSingle<{ idx: number | null; slug: string | null }>(),
    supabase
      .from("classes" satisfies keyof Database["public"]["Tables"])
      .select("slug")
      .eq("id", classId)
      .maybeSingle<{ slug: string | null }>(),
  ])

  const additionalTargets: string[] = [`/admin/modules/${moduleId}`]
  if (classMeta?.slug && moduleMeta?.idx != null) {
    additionalTargets.push(`/class/${classMeta.slug}/module/${moduleMeta.idx}`)
  }

  await revalidateClassViews({
    classId,
    classSlug: classMeta?.slug ?? null,
    additionalTargets,
  })
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

  console.log("ADMIN_AUDIT", JSON.stringify({ action: "enroll_user", classId, userId: user.id, email }))

  await revalidateClassViews({ classId })
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

  console.log("ADMIN_AUDIT", JSON.stringify({ action: "unenroll_user", classId, userId }))

  await revalidateClassViews({ classId })
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

  const token = randomId()

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

  console.log("ADMIN_AUDIT", JSON.stringify({ action: "create_enrollment_invite", classId, email, expiresAt }))

  await revalidateClassViews({ classId })
}
