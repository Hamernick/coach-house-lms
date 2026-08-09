export type OrganizationFinanceStripeInstallIntentsTable = {
  Row: {
    id: string
    org_id: string
    user_id: string
    state_sha256: string
    default_record_type: string
    expires_at: string
    consumed_at: string | null
    created_at: string
  }
  Insert: {
    id?: string
    org_id: string
    user_id: string
    state_sha256: string
    default_record_type: string
    expires_at: string
    consumed_at?: string | null
    created_at?: string
  }
  Update: Partial<OrganizationFinanceStripeInstallIntentsTable["Insert"]>
  Relationships: [
    {
      foreignKeyName: "organization_finance_stripe_install_intents_org_id_fkey"
      columns: ["org_id"]
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
    {
      foreignKeyName: "organization_finance_stripe_install_intents_user_id_fkey"
      columns: ["user_id"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
