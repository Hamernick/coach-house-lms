"use server"

import { Buffer } from "node:buffer"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireAdmin } from "@/lib/admin/auth"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase"

export async function changeUserRoleAction(formData: FormData) {
  const userId = formData.get("userId")
  const nextRole = formData.get("role")

  if (typeof userId !== "string" || (nextRole !== "student" && nextRole !== "admin")) {
    return
  }

  await requireAdmin()
  const supabase = await createSupabaseServerClient()

  const updatePayload: Database["public"]["Tables"]["profiles"]["Update"] = {
    role: nextRole,
  }

  const { error } = await supabase
    .from("profiles" satisfies keyof Database["public"]["Tables"])
    .update(updatePayload)
    .eq("id", userId)

  if (error) {
    throw error
  }

  revalidatePath("/admin/users")
  revalidatePath(`/admin/users/${userId}`)
}

export async function revokeSessionsAction(formData: FormData) {
  const userId = formData.get("userId")

  if (typeof userId !== "string") {
    return
  }

  await requireAdmin()
  const admin = createSupabaseAdminClient()

  const { error } = await admin.auth.admin.signOut(userId)
  if (error) {
    throw error
  }

  revalidatePath(`/admin/users/${userId}`)
}

export async function generateMagicLinkAction(formData: FormData) {
  const userId = formData.get("userId")
  const email = formData.get("email")

  if (typeof userId !== "string" || typeof email !== "string" || email.length === 0) {
    return
  }

  await requireAdmin()
  const admin = createSupabaseAdminClient()

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  })

  if (error) {
    throw error
  }

  const link = data?.properties?.action_link
  if (!link) {
    return
  }

  const encoded = Buffer.from(link).toString("base64url")

  redirect(`/admin/users/${userId}?magic=${encoded}`)
}
