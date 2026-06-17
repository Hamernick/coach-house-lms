export type PlatformEmailConsentEventsTable = {
  Row: {
    id: string
    email: string
    topic_id: string | null
    action: string
    source: string
    person_id: string | null
    campaign_id: string | null
    delivery_id: string | null
    user_agent: string | null
    ip_hash: string | null
    metadata: unknown
    created_at: string
  }
  Insert: {
    id?: string
    email: string
    topic_id?: string | null
    action: string
    source: string
    person_id?: string | null
    campaign_id?: string | null
    delivery_id?: string | null
    user_agent?: string | null
    ip_hash?: string | null
    metadata?: unknown
    created_at?: string
  }
  Update: {
    id?: string
    email?: string
    topic_id?: string | null
    action?: string
    source?: string
    person_id?: string | null
    campaign_id?: string | null
    delivery_id?: string | null
    user_agent?: string | null
    ip_hash?: string | null
    metadata?: unknown
    created_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "platform_email_consent_events_topic_id_fkey"
      columns: ["topic_id"]
      referencedRelation: "platform_email_topics"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "platform_email_consent_events_campaign_id_fkey"
      columns: ["campaign_id"]
      referencedRelation: "platform_email_campaigns"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "platform_email_consent_events_delivery_id_fkey"
      columns: ["delivery_id"]
      referencedRelation: "platform_email_deliveries"
      referencedColumns: ["id"]
    },
  ]
}
