export type FinanceOpportunityScanRunsTable = {
  Row: {
    id: string
    source_id: string
    org_id: string
    status: string
    started_at: string | null
    finished_at: string | null
    items_seen: number
    items_created: number
    items_updated: number
    items_matched: number
    error_code: string | null
    error_message: string | null
    retry_count: number
    trace_id: string
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    source_id: string
    org_id: string
    status?: string
    started_at?: string | null
    finished_at?: string | null
    items_seen?: number
    items_created?: number
    items_updated?: number
    items_matched?: number
    error_code?: string | null
    error_message?: string | null
    retry_count?: number
    trace_id?: string
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    source_id?: string
    org_id?: string
    status?: string
    started_at?: string | null
    finished_at?: string | null
    items_seen?: number
    items_created?: number
    items_updated?: number
    items_matched?: number
    error_code?: string | null
    error_message?: string | null
    retry_count?: number
    trace_id?: string
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "finance_opportunity_scan_runs_source_id_fkey"
      columns: ["source_id"]
      referencedRelation: "finance_opportunity_sources"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "finance_opportunity_scan_runs_org_id_fkey"
      columns: ["org_id"]
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
  ]
}
