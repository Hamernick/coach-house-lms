import type { Json } from "../json"

export type AppPageHealthEventsTable = {
  Row: {
    id: string
    user_id: string | null
    org_id: string | null
    event_type: string
    severity: string
    source: string
    route_path: string | null
    target_href: string | null
    duration_ms: number | null
    threshold_ms: number | null
    error_name: string | null
    error_message: string | null
    error_digest: string | null
    stack_hash: string | null
    metadata: Json
    occurred_at: string
  }
  Insert: {
    id?: string
    user_id?: string | null
    org_id?: string | null
    event_type: string
    severity?: string
    source?: string
    route_path?: string | null
    target_href?: string | null
    duration_ms?: number | null
    threshold_ms?: number | null
    error_name?: string | null
    error_message?: string | null
    error_digest?: string | null
    stack_hash?: string | null
    metadata?: Json
    occurred_at?: string
  }
  Update: {
    id?: string
    user_id?: string | null
    org_id?: string | null
    event_type?: string
    severity?: string
    source?: string
    route_path?: string | null
    target_href?: string | null
    duration_ms?: number | null
    threshold_ms?: number | null
    error_name?: string | null
    error_message?: string | null
    error_digest?: string | null
    stack_hash?: string | null
    metadata?: Json
    occurred_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "app_page_health_events_user_id_fkey"
      columns: ["user_id"]
      isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "app_page_health_events_org_id_fkey"
      columns: ["org_id"]
      isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
