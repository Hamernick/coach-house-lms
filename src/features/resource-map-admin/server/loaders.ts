import { requireAdmin } from "@/lib/admin/auth"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

import type {
  ResourceMapAdminCanonicalOrganizationRow,
  ResourceMapAdminCanonicalServiceRow,
  ResourceMapAdminCurationEventRow,
  ResourceMapAdminEnrichmentRunRow,
  ResourceMapAdminFieldEvidenceRow,
  ResourceMapAdminImportMatchRow,
  ResourceMapAdminImportRecordDetailRow,
  ResourceMapAdminImportRecordRow,
  ResourceMapAdminRawIngestionRow,
  ResourceMapAdminReviewRecord,
  ResourceMapAdminReviewQueue,
  ResourceMapAdminReviewerProfile,
  ResourceMapAdminSourceRow,
  ResourceMapAdminVisibilityContactRow,
  ResourceMapAdminVisibilityLinkRow,
} from "../types"

export type ResourceMapAdminReviewQueueOptions = {
  limit?: number
  offset?: number
}

const EMPTY_UUID = "00000000-0000-4000-8000-000000000000"

function normalizeLimit(value: number | null | undefined) {
  if (!Number.isFinite(value)) return 50
  return Math.min(Math.max(Math.trunc(value ?? 50), 1), 200)
}

function normalizeOffset(value: number | null | undefined) {
  if (!Number.isFinite(value)) return 0
  return Math.max(Math.trunc(value ?? 0), 0)
}

export async function loadResourceMapAdminReviewQueue({
  limit,
  offset,
}: ResourceMapAdminReviewQueueOptions = {}): Promise<ResourceMapAdminReviewQueue> {
  await requireAdmin()
  const admin = createSupabaseAdminClient()
  const normalizedLimit = normalizeLimit(limit)
  const normalizedOffset = normalizeOffset(offset)

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
        ].join(","),
        { count: "exact" }
      )
      .in("review_status", ["new", "needs_review", "approved", "stale"])
      .order("updated_at", { ascending: false })
      .range(normalizedOffset, normalizedOffset + normalizedLimit - 1),
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
    page: Math.floor(normalizedOffset / normalizedLimit) + 1,
    pageSize: normalizedLimit,
    totalImports: imports.count ?? imports.data?.length ?? 0,
    imports: (imports.data ??
      []) as unknown as ResourceMapAdminImportRecordRow[],
    matches: (matches.data ?? []) as ResourceMapAdminImportMatchRow[],
    canonicalOrganizations: (canonicalOrganizations.data ??
      []) as ResourceMapAdminCanonicalOrganizationRow[],
    canonicalResources: (canonicalResources.data ??
      []) as ResourceMapAdminCanonicalServiceRow[],
    visibilityContacts: (visibilityContacts.data ??
      []) as ResourceMapAdminVisibilityContactRow[],
    visibilityLinks: (visibilityLinks.data ??
      []) as ResourceMapAdminVisibilityLinkRow[],
    curationEvents: (curationEvents.data ??
      []) as ResourceMapAdminCurationEventRow[],
  }
}

function isMissingEnrichmentLedgerError(error: {
  code?: string
  message?: string
}) {
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    error.message?.includes("resource_map_enrichment_runs") === true
  )
}

export async function loadResourceMapAdminReviewRecord(
  importRecordId: string
): Promise<ResourceMapAdminReviewRecord> {
  const { userId } = await requireAdmin()
  const admin = createSupabaseAdminClient()
  const normalizedId = importRecordId.trim()
  if (!normalizedId) throw new Error("Import record id is required.")

  const { data: record, error: recordError } = await admin
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
        "raw_ingestion_record_id",
        "raw_snapshot",
        "extracted_fields",
        "field_confidence",
        "trust_score",
        "freshness_score",
        "quality_flags",
        "reason_codes",
        "needs_review",
        "license_notes",
        "attribution",
        "terms_notes",
      ].join(",")
    )
    .eq("id", normalizedId)
    .maybeSingle()

  if (recordError) throw new Error(recordError.message)
  if (!record) throw new Error("Resource map import record was not found.")

  const detailRecord =
    record as unknown as ResourceMapAdminImportRecordDetailRow
  const organizationId = detailRecord.promoted_organization_id ?? EMPTY_UUID
  const rawIngestionId = detailRecord.raw_ingestion_record_id ?? EMPTY_UUID

  const [
    source,
    rawIngestion,
    fieldEvidence,
    enrichmentRuns,
    matches,
    visibilityContacts,
    visibilityLinks,
  ] = await Promise.all([
    admin
      .from("resource_map_sources")
      .select(
        "id,name,slug,homepage_url,source_type,trust_level,license_label,license_url,attribution"
      )
      .eq("id", detailRecord.source_id)
      .maybeSingle(),
    admin
      .from("resource_map_raw_ingestion_records")
      .select(
        "id,raw_url,raw_payload,content_type,checksum,fetched_at,parser_version,connector_version,fetch_status,error_message"
      )
      .eq("id", rawIngestionId)
      .maybeSingle(),
    admin
      .from("resource_map_field_evidence")
      .select(
        "id,import_record_id,field_path,field_value,confidence_score,source_url,evidence_type,derived_from,transformation,evidence_metadata,observed_at"
      )
      .eq("import_record_id", detailRecord.id)
      .order("field_path", { ascending: true })
      .limit(200),
    admin
      .from("resource_map_enrichment_runs")
      .select(
        "id,import_record_id,pass_type,pass_number,status,provider,model,prompt_version,source_urls,structured_result,issues,error_message,actor_id,completed_at,created_at"
      )
      .eq("import_record_id", detailRecord.id)
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("resource_map_import_record_matches")
      .select(
        "id,import_record_id,organization_id,service_id,match_kind,match_status,match_score,match_reason,reviewed_by,reviewed_at,created_at,updated_at"
      )
      .eq("import_record_id", detailRecord.id)
      .order("match_score", { ascending: false, nullsFirst: false })
      .limit(50),
    admin
      .from("resource_map_contacts")
      .select(
        "id,organization_id,service_id,contact_type,label,value,url,is_primary,is_public,updated_at"
      )
      .eq("organization_id", organizationId)
      .order("is_primary", { ascending: false })
      .limit(100),
    admin
      .from("resource_map_links")
      .select(
        "id,organization_id,service_id,link_type,label,url,domain,is_primary,is_public,updated_at"
      )
      .eq("organization_id", organizationId)
      .order("is_primary", { ascending: false })
      .limit(100),
  ])

  for (const result of [
    source,
    rawIngestion,
    fieldEvidence,
    matches,
    visibilityContacts,
    visibilityLinks,
  ]) {
    if (result.error) throw new Error(result.error.message)
  }

  const enrichmentLedgerAvailable = !enrichmentRuns.error
  if (
    enrichmentRuns.error &&
    !isMissingEnrichmentLedgerError(enrichmentRuns.error)
  ) {
    throw new Error(enrichmentRuns.error.message)
  }

  const enrichmentRows = enrichmentLedgerAvailable
    ? ((enrichmentRuns.data ?? []) as ResourceMapAdminEnrichmentRunRow[])
    : []
  const reviewerIds = [
    userId,
    detailRecord.reviewed_by,
    ...(matches.data ?? []).map((match) => match.reviewed_by),
    ...enrichmentRows.map((run) => run.actor_id),
  ].filter((id): id is string => Boolean(id))
  const { data: reviewerProfiles, error: reviewerProfilesError } = await admin
    .from("profiles")
    .select("id,full_name,email")
    .in("id", [...new Set(reviewerIds)])

  if (reviewerProfilesError) throw new Error(reviewerProfilesError.message)

  const isRelatedToPromotedService = (serviceId: string | null) =>
    serviceId === null || serviceId === detailRecord.promoted_service_id

  return {
    record: detailRecord,
    source: source.data as ResourceMapAdminSourceRow | null,
    rawIngestion: rawIngestion.data as ResourceMapAdminRawIngestionRow | null,
    fieldEvidence: (fieldEvidence.data ??
      []) as ResourceMapAdminFieldEvidenceRow[],
    enrichmentRuns: enrichmentRows,
    enrichmentLedgerAvailable,
    matches: (matches.data ?? []) as ResourceMapAdminImportMatchRow[],
    visibilityContacts: (
      (visibilityContacts.data ?? []) as ResourceMapAdminVisibilityContactRow[]
    ).filter((contact) => isRelatedToPromotedService(contact.service_id)),
    visibilityLinks: (
      (visibilityLinks.data ?? []) as ResourceMapAdminVisibilityLinkRow[]
    ).filter((link) => isRelatedToPromotedService(link.service_id)),
    reviewerProfiles: (reviewerProfiles ??
      []) as ResourceMapAdminReviewerProfile[],
    currentReviewerId: userId,
  }
}
