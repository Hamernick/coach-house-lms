export type OrganizationFinanceRecordEvidenceTable = {
  Row: {
    id: string
    org_id: string
    record_id: string
    external_reference: string
    storage_bucket: string
    storage_path: string
    file_name: string
    mime_type: string
    size_bytes: number
    file_sha256: string
    created_by: string
    created_at: string
  }
  Insert: {
    id?: string
    org_id: string
    record_id: string
    external_reference: string
    storage_bucket?: string
    storage_path: string
    file_name: string
    mime_type: string
    size_bytes: number
    file_sha256: string
    created_by: string
    created_at?: string
  }
  Update: Partial<OrganizationFinanceRecordEvidenceTable["Insert"]>
  Relationships: [
    {
      foreignKeyName: "organization_finance_record_evidence_org_id_fkey"
      columns: ["org_id"]
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
    {
      foreignKeyName: "organization_finance_record_evidence_record_org_fkey"
      columns: ["record_id", "org_id"]
      referencedRelation: "organization_finance_records"
      referencedColumns: ["id", "org_id"]
    },
    {
      foreignKeyName: "organization_finance_record_evidence_created_by_fkey"
      columns: ["created_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
