import type { Json } from "../json"

export type ResourceMapServicesTable = {
  Row: {
    id: string
    organization_id: string
    source_id: string | null
    source_record_id: string | null
    title: string
    subtitle: string | null
    description: string | null
    service_kind: string
    delivery_modes: string[]
    eligibility: string | null
    cost: string | null
    who_it_helps: string | null
    insurance_accepted: string | null
    intake_url: string | null
    appointment_info: string | null
    documents_needed: string[]
    accessibility_notes: string | null
    urgent_availability: string | null
    languages: string[]
    hours: Json
    hours_schema_version: number
    timezone: string | null
    appointment_required: boolean
    availability_status: string
    availability_notes: string | null
    temporary_closed_until: string | null
    coverage_area: string[]
    minimum_age: number | null
    maximum_age: number | null
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
    organization_id: string
    source_id?: string | null
    source_record_id?: string | null
    title: string
    subtitle?: string | null
    description?: string | null
    service_kind?: string
    delivery_modes?: string[]
    eligibility?: string | null
    cost?: string | null
    who_it_helps?: string | null
    insurance_accepted?: string | null
    intake_url?: string | null
    appointment_info?: string | null
    documents_needed?: string[]
    accessibility_notes?: string | null
    urgent_availability?: string | null
    languages?: string[]
    hours?: Json
    hours_schema_version?: number
    timezone?: string | null
    appointment_required?: boolean
    availability_status?: string
    availability_notes?: string | null
    temporary_closed_until?: string | null
    coverage_area?: string[]
    minimum_age?: number | null
    maximum_age?: number | null
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
    organization_id?: string
    source_id?: string | null
    source_record_id?: string | null
    title?: string
    subtitle?: string | null
    description?: string | null
    service_kind?: string
    delivery_modes?: string[]
    eligibility?: string | null
    cost?: string | null
    who_it_helps?: string | null
    insurance_accepted?: string | null
    intake_url?: string | null
    appointment_info?: string | null
    documents_needed?: string[]
    accessibility_notes?: string | null
    urgent_availability?: string | null
    languages?: string[]
    hours?: Json
    hours_schema_version?: number
    timezone?: string | null
    appointment_required?: boolean
    availability_status?: string
    availability_notes?: string | null
    temporary_closed_until?: string | null
    coverage_area?: string[]
    minimum_age?: number | null
    maximum_age?: number | null
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
      foreignKeyName: "resource_map_services_organization_id_fkey"
      columns: ["organization_id"]
      referencedRelation: "resource_map_organizations"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "resource_map_services_source_id_fkey"
      columns: ["source_id"]
      referencedRelation: "resource_map_sources"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "resource_map_services_created_by_fkey"
      columns: ["created_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "resource_map_services_updated_by_fkey"
      columns: ["updated_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "resource_map_services_approved_by_fkey"
      columns: ["approved_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "resource_map_services_hidden_by_fkey"
      columns: ["hidden_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "resource_map_services_suppressed_by_fkey"
      columns: ["suppressed_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "resource_map_services_deleted_by_fkey"
      columns: ["deleted_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
