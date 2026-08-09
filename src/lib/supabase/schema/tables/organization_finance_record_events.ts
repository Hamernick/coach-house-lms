import type { Json } from "./json"

export type OrganizationFinanceRecordEventsTable = {
  Row: {
    id: string
    org_id: string
    record_id: string
    event_type: string
    actor_id: string
    metadata: Json
    occurred_at: string
  }
  Insert: {
    id?: string
    org_id: string
    record_id: string
    event_type: string
    actor_id: string
    metadata?: Json
    occurred_at?: string
  }
  Update: Partial<OrganizationFinanceRecordEventsTable["Insert"]>
  Relationships: [
    {
      foreignKeyName: "organization_finance_record_events_org_id_fkey"
      columns: ["org_id"]
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
    {
      foreignKeyName: "organization_finance_record_events_record_org_fkey"
      columns: ["record_id", "org_id"]
      referencedRelation: "organization_finance_records"
      referencedColumns: ["id", "org_id"]
    },
    {
      foreignKeyName: "organization_finance_record_events_actor_id_fkey"
      columns: ["actor_id"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
