"use server"

import { revalidatePath } from "next/cache"

import { requireAdmin } from "@/lib/admin/auth"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

import type { PublicMapClaimStatus } from "../types"
import { retryPublicMapClaimDelivery } from "./submission"

const claimStatuses = new Set<PublicMapClaimStatus>([
  "new",
  "reviewing",
  "verified",
  "approved",
  "rejected",
  "spam",
])

export async function updatePublicMapClaimStatusFormAction(formData: FormData) {
  const { userId } = await requireAdmin()
  const claimId = String(formData.get("claimId") ?? "").trim()
  const status = String(
    formData.get("status") ?? ""
  ).trim() as PublicMapClaimStatus
  if (!claimId || !claimStatuses.has(status)) return

  const admin = createSupabaseAdminClient()
  const { error } = await admin
    .from("public_map_claim_requests")
    .update({
      reviewed_at: new Date().toISOString(),
      reviewed_by: userId,
      status,
    })
    .eq("id", claimId)
  if (error) throw new Error("Unable to update claim request.")
  revalidatePath("/admin/platform/resource-map")
}

export async function retryPublicMapClaimDeliveryFormAction(
  formData: FormData
) {
  await requireAdmin()
  const claimId = String(formData.get("claimId") ?? "").trim()
  if (!claimId) return
  await retryPublicMapClaimDelivery(claimId)
  revalidatePath("/admin/platform/resource-map")
}
