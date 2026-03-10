export type OrganizationWorkspaceCommunicationChannelsTable = {
  Row: {
    org_id: string
    channel: string
    is_connected: boolean
    provider: string | null
    connected_by: string | null
    connected_at: string | null
    disconnected_at: string | null
    metadata: unknown
    created_at: string
    updated_at: string
  }
  Insert: {
    org_id: string
    channel: string
    is_connected?: boolean
    provider?: string | null
    connected_by?: string | null
    connected_at?: string | null
    disconnected_at?: string | null
    metadata?: unknown
    created_at?: string
    updated_at?: string
  }
  Update: {
    org_id?: string
    channel?: string
    is_connected?: boolean
    provider?: string | null
    connected_by?: string | null
    connected_at?: string | null
    disconnected_at?: string | null
    metadata?: unknown
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "organization_workspace_communication_channels_org_id_fkey"
      columns: ["org_id"]
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
    {
      foreignKeyName: "organization_workspace_communication_channels_connected_by_fkey"
      columns: ["connected_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
