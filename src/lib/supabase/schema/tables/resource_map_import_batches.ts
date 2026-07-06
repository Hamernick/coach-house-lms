import type { Json } from "../json"

export type ResourceMapImportBatchesTable = {
  Row: {
    id: string
    source_id: string
    import_kind: string
    status: string
    source_uri: string | null
    row_count: number
    imported_count: number
    skipped_count: number
    error_count: number
    summary: Json
    error_log: Json
    started_at: string | null
    completed_at: string | null
    created_by: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    source_id: string
    import_kind?: string
    status?: string
    source_uri?: string | null
    row_count?: number
    imported_count?: number
    skipped_count?: number
    error_count?: number
    summary?: Json
    error_log?: Json
    started_at?: string | null
    completed_at?: string | null
    created_by?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    source_id?: string
    import_kind?: string
    status?: string
    source_uri?: string | null
    row_count?: number
    imported_count?: number
    skipped_count?: number
    error_count?: number
    summary?: Json
    error_log?: Json
    started_at?: string | null
    completed_at?: string | null
    created_by?: string | null
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "resource_map_import_batches_source_id_fkey"
      columns: ["source_id"]
      referencedRelation: "resource_map_sources"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "resource_map_import_batches_created_by_fkey"
      columns: ["created_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
