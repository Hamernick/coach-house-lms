export type PlatformEmailDeliveriesTable = {
  Row: {
    id: string
    campaign_id: string
    recipient_email: string
    audience_segment_id: string
    provider: string
    provider_message_id: string | null
    status: string
    idempotency_key: string
    attempt_count: number
    last_error: string | null
    sent_at: string | null
    delivered_at: string | null
    metadata: unknown
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    campaign_id: string
    recipient_email: string
    audience_segment_id: string
    provider?: string
    provider_message_id?: string | null
    status?: string
    idempotency_key: string
    attempt_count?: number
    last_error?: string | null
    sent_at?: string | null
    delivered_at?: string | null
    metadata?: unknown
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    campaign_id?: string
    recipient_email?: string
    audience_segment_id?: string
    provider?: string
    provider_message_id?: string | null
    status?: string
    idempotency_key?: string
    attempt_count?: number
    last_error?: string | null
    sent_at?: string | null
    delivered_at?: string | null
    metadata?: unknown
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "platform_email_deliveries_campaign_id_fkey"
      columns: ["campaign_id"]
      referencedRelation: "platform_email_campaigns"
      referencedColumns: ["id"]
    },
  ]
}
