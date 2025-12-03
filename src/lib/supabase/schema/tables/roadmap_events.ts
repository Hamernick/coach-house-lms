import type { Json } from "../json"

export type RoadmapEventsTable = {
  Row: {
    id: string
    org_id: string
    section_id: string | null
    event_type: "view" | "cta_click"
    source: string | null
    referrer: string | null
    duration_ms: number | null
    metadata: Json | null
    created_at: string
  }
  Insert: {
    id?: string
    org_id: string
    section_id?: string | null
    event_type: "view" | "cta_click"
    source?: string | null
    referrer?: string | null
    duration_ms?: number | null
    metadata?: Json | null
    created_at?: string
  }
  Update: {
    id?: string
    org_id?: string
    section_id?: string | null
    event_type?: "view" | "cta_click"
    source?: string | null
    referrer?: string | null
    duration_ms?: number | null
    metadata?: Json | null
    created_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "roadmap_events_org_id_fkey"
      columns: ["org_id"]
      isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
  ]
}
