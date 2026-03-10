export type OrganizationWorkspaceCommunicationDeliveriesTable = {
  Row: {
    id: string
    org_id: string
    communication_id: string
    channel: string
    status: string
    provider: string
    attempt_count: number
    last_error: string | null
    payload: unknown
    queued_at: string
    sent_at: string | null
    created_by: string
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    org_id: string
    communication_id: string
    channel: string
    status?: string
    provider?: string
    attempt_count?: number
    last_error?: string | null
    payload?: unknown
    queued_at?: string
    sent_at?: string | null
    created_by: string
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    org_id?: string
    communication_id?: string
    channel?: string
    status?: string
    provider?: string
    attempt_count?: number
    last_error?: string | null
    payload?: unknown
    queued_at?: string
    sent_at?: string | null
    created_by?: string
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "organization_workspace_communication_deliveries_org_id_fkey"
      columns: ["org_id"]
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
    {
      foreignKeyName: "organization_workspace_communication_deliveries_communication_id_fkey"
      columns: ["communication_id"]
      referencedRelation: "organization_workspace_communications"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "organization_workspace_communication_deliveries_created_by_fkey"
      columns: ["created_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
