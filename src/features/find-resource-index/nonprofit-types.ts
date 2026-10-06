export type NonprofitDirectoryItem = {
  ein: string
  name: string
  city: string | null
  state: string | null
  postalCode: string | null
  website: string | null
  phone: string | null
  description: string | null
  websiteBasis: "source_reported" | "provider_confirmed" | null
  websiteSourcePeriod: string | null
  phoneBasis: "source_reported" | "provider_confirmed" | null
  phoneSourcePeriod: string | null
  descriptionSourcePeriod: string | null
  operatingStatus: "unknown"
  listingType: "nonprofit_organization"
}

export type NonprofitDirectorySearchResponse = {
  version: 1
  items: NonprofitDirectoryItem[]
  page: { hasMore: boolean; nextCursor: string | null; limit: number }
}
