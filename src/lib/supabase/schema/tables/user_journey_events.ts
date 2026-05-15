import type { Json } from "../json"

export type UserJourneyEventsTable = {
  Row: {
    id: string
    user_id: string | null
    org_id: string | null
    event_name: string
    journey: string | null
    source: string
    surface: string | null
    plan_tier: string | null
    metadata: Json
    occurred_at: string
  }
  Insert: {
    id?: string
    user_id?: string | null
    org_id?: string | null
    event_name: string
    journey?: string | null
    source?: string
    surface?: string | null
    plan_tier?: string | null
    metadata?: Json
    occurred_at?: string
  }
  Update: {
    id?: string
    user_id?: string | null
    org_id?: string | null
    event_name?: string
    journey?: string | null
    source?: string
    surface?: string | null
    plan_tier?: string | null
    metadata?: Json
    occurred_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "user_journey_events_user_id_fkey"
      columns: ["user_id"]
      isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "user_journey_events_org_id_fkey"
      columns: ["org_id"]
      isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
