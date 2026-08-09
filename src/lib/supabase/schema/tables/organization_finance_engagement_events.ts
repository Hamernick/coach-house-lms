export type OrganizationFinanceEngagementEventsTable = {
  Row: {
    id: string
    org_id: string
    occurred_at: string
    event_type: string
    source_label: string
    surface: string | null
    finance_record_id: string | null
    external_provider: string
    external_event_id: string
    created_at: string
  }
  Insert: {
    id?: string
    org_id: string
    occurred_at?: string
    event_type: string
    source_label: string
    surface?: string | null
    finance_record_id?: string | null
    external_provider: string
    external_event_id: string
    created_at?: string
  }
  Update: {
    id?: string
    org_id?: string
    occurred_at?: string
    event_type?: string
    source_label?: string
    surface?: string | null
    finance_record_id?: string | null
    external_provider?: string
    external_event_id?: string
    created_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "organization_finance_engagement_events_org_id_fkey"
      columns: ["org_id"]
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
    {
      foreignKeyName: "organization_finance_engagement_events_finance_record_id_fkey"
      columns: ["finance_record_id"]
      referencedRelation: "organization_finance_records"
      referencedColumns: ["id"]
    },
  ]
}
