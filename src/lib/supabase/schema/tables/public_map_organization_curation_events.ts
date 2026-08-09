import type { Json } from "../json"

export type PublicMapOrganizationCurationEventsTable = {
  Row: {
    id: string
    organization_id: string | null
    actor_id: string | null
    action: string
    reason: string | null
    before_state: Json
    after_state: Json
    created_at: string
  }
  Insert: {
    id?: string
    organization_id?: string | null
    actor_id?: string | null
    action: string
    reason?: string | null
    before_state?: Json
    after_state?: Json
    created_at?: string
  }
  Update: {
    id?: string
    organization_id?: string | null
    actor_id?: string | null
    action?: string
    reason?: string | null
    before_state?: Json
    after_state?: Json
    created_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "public_map_organization_curation_events_organization_id_fkey"
      columns: ["organization_id"]
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
    {
      foreignKeyName: "public_map_organization_curation_events_actor_id_fkey"
      columns: ["actor_id"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
