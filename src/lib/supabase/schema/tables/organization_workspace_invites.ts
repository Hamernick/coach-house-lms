export type OrganizationWorkspaceInvitesTable = {
  Row: {
    id: string
    org_id: string
    user_id: string
    user_name: string | null
    user_email: string | null
    created_by: string
    created_at: string
    expires_at: string
    revoked_at: string | null
    duration_value: number
    duration_unit: string
    updated_at: string
  }
  Insert: {
    id: string
    org_id: string
    user_id: string
    user_name?: string | null
    user_email?: string | null
    created_by: string
    created_at?: string
    expires_at: string
    revoked_at?: string | null
    duration_value?: number
    duration_unit?: string
    updated_at?: string
  }
  Update: {
    id?: string
    org_id?: string
    user_id?: string
    user_name?: string | null
    user_email?: string | null
    created_by?: string
    created_at?: string
    expires_at?: string
    revoked_at?: string | null
    duration_value?: number
    duration_unit?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "organization_workspace_invites_org_id_fkey"
      columns: ["org_id"]
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
    {
      foreignKeyName: "organization_workspace_invites_user_id_fkey"
      columns: ["user_id"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "organization_workspace_invites_created_by_fkey"
      columns: ["created_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
