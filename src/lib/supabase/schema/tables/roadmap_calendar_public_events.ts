import type { Json } from "../json"

export type RoadmapCalendarPublicEventsTable = {
  Row: {
    id: string
    org_id: string
    title: string
    description: string | null
    starts_at: string
    ends_at: string | null
    all_day: boolean
    recurrence: Json | null
    status: string
    assigned_roles: string[]
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    org_id: string
    title: string
    description?: string | null
    starts_at: string
    ends_at?: string | null
    all_day?: boolean
    recurrence?: Json | null
    status?: string
    assigned_roles?: string[]
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    org_id?: string
    title?: string
    description?: string | null
    starts_at?: string
    ends_at?: string | null
    all_day?: boolean
    recurrence?: Json | null
    status?: string
    assigned_roles?: string[]
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "roadmap_calendar_public_events_org_id_fkey"
      columns: ["org_id"]
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
  ]
}
