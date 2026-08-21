import { requireAdmin } from "@/lib/admin/auth"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

import type {
  PublicMapClaimDeliveryStatus,
  PublicMapClaimRequest,
  PublicMapClaimQueue,
  PublicMapClaimStatus,
  PublicMapClaimTargetKind,
} from "../types"

function mapClaimRow(row: {
  id: string
  target_kind: string
  target_id: string | null
  listing_name: string
  claimant_name: string
  claimant_email: string
  message: string | null
  status: string
  task_id: string | null
  delivery_status: string
  delivery_error: string | null
  assigned_to: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}): PublicMapClaimRequest {
  return {
    assignedTo: row.assigned_to,
    claimantEmail: row.claimant_email,
    claimantName: row.claimant_name,
    createdAt: row.created_at,
    deliveryError: row.delivery_error,
    deliveryStatus: row.delivery_status as PublicMapClaimDeliveryStatus,
    id: row.id,
    listingName: row.listing_name,
    message: row.message,
    reviewedAt: row.reviewed_at,
    reviewedBy: row.reviewed_by,
    status: row.status as PublicMapClaimStatus,
    targetId: row.target_id,
    targetKind: row.target_kind as PublicMapClaimTargetKind,
    taskId: row.task_id,
    updatedAt: row.updated_at,
  }
}

export async function loadPublicMapClaimQueue({
  limit = 50,
  offset = 0,
}: {
  limit?: number
  offset?: number
} = {}): Promise<PublicMapClaimQueue> {
  await requireAdmin()
  const pageSize = Math.min(Math.max(Math.trunc(limit), 1), 100)
  const normalizedOffset = Math.max(Math.trunc(offset), 0)
  const admin = createSupabaseAdminClient()
  const { data, error, count } = await admin
    .from("public_map_claim_requests")
    .select(
      "id,target_kind,target_id,listing_name,claimant_name,claimant_email,message,status,task_id,delivery_status,delivery_error,assigned_to,reviewed_by,reviewed_at,created_at,updated_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(normalizedOffset, normalizedOffset + pageSize - 1)

  if (error) throw new Error("Unable to load public map claim requests.")
  return {
    claims: (data ?? []).map(mapClaimRow),
    page: Math.floor(normalizedOffset / pageSize) + 1,
    pageSize,
    total: count ?? data?.length ?? 0,
  }
}
