import type { Json } from "../json"

export type ResourceMapOrganizationsTable = {
  Row: {
    id: string
    platform_org_id: string | null
    source_id: string | null
    source_record_id: string | null
    name: string
    legal_name: string | null
    ein: string | null
    slug: string | null
    tagline: string | null
    description: string | null
    website_url: string | null
    donate_url: string | null
    logo_url: string | null
    favicon_url: string | null
    mission: string | null
    vision: string | null
    values: string[]
    aliases: string[]
    domain: string | null
    contact_name: string | null
    email: string | null
    phone: string | null
    normalized_email: string | null
    normalized_phone: string | null
    social_links: Json
    visibility: string
    review_status: string
    approved_by: string | null
    approved_at: string | null
    hidden_by: string | null
    hidden_at: string | null
    hidden_reason: string | null
    suppressed_by: string | null
    suppressed_at: string | null
    suppression_reason: string | null
    deleted_by: string | null
    deleted_at: string | null
    delete_reason: string | null
    data_quality_score: number | null
    source_url: string | null
    source_snapshot: Json
    last_seen_at: string | null
    last_verified_at: string | null
    created_by: string | null
    updated_by: string | null
    created_at: string
    updated_at: string
    search_document: string
  }
  Insert: {
    id?: string
    platform_org_id?: string | null
    source_id?: string | null
    source_record_id?: string | null
    name: string
    legal_name?: string | null
    ein?: string | null
    slug?: string | null
    tagline?: string | null
    description?: string | null
    website_url?: string | null
    donate_url?: string | null
    logo_url?: string | null
    favicon_url?: string | null
    mission?: string | null
    vision?: string | null
    values?: string[]
    aliases?: string[]
    domain?: string | null
    contact_name?: string | null
    email?: string | null
    phone?: string | null
    normalized_email?: string | null
    normalized_phone?: string | null
    social_links?: Json
    visibility?: string
    review_status?: string
    approved_by?: string | null
    approved_at?: string | null
    hidden_by?: string | null
    hidden_at?: string | null
    hidden_reason?: string | null
    suppressed_by?: string | null
    suppressed_at?: string | null
    suppression_reason?: string | null
    deleted_by?: string | null
    deleted_at?: string | null
    delete_reason?: string | null
    data_quality_score?: number | null
    source_url?: string | null
    source_snapshot?: Json
    last_seen_at?: string | null
    last_verified_at?: string | null
    created_by?: string | null
    updated_by?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    platform_org_id?: string | null
    source_id?: string | null
    source_record_id?: string | null
    name?: string
    legal_name?: string | null
    ein?: string | null
    slug?: string | null
    tagline?: string | null
    description?: string | null
    website_url?: string | null
    donate_url?: string | null
    logo_url?: string | null
    favicon_url?: string | null
    mission?: string | null
    vision?: string | null
    values?: string[]
    aliases?: string[]
    domain?: string | null
    contact_name?: string | null
    email?: string | null
    phone?: string | null
    normalized_email?: string | null
    normalized_phone?: string | null
    social_links?: Json
    visibility?: string
    review_status?: string
    approved_by?: string | null
    approved_at?: string | null
    hidden_by?: string | null
    hidden_at?: string | null
    hidden_reason?: string | null
    suppressed_by?: string | null
    suppressed_at?: string | null
    suppression_reason?: string | null
    deleted_by?: string | null
    deleted_at?: string | null
    delete_reason?: string | null
    data_quality_score?: number | null
    source_url?: string | null
    source_snapshot?: Json
    last_seen_at?: string | null
    last_verified_at?: string | null
    created_by?: string | null
    updated_by?: string | null
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "resource_map_organizations_platform_org_id_fkey"
      columns: ["platform_org_id"]
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
    {
      foreignKeyName: "resource_map_organizations_source_id_fkey"
      columns: ["source_id"]
      referencedRelation: "resource_map_sources"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "resource_map_organizations_created_by_fkey"
      columns: ["created_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "resource_map_organizations_updated_by_fkey"
      columns: ["updated_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "resource_map_organizations_approved_by_fkey"
      columns: ["approved_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "resource_map_organizations_hidden_by_fkey"
      columns: ["hidden_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "resource_map_organizations_suppressed_by_fkey"
      columns: ["suppressed_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "resource_map_organizations_deleted_by_fkey"
      columns: ["deleted_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
