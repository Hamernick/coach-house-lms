import type { Json } from "../json"

export type ResourceMapEnrichmentRunsTable = {
  Row: {
    id: string
    import_record_id: string
    pass_type: string
    pass_number: number
    status: string
    provider: string | null
    model: string | null
    prompt_version: string
    input_sha256: string
    output_sha256: string | null
    source_urls: string[]
    structured_result: Json
    issues: Json
    error_message: string | null
    attempt_count: number
    actor_id: string | null
    started_at: string | null
    completed_at: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    import_record_id: string
    pass_type: string
    pass_number?: number
    status?: string
    provider?: string | null
    model?: string | null
    prompt_version: string
    input_sha256: string
    output_sha256?: string | null
    source_urls?: string[]
    structured_result?: Json
    issues?: Json
    error_message?: string | null
    attempt_count?: number
    actor_id?: string | null
    started_at?: string | null
    completed_at?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    import_record_id?: string
    pass_type?: string
    pass_number?: number
    status?: string
    provider?: string | null
    model?: string | null
    prompt_version?: string
    input_sha256?: string
    output_sha256?: string | null
    source_urls?: string[]
    structured_result?: Json
    issues?: Json
    error_message?: string | null
    attempt_count?: number
    actor_id?: string | null
    started_at?: string | null
    completed_at?: string | null
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "resource_map_enrichment_runs_import_record_id_fkey"
      columns: ["import_record_id"]
      referencedRelation: "resource_map_import_records"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "resource_map_enrichment_runs_actor_id_fkey"
      columns: ["actor_id"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
