import type { Json } from "../json"

export type SearchEventsTable = {
  Row: {
    id: string
    user_id: string
    org_id: string | null
    event_type: "open" | "query" | "select"
    query: string | null
    query_length: number | null
    context: string | null
    result_count: number | null
    result_id: string | null
    result_group: string | null
    result_href: string | null
    created_at: string
  }
  Insert: {
    id?: string
    user_id: string
    org_id?: string | null
    event_type: "open" | "query" | "select"
    query?: string | null
    query_length?: number | null
    context?: string | null
    result_count?: number | null
    result_id?: string | null
    result_group?: string | null
    result_href?: string | null
    created_at?: string
  }
  Update: {
    id?: string
    user_id?: string
    org_id?: string | null
    event_type?: "open" | "query" | "select"
    query?: string | null
    query_length?: number | null
    context?: string | null
    result_count?: number | null
    result_id?: string | null
    result_group?: string | null
    result_href?: string | null
    created_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "search_events_org_id_fkey"
      columns: ["org_id"]
      isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
  ]
}
