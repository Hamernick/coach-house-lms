export type ResourceMapImportRecordMatchesTable = {
  Row: {
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
  Insert: {
    id?: string
    import_record_id: string
    organization_id?: string | null
    service_id?: string | null
    match_kind?: string
    match_status?: string
    match_score?: number | null
    match_reason?: string | null
    reviewed_by?: string | null
    reviewed_at?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    import_record_id?: string
    organization_id?: string | null
    service_id?: string | null
    match_kind?: string
    match_status?: string
    match_score?: number | null
    match_reason?: string | null
    reviewed_by?: string | null
    reviewed_at?: string | null
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "resource_map_import_record_matches_import_record_id_fkey"
      columns: ["import_record_id"]
      referencedRelation: "resource_map_import_records"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "resource_map_import_record_matches_organization_id_fkey"
      columns: ["organization_id"]
      referencedRelation: "resource_map_organizations"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "resource_map_import_record_matches_service_id_fkey"
      columns: ["service_id"]
      referencedRelation: "resource_map_services"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "resource_map_import_record_matches_reviewed_by_fkey"
      columns: ["reviewed_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
