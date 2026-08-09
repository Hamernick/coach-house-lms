export type OrganizationFinanceRecordCorrectionsTable = {
  Row: {
    id: string
    org_id: string
    original_record_id: string
    replacement_record_id: string
    evidence_id: string
    reason: string
    created_by: string
    created_at: string
  }
  Insert: {
    id?: string
    org_id: string
    original_record_id: string
    replacement_record_id: string
    evidence_id: string
    reason: string
    created_by: string
    created_at?: string
  }
  Update: Partial<OrganizationFinanceRecordCorrectionsTable["Insert"]>
  Relationships: [
    {
      foreignKeyName: "organization_finance_record_corrections_org_id_fkey"
      columns: ["org_id"]
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
    {
      foreignKeyName: "organization_finance_record_corrections_original_org_fkey"
      columns: ["original_record_id", "org_id"]
      referencedRelation: "organization_finance_records"
      referencedColumns: ["id", "org_id"]
    },
    {
      foreignKeyName: "organization_finance_record_corrections_replacement_org_fkey"
      columns: ["replacement_record_id", "org_id"]
      referencedRelation: "organization_finance_records"
      referencedColumns: ["id", "org_id"]
    },
    {
      foreignKeyName: "organization_finance_record_corrections_evidence_org_fkey"
      columns: ["evidence_id", "org_id"]
      referencedRelation: "organization_finance_record_evidence"
      referencedColumns: ["id", "org_id"]
    },
    {
      foreignKeyName: "organization_finance_record_corrections_created_by_fkey"
      columns: ["created_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
