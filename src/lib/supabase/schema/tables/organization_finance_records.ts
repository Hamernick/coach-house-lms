export type OrganizationFinanceRecordsTable = {
  Row: {
    id: string
    org_id: string
    program_id: string | null
    effective_at: string
    record_type: string
    direction: string
    source_kind: string | null
    source_label: string
    amount_cents: number
    currency_code: string
    status: string
    external_provider: string | null
    external_record_id: string | null
    created_source: string
    created_by: string | null
    reconciled_at: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    org_id: string
    program_id?: string | null
    effective_at: string
    record_type: string
    direction: string
    source_kind?: string | null
    source_label: string
    amount_cents: number
    currency_code?: string
    status?: string
    external_provider?: string | null
    external_record_id?: string | null
    created_source?: string
    created_by?: string | null
    reconciled_at?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    org_id?: string
    program_id?: string | null
    effective_at?: string
    record_type?: string
    direction?: string
    source_kind?: string | null
    source_label?: string
    amount_cents?: number
    currency_code?: string
    status?: string
    external_provider?: string | null
    external_record_id?: string | null
    created_source?: string
    created_by?: string | null
    reconciled_at?: string | null
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "organization_finance_records_org_id_fkey"
      columns: ["org_id"]
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
    {
      foreignKeyName: "organization_finance_records_created_by_fkey"
      columns: ["created_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "organization_finance_records_program_id_fkey"
      columns: ["program_id"]
      referencedRelation: "programs"
      referencedColumns: ["id"]
    },
  ]
}
