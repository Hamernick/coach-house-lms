import type { Json } from "../json"

export type ResourceMapRawIngestionRecordsTable = {
  Row: {
    id: string
    source_id: string
    run_id: string | null
    import_batch_id: string | null
    raw_url: string
    raw_payload: Json
    raw_text: string | null
    content_type: string | null
    checksum: string
    fetched_at: string
    parser_version: string
    connector_version: string
    fetch_status: string
    error_message: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    source_id: string
    run_id?: string | null
    import_batch_id?: string | null
    raw_url: string
    raw_payload?: Json
    raw_text?: string | null
    content_type?: string | null
    checksum: string
    fetched_at?: string
    parser_version: string
    connector_version: string
    fetch_status?: string
    error_message?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    source_id?: string
    run_id?: string | null
    import_batch_id?: string | null
    raw_url?: string
    raw_payload?: Json
    raw_text?: string | null
    content_type?: string | null
    checksum?: string
    fetched_at?: string
    parser_version?: string
    connector_version?: string
    fetch_status?: string
    error_message?: string | null
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "resource_map_raw_ingestion_records_source_id_fkey"
      columns: ["source_id"]
      referencedRelation: "resource_map_sources"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "resource_map_raw_ingestion_records_run_id_fkey"
      columns: ["run_id"]
      referencedRelation: "resource_map_ingestion_runs"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "resource_map_raw_ingestion_records_import_batch_id_fkey"
      columns: ["import_batch_id"]
      referencedRelation: "resource_map_import_batches"
      referencedColumns: ["id"]
    },
  ]
}
