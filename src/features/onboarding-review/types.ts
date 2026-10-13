import type { PricingPlanTier } from "@/lib/billing/plan-tier"
export type ReviewState = {
  id: string
  label: string
  userId: string
  organizationId: string
  isPlatformStaff: boolean
  userMetadata: Record<string, unknown>
  organizationProfile: Record<string, unknown>
  publicSlug: string | null
  planTier: PricingPlanTier
}
