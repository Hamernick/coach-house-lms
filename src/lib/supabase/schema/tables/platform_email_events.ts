export type PlatformEmailEventsTable = {
  Row: {
    id: string
    campaign_id: string | null
    delivery_id: string | null
    provider: string
    provider_event_id: string
    event_type: string
    occurred_at: string
    payload: unknown
    created_at: string
  }
  Insert: {
    id?: string
    campaign_id?: string | null
    delivery_id?: string | null
    provider?: string
    provider_event_id: string
    event_type: string
    occurred_at: string
    payload?: unknown
    created_at?: string
  }
  Update: {
    id?: string
    campaign_id?: string | null
    delivery_id?: string | null
    provider?: string
    provider_event_id?: string
    event_type?: string
    occurred_at?: string
    payload?: unknown
    created_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "platform_email_events_campaign_id_fkey"
      columns: ["campaign_id"]
      referencedRelation: "platform_email_campaigns"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "platform_email_events_delivery_id_fkey"
      columns: ["delivery_id"]
      referencedRelation: "platform_email_deliveries"
      referencedColumns: ["id"]
    },
  ]
}
