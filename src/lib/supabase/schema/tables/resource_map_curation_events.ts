import type { Json } from "../json"

export type ResourceMapCurationEventsTable = {
  Row: {
    id: string
    action: string
    organization_id: string | null
    service_id: string | null
    import_record_id: string | null
    contact_id: string | null
    link_id: string | null
    actor_id: string | null
    reason: string | null
    before_state: Json
    after_state: Json
    created_at: string
  }
  Insert: {
    id?: string
    action: string
    organization_id?: string | null
    service_id?: string | null
    import_record_id?: string | null
    contact_id?: string | null
    link_id?: string | null
    actor_id?: string | null
    reason?: string | null
    before_state?: Json
    after_state?: Json
    created_at?: string
  }
  Update: {
    id?: string
    action?: string
    organization_id?: string | null
    service_id?: string | null
    import_record_id?: string | null
    contact_id?: string | null
    link_id?: string | null
    actor_id?: string | null
    reason?: string | null
    before_state?: Json
    after_state?: Json
    created_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "resource_map_curation_events_organization_id_fkey"
      columns: ["organization_id"]
      referencedRelation: "resource_map_organizations"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "resource_map_curation_events_service_id_fkey"
      columns: ["service_id"]
      referencedRelation: "resource_map_services"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "resource_map_curation_events_import_record_id_fkey"
      columns: ["import_record_id"]
      referencedRelation: "resource_map_import_records"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "resource_map_curation_events_contact_id_fkey"
      columns: ["contact_id"]
      referencedRelation: "resource_map_contacts"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "resource_map_curation_events_link_id_fkey"
      columns: ["link_id"]
      referencedRelation: "resource_map_links"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "resource_map_curation_events_actor_id_fkey"
      columns: ["actor_id"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
