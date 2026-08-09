export type OrganizationFinanceRecordProviderEvidenceTable = {
  Row: {
    id: string
    org_id: string
    record_id: string
    provider: string
    provider_account_id: string
    provider_record_id: string
    observed_at: string
    payload_sha256: string
    created_at: string
  }
  Insert: {
    id?: string
    org_id: string
    record_id: string
    provider: string
    provider_account_id: string
    provider_record_id: string
    observed_at: string
    payload_sha256: string
    created_at?: string
  }
  Update: Partial<OrganizationFinanceRecordProviderEvidenceTable["Insert"]>
  Relationships: [
    {
      foreignKeyName: "organization_finance_record_provider_evidence_org_id_fkey"
      columns: ["org_id"]
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
    {
      foreignKeyName: "organization_finance_record_provider_evidence_record_org_fkey"
      columns: ["record_id", "org_id"]
      referencedRelation: "organization_finance_records"
      referencedColumns: ["id", "org_id"]
    },
  ]
}
