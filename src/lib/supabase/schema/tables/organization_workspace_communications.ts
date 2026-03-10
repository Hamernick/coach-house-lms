export type OrganizationWorkspaceCommunicationsTable = {
  Row: {
    id: string
    org_id: string
    channel: string
    media_mode: string
    content: string
    status: string
    scheduled_for: string
    posted_at: string | null
    created_by: string
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    org_id: string
    channel: string
    media_mode: string
    content: string
    status?: string
    scheduled_for: string
    posted_at?: string | null
    created_by: string
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    org_id?: string
    channel?: string
    media_mode?: string
    content?: string
    status?: string
    scheduled_for?: string
    posted_at?: string | null
    created_by?: string
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "organization_workspace_communications_org_id_fkey"
      columns: ["org_id"]
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
    {
      foreignKeyName: "organization_workspace_communications_created_by_fkey"
      columns: ["created_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
