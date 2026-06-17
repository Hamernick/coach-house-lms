export type FiscalSponsorshipReviewsTable = {
  Row: {
    id: string
    application_id: string
    org_id: string
    project_id: string
    decision: string
    notes: string | null
    reviewed_by: string | null
    reviewed_at: string
    metadata: unknown
    created_at: string
  }
  Insert: {
    id?: string
    application_id: string
    org_id: string
    project_id: string
    decision: string
    notes?: string | null
    reviewed_by?: string | null
    reviewed_at?: string
    metadata?: unknown
    created_at?: string
  }
  Update: {
    id?: string
    application_id?: string
    org_id?: string
    project_id?: string
    decision?: string
    notes?: string | null
    reviewed_by?: string | null
    reviewed_at?: string
    metadata?: unknown
    created_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "fiscal_sponsorship_reviews_application_id_fkey"
      columns: ["application_id"]
      referencedRelation: "fiscal_sponsorship_applications"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "fiscal_sponsorship_reviews_org_id_fkey"
      columns: ["org_id"]
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
    {
      foreignKeyName: "fiscal_sponsorship_reviews_project_id_fkey"
      columns: ["project_id"]
      referencedRelation: "organization_projects"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "fiscal_sponsorship_reviews_reviewed_by_fkey"
      columns: ["reviewed_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
