export type PublicProfileActivityEventsTable = {
  Row: {
    id: string
    profile_id: string
    organization_id: string
    event_kind: "affiliation_published"
    source_key: string
    title: string
    summary: string | null
    occurred_at: string
    created_at: string
  }
  Insert: {
    id?: string
    profile_id: string
    organization_id: string
    event_kind: "affiliation_published"
    source_key: string
    title: string
    summary?: string | null
    occurred_at?: string
    created_at?: string
  }
  Update: {
    id?: string
    profile_id?: string
    organization_id?: string
    event_kind?: "affiliation_published"
    source_key?: string
    title?: string
    summary?: string | null
    occurred_at?: string
    created_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "public_profile_activity_events_affiliation_fkey"
      columns: ["profile_id", "organization_id"]
      referencedRelation: "public_person_organization_affiliations"
      referencedColumns: ["profile_id", "organization_id"]
    },
  ]
}
