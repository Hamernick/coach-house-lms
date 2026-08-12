import type {
  PublicMapItemVisibility,
  PublicMapVerificationStatus,
} from "@/lib/public-map/resource-map-items"
import type { PublicMapResourceCategoryKey } from "@/lib/public-map/resource-categories"
import type { PublicMapResourceAvailabilityStatus } from "@/lib/public-map/resource-availability"

export type FindResourceIndexAvailability = {
  status: PublicMapResourceAvailabilityStatus
  statusLabel: string
  openNow: boolean | null
}

export type FindResourceIndexItem = {
  id: string
  itemType: "external_resource"
  title: string
  subtitle: string | null
  latitude: number | null
  longitude: number | null
  city: string | null
  state: string | null
  country: string | null
  resourceCategories: PublicMapResourceCategoryKey[]
  primaryResourceCategory: PublicMapResourceCategoryKey
  verificationStatus: PublicMapVerificationStatus
  visibility: PublicMapItemVisibility
  markerImageUrl?: string | null
  availability?: FindResourceIndexAvailability
}

export type FindResourceIndexResponse = {
  version: 2
  resourceItems: FindResourceIndexItem[]
  page: {
    hasMore: boolean
    limit: number
    nextCursor: string | null
    totalCount: number
  }
}
