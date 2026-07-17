import type { Json } from "../../types"

export type OrganizationProjectActivityEventsTable = {
  Row: {
    id: string
    org_id: string
    project_id: string | null
    entity_type: string
    entity_id: string
    event_type: string
    title: string
    from_status: string | null
    to_status: string | null
    actor_id: string | null
    metadata: Json
    occurred_at: string
  }
  Insert: {
    id?: string
    org_id: string
    project_id?: string | null
    entity_type: string
    entity_id: string
    event_type: string
    title: string
    from_status?: string | null
    to_status?: string | null
    actor_id?: string | null
    metadata?: Json
    occurred_at?: string
  }
  Update: {
    id?: string
    org_id?: string
    project_id?: string | null
    entity_type?: string
    entity_id?: string
    event_type?: string
    title?: string
    from_status?: string | null
    to_status?: string | null
    actor_id?: string | null
    metadata?: Json
    occurred_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "organization_project_activity_events_org_id_fkey"
      columns: ["org_id"]
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
    {
      foreignKeyName: "organization_project_activity_events_project_id_fkey"
      columns: ["project_id"]
      referencedRelation: "organization_projects"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "organization_project_activity_events_actor_id_fkey"
      columns: ["actor_id"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
