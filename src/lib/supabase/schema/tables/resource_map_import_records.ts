import type { Json } from "../json"

export type ResourceMapImportRecordsTable = {
  Row: {
    id: string
    source_id: string
    batch_id: string | null
    raw_ingestion_record_id: string | null
    source_record_id: string | null
    source_url: string | null
    source_type: string
    raw_snapshot: Json
    extracted_fields: Json
    field_confidence: Json
    confidence_score: number | null
    trust_score: number | null
    freshness_score: number | null
    quality_flags: Json
    reason_codes: string[]
    needs_review: boolean
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
    license_notes: string | null
    attribution: string | null
    terms_notes: string | null
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
  Insert: {
    id?: string
    source_id: string
    batch_id?: string | null
    raw_ingestion_record_id?: string | null
    source_record_id?: string | null
    source_url?: string | null
    source_type?: string
    raw_snapshot?: Json
    extracted_fields?: Json
    field_confidence?: Json
    confidence_score?: number | null
    trust_score?: number | null
    freshness_score?: number | null
    quality_flags?: Json
    reason_codes?: string[]
    needs_review?: boolean
    normalized_name?: string | null
    normalized_domain?: string | null
    normalized_phone?: string | null
    normalized_email?: string | null
    normalized_address?: string | null
    normalized_fingerprint?: string | null
    review_status?: string
    duplicate_match_status?: string
    promotion_status?: string
    promoted_organization_id?: string | null
    promoted_service_id?: string | null
    license_notes?: string | null
    attribution?: string | null
    terms_notes?: string | null
    rejection_reason?: string | null
    stale_reason?: string | null
    last_seen_at?: string | null
    last_scraped_at?: string | null
    last_verified_at?: string | null
    reviewed_by?: string | null
    reviewed_at?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    source_id?: string
    batch_id?: string | null
    raw_ingestion_record_id?: string | null
    source_record_id?: string | null
    source_url?: string | null
    source_type?: string
    raw_snapshot?: Json
    extracted_fields?: Json
    field_confidence?: Json
    confidence_score?: number | null
    trust_score?: number | null
    freshness_score?: number | null
    quality_flags?: Json
    reason_codes?: string[]
    needs_review?: boolean
    normalized_name?: string | null
    normalized_domain?: string | null
    normalized_phone?: string | null
    normalized_email?: string | null
    normalized_address?: string | null
    normalized_fingerprint?: string | null
    review_status?: string
    duplicate_match_status?: string
    promotion_status?: string
    promoted_organization_id?: string | null
    promoted_service_id?: string | null
    license_notes?: string | null
    attribution?: string | null
    terms_notes?: string | null
    rejection_reason?: string | null
    stale_reason?: string | null
    last_seen_at?: string | null
    last_scraped_at?: string | null
    last_verified_at?: string | null
    reviewed_by?: string | null
    reviewed_at?: string | null
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "resource_map_import_records_source_id_fkey"
      columns: ["source_id"]
      referencedRelation: "resource_map_sources"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "resource_map_import_records_batch_id_fkey"
      columns: ["batch_id"]
      referencedRelation: "resource_map_import_batches"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "resource_map_import_records_raw_ingestion_record_id_fkey"
      columns: ["raw_ingestion_record_id"]
      referencedRelation: "resource_map_raw_ingestion_records"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "resource_map_import_records_reviewed_by_fkey"
      columns: ["reviewed_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "resource_map_import_records_promoted_org_fkey"
      columns: ["promoted_organization_id"]
      referencedRelation: "resource_map_organizations"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "resource_map_import_records_promoted_service_fkey"
      columns: ["promoted_service_id"]
      referencedRelation: "resource_map_services"
      referencedColumns: ["id"]
    },
  ]
}
