export type PublicMapClaimTargetKind =
  | "platform_organization"
  | "resource_map_organization"
  | "new"

export type PublicMapClaimListingOption = {
  id: string
  name: string
}

export type PublicMapClaimStatus =
  | "new"
  | "reviewing"
  | "verified"
  | "approved"
  | "rejected"
  | "spam"

export type PublicMapClaimDeliveryStatus = "pending" | "delivered" | "failed"

export type PublicMapClaimRequest = {
  id: string
  targetKind: PublicMapClaimTargetKind
  targetId: string | null
  listingName: string
  claimantName: string
  claimantEmail: string
  message: string | null
  status: PublicMapClaimStatus
  taskId: string | null
  deliveryStatus: PublicMapClaimDeliveryStatus
  deliveryError: string | null
  assignedTo: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
}

export type PublicMapClaimSubmitResult =
  | { ok: true; claimId: string }
  | { ok: false; code: "invalid" | "rate_limited" | "unavailable" }

export type PublicMapClaimQueue = {
  claims: PublicMapClaimRequest[]
  page: number
  pageSize: number
  total: number
}
