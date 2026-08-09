import type { Json } from "../json"

export type ResourceMapIngestionRunsTable = {
  Row: {
    id: string
    run_id: string
    source_id: string | null
    run_kind: string
    connector_type: string | null
    status: string
    started_at: string
    finished_at: string | null
    fetched_count: number
    parsed_count: number
    normalized_count: number
    classified_count: number
    deduped_count: number
    flagged_count: number
    errors: Json
    metadata: Json
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    run_id: string
    source_id?: string | null
    run_kind?: string
    connector_type?: string | null
    status?: string
    started_at?: string
    finished_at?: string | null
    fetched_count?: number
    parsed_count?: number
    normalized_count?: number
    classified_count?: number
    deduped_count?: number
    flagged_count?: number
    errors?: Json
    metadata?: Json
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    run_id?: string
    source_id?: string | null
    run_kind?: string
    connector_type?: string | null
    status?: string
    started_at?: string
    finished_at?: string | null
    fetched_count?: number
    parsed_count?: number
    normalized_count?: number
    classified_count?: number
    deduped_count?: number
    flagged_count?: number
    errors?: Json
    metadata?: Json
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "resource_map_ingestion_runs_source_id_fkey"
      columns: ["source_id"]
      referencedRelation: "resource_map_sources"
      referencedColumns: ["id"]
    },
  ]
}
