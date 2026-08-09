import type { Json } from "../json"

export type ResourceMapFieldEvidenceTable = {
  Row: {
    id: string
    import_record_id: string | null
    source_id: string | null
    organization_id: string | null
    service_id: string | null
    location_id: string | null
    contact_id: string | null
    link_id: string | null
    field_path: string
    field_value: Json
    confidence_score: number | null
    source_url: string | null
    evidence_type: string
    derived_from: string[]
    transformation: string | null
    evidence_metadata: Json
    observed_at: string
    created_at: string
  }
  Insert: {
    id?: string
    import_record_id?: string | null
    source_id?: string | null
    organization_id?: string | null
    service_id?: string | null
    location_id?: string | null
    contact_id?: string | null
    link_id?: string | null
    field_path: string
    field_value?: Json
    confidence_score?: number | null
    source_url?: string | null
    evidence_type?: string
    derived_from?: string[]
    transformation?: string | null
    evidence_metadata?: Json
    observed_at?: string
    created_at?: string
  }
  Update: {
    id?: string
    import_record_id?: string | null
    source_id?: string | null
    organization_id?: string | null
    service_id?: string | null
    location_id?: string | null
    contact_id?: string | null
    link_id?: string | null
    field_path?: string
    field_value?: Json
    confidence_score?: number | null
    source_url?: string | null
    evidence_type?: string
    derived_from?: string[]
    transformation?: string | null
    evidence_metadata?: Json
    observed_at?: string
    created_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "resource_map_field_evidence_import_record_id_fkey"
      columns: ["import_record_id"]
      referencedRelation: "resource_map_import_records"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "resource_map_field_evidence_source_id_fkey"
      columns: ["source_id"]
      referencedRelation: "resource_map_sources"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "resource_map_field_evidence_organization_id_fkey"
      columns: ["organization_id"]
      referencedRelation: "resource_map_organizations"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "resource_map_field_evidence_service_id_fkey"
      columns: ["service_id"]
      referencedRelation: "resource_map_services"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "resource_map_field_evidence_location_id_fkey"
      columns: ["location_id"]
      referencedRelation: "resource_map_locations"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "resource_map_field_evidence_contact_id_fkey"
      columns: ["contact_id"]
      referencedRelation: "resource_map_contacts"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "resource_map_field_evidence_link_id_fkey"
      columns: ["link_id"]
      referencedRelation: "resource_map_links"
      referencedColumns: ["id"]
    },
  ]
}
