export type OrganizationFinanceStripeConnectionsTable = {
  Row: {
    org_id: string
    stripe_account_id: string
    stripe_user_id: string
    livemode: boolean
    default_record_type: string
    status: string
    connected_by: string
    connected_at: string
    last_synced_at: string | null
    last_sync_status: string
    last_sync_error: string | null
    updated_at: string
  }
  Insert: {
    org_id: string
    stripe_account_id: string
    stripe_user_id: string
    livemode: boolean
    default_record_type: string
    status?: string
    connected_by: string
    connected_at?: string
    last_synced_at?: string | null
    last_sync_status?: string
    last_sync_error?: string | null
    updated_at?: string
  }
  Update: Partial<OrganizationFinanceStripeConnectionsTable["Insert"]>
  Relationships: [
    {
      foreignKeyName: "organization_finance_stripe_connections_org_id_fkey"
      columns: ["org_id"]
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
    {
      foreignKeyName: "organization_finance_stripe_connections_connected_by_fkey"
      columns: ["connected_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
