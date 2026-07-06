export type ResourceMapAdminActionResult =
  | { ok: true; id: string }
  | { error: string }

export type ResourceMapAdminCanonicalTarget =
  | { target: "organization"; id: string }
  | { target: "service"; id: string }

export type ResourceMapAdminCanonicalAction =
  | "approve"
  | "hide"
  | "suppress"
  | "restore"
  | "delete"

export type ResourceMapAdminImportReviewStatus =
  | "needs_review"
  | "approved"
  | "rejected"
  | "stale"

export type ResourceMapAdminMatchStatus = "accepted" | "rejected" | "superseded"

export type ResourceMapAdminCanonicalStateInput =
  ResourceMapAdminCanonicalTarget & {
    action: ResourceMapAdminCanonicalAction
    reason?: string | null
  }

export type ResourceMapAdminCanonicalEditInput =
  ResourceMapAdminCanonicalTarget & {
    fields: Record<string, string | null | undefined>
    reason?: string | null
  }

export type ResourceMapAdminImportReviewInput = {
  importRecordId: string
  status: ResourceMapAdminImportReviewStatus
  reason?: string | null
}

export type ResourceMapAdminVisibilityInput = {
  id: string
  kind: "contact" | "link"
  isPublic: boolean
  reason?: string | null
}

export type ResourceMapAdminMatchReviewInput = {
  matchId: string
  status: ResourceMapAdminMatchStatus
  reason?: string | null
}

export type ResourceMapAdminPromotionInput = {
  importRecordId: string
  promotedOrganizationId?: string | null
  promotedServiceId?: string | null
  reason?: string | null
}

export type ResourceMapAdminImportRecordRow = {
  id: string
  source_id: string | null
  source_record_id: string | null
  source_url: string | null
  source_type: string | null
  confidence_score: number | null
  normalized_name: string | null
  normalized_domain: string | null
  normalized_phone: string | null
  normalized_email: string | null
  normalized_address: string | null
  normalized_fingerprint: string | null
  review_status: string
  duplicate_match_status: string
  promotion_status: string
  promoted_organization_id: string | null
  promoted_service_id: string | null
  rejection_reason: string | null
  stale_reason: string | null
  last_seen_at: string | null
  last_scraped_at: string | null
  last_verified_at: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export type ResourceMapAdminImportMatchRow = {
  id: string
  import_record_id: string
  organization_id: string | null
  service_id: string | null
  match_kind: string
  match_status: string
  match_score: number | null
  match_reason: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export type ResourceMapAdminCanonicalOrganizationRow = {
  id: string
  name: string
  tagline: string | null
  description: string | null
  domain: string | null
  website_url: string | null
  donate_url: string | null
  visibility: string
  review_status: string
  approved_at: string | null
  hidden_at: string | null
  hidden_reason: string | null
  suppressed_at: string | null
  suppression_reason: string | null
  deleted_at: string | null
  delete_reason: string | null
  last_seen_at: string | null
  last_verified_at: string | null
  updated_at: string
}

export type ResourceMapAdminCanonicalServiceRow = {
  id: string
  organization_id: string
  title: string
  subtitle: string | null
  description: string | null
  eligibility: string | null
  cost: string | null
  who_it_helps: string | null
  intake_url: string | null
  visibility: string
  review_status: string
  approved_at: string | null
  hidden_at: string | null
  hidden_reason: string | null
  suppressed_at: string | null
  suppression_reason: string | null
  deleted_at: string | null
  delete_reason: string | null
  last_seen_at: string | null
  last_verified_at: string | null
  updated_at: string
}

export type ResourceMapAdminCurationEventRow = {
  id: string
  action: string
  organization_id: string | null
  service_id: string | null
  import_record_id: string | null
  contact_id: string | null
  link_id: string | null
  actor_id: string
  reason: string | null
  created_at: string
}

export type ResourceMapAdminVisibilityContactRow = {
  id: string
  organization_id: string
  service_id: string | null
  contact_type: string
  label: string | null
  value: string
  url: string | null
  is_primary: boolean
  is_public: boolean
  updated_at: string
}

export type ResourceMapAdminVisibilityLinkRow = {
  id: string
  organization_id: string
  service_id: string | null
  link_type: string
  label: string | null
  url: string
  domain: string | null
  is_primary: boolean
  is_public: boolean
  updated_at: string
}

export type ResourceMapAdminReviewQueue = {
  imports: ResourceMapAdminImportRecordRow[]
  matches: ResourceMapAdminImportMatchRow[]
  canonicalOrganizations: ResourceMapAdminCanonicalOrganizationRow[]
  canonicalResources: ResourceMapAdminCanonicalServiceRow[]
  visibilityContacts: ResourceMapAdminVisibilityContactRow[]
  visibilityLinks: ResourceMapAdminVisibilityLinkRow[]
  curationEvents: ResourceMapAdminCurationEventRow[]
}

export type ResourceMapAdminReviewFormActions = {
  reviewImportRecord: (formData: FormData) => Promise<void>
  reviewImportMatch: (formData: FormData) => Promise<void>
  updateCanonicalState: (formData: FormData) => Promise<void>
  updateCanonicalFields: (formData: FormData) => Promise<void>
  setPublicVisibility: (formData: FormData) => Promise<void>
  markImportPromoted: (formData: FormData) => Promise<void>
}
