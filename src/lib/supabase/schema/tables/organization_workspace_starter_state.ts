export type OrganizationWorkspaceStarterStateTable = {
  Row: {
    org_id: string
    seed_version: number
    seeded_at: string
    last_reset_at: string | null
    updated_by: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    org_id: string
    seed_version?: number
    seeded_at?: string
    last_reset_at?: string | null
    updated_by?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    org_id?: string
    seed_version?: number
    seeded_at?: string
    last_reset_at?: string | null
    updated_by?: string | null
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "organization_workspace_starter_state_org_id_fkey"
      columns: ["org_id"]
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
    {
      foreignKeyName: "organization_workspace_starter_state_updated_by_fkey"
      columns: ["updated_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
