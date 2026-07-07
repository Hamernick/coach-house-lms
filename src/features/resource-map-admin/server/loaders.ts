import { requireAdmin } from "@/lib/admin/auth"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

import type {
  ResourceMapAdminCanonicalOrganizationRow,
  ResourceMapAdminCanonicalServiceRow,
  ResourceMapAdminCurationEventRow,
  ResourceMapAdminImportMatchRow,
  ResourceMapAdminImportRecordRow,
  ResourceMapAdminReviewQueue,
  ResourceMapAdminVisibilityContactRow,
  ResourceMapAdminVisibilityLinkRow,
} from "../types"

export type ResourceMapAdminReviewQueueOptions = {
  limit?: number
}

function normalizeLimit(value: number | null | undefined) {
  if (!Number.isFinite(value)) return 50
  return Math.min(Math.max(Math.trunc(value ?? 50), 1), 200)
}

export async function loadResourceMapAdminReviewQueue({
  limit,
}: ResourceMapAdminReviewQueueOptions = {}): Promise<ResourceMapAdminReviewQueue> {
  await requireAdmin()
  const admin = createSupabaseAdminClient()
  const normalizedLimit = normalizeLimit(limit)

  const [
    imports,
    matches,
    canonicalOrganizations,
    canonicalResources,
    visibilityContacts,
    visibilityLinks,
    curationEvents,
  ] = await Promise.all([
    admin
      .from("resource_map_import_records")
      .select(
        [
          "id",
          "source_id",
          "source_record_id",
          "source_url",
          "source_type",
          "confidence_score",
          "normalized_name",
          "normalized_domain",
          "normalized_phone",
          "normalized_email",
          "normalized_address",
          "normalized_fingerprint",
          "review_status",
          "duplicate_match_status",
          "promotion_status",
          "promoted_organization_id",
          "promoted_service_id",
          "rejection_reason",
          "stale_reason",
          "last_seen_at",
          "last_scraped_at",
          "last_verified_at",
          "reviewed_by",
          "reviewed_at",
          "created_at",
          "updated_at",
        ].join(",")
      )
      .in("review_status", ["new", "needs_review", "approved", "stale"])
      .order("updated_at", { ascending: false })
      .limit(normalizedLimit),
    admin
      .from("resource_map_import_record_matches")
      .select(
        "id,import_record_id,organization_id,service_id,match_kind,match_status,match_score,match_reason,reviewed_by,reviewed_at,created_at,updated_at"
      )
      .eq("match_status", "pending")
      .order("match_score", { ascending: false, nullsFirst: false })
      .limit(normalizedLimit),
    admin
      .from("resource_map_organizations")
      .select(
        "id,name,tagline,description,domain,website_url,donate_url,visibility,review_status,approved_at,hidden_at,hidden_reason,suppressed_at,suppression_reason,deleted_at,delete_reason,last_seen_at,last_verified_at,updated_at"
      )
      .in("visibility", ["published", "hidden", "suppressed", "deleted"])
      .order("updated_at", { ascending: false })
      .limit(normalizedLimit),
    admin
      .from("resource_map_services")
      .select(
        "id,organization_id,title,subtitle,description,eligibility,cost,who_it_helps,intake_url,visibility,review_status,approved_at,hidden_at,hidden_reason,suppressed_at,suppression_reason,deleted_at,delete_reason,last_seen_at,last_verified_at,updated_at"
      )
      .in("visibility", ["published", "hidden", "suppressed", "deleted"])
      .order("updated_at", { ascending: false })
      .limit(normalizedLimit),
    admin
      .from("resource_map_contacts")
      .select(
        "id,organization_id,service_id,contact_type,label,value,url,is_primary,is_public,updated_at"
      )
      .order("is_public", { ascending: true })
      .order("updated_at", { ascending: false })
      .limit(normalizedLimit),
    admin
      .from("resource_map_links")
      .select(
        "id,organization_id,service_id,link_type,label,url,domain,is_primary,is_public,updated_at"
      )
      .order("is_public", { ascending: true })
      .order("updated_at", { ascending: false })
      .limit(normalizedLimit),
    admin
      .from("resource_map_curation_events")
      .select(
        "id,action,organization_id,service_id,import_record_id,contact_id,link_id,actor_id,reason,created_at"
      )
      .order("created_at", { ascending: false })
      .limit(normalizedLimit),
  ])

  for (const result of [
    imports,
    matches,
    canonicalOrganizations,
    canonicalResources,
    visibilityContacts,
    visibilityLinks,
    curationEvents,
  ]) {
    if (result.error) {
      throw new Error(result.error.message)
    }
  }

  return {
    imports: (imports.data ??
      []) as unknown as ResourceMapAdminImportRecordRow[],
    matches: (matches.data ??
      []) as unknown as ResourceMapAdminImportMatchRow[],
    canonicalOrganizations: (canonicalOrganizations.data ??
      []) as unknown as ResourceMapAdminCanonicalOrganizationRow[],
    canonicalResources: (canonicalResources.data ??
      []) as unknown as ResourceMapAdminCanonicalServiceRow[],
    visibilityContacts: (visibilityContacts.data ??
      []) as unknown as ResourceMapAdminVisibilityContactRow[],
    visibilityLinks: (visibilityLinks.data ??
      []) as unknown as ResourceMapAdminVisibilityLinkRow[],
    curationEvents: (curationEvents.data ??
      []) as unknown as ResourceMapAdminCurationEventRow[],
  }
}
