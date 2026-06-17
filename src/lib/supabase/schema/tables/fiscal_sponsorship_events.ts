export type FiscalSponsorshipEventsTable = {
  Row: {
    id: string
    application_id: string | null
    org_id: string
    project_id: string
    event_type: string
    actor_id: string | null
    summary: string
    metadata: unknown
    created_at: string
  }
  Insert: {
    id?: string
    application_id?: string | null
    org_id: string
    project_id: string
    event_type: string
    actor_id?: string | null
    summary: string
    metadata?: unknown
    created_at?: string
  }
  Update: Partial<FiscalSponsorshipEventsTable["Insert"]>
  Relationships: [
    {
      foreignKeyName: "fiscal_sponsorship_events_application_id_fkey"
      columns: ["application_id"]
      referencedRelation: "fiscal_sponsorship_applications"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "fiscal_sponsorship_events_org_id_fkey"
      columns: ["org_id"]
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
    {
      foreignKeyName: "fiscal_sponsorship_events_project_id_fkey"
      columns: ["project_id"]
      referencedRelation: "organization_projects"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "fiscal_sponsorship_events_actor_id_fkey"
      columns: ["actor_id"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
