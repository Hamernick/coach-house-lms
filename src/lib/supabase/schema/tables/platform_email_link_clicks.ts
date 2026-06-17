export type PlatformEmailLinkClicksTable = {
  Row: {
    id: string
    link_id: string | null
    campaign_id: string | null
    delivery_id: string | null
    email: string | null
    user_agent: string | null
    ip_hash: string | null
    metadata: unknown
    clicked_at: string
  }
  Insert: {
    id?: string
    link_id?: string | null
    campaign_id?: string | null
    delivery_id?: string | null
    email?: string | null
    user_agent?: string | null
    ip_hash?: string | null
    metadata?: unknown
    clicked_at?: string
  }
  Update: {
    id?: string
    link_id?: string | null
    campaign_id?: string | null
    delivery_id?: string | null
    email?: string | null
    user_agent?: string | null
    ip_hash?: string | null
    metadata?: unknown
    clicked_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "platform_email_link_clicks_link_id_fkey"
      columns: ["link_id"]
      referencedRelation: "platform_email_links"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "platform_email_link_clicks_campaign_id_fkey"
      columns: ["campaign_id"]
      referencedRelation: "platform_email_campaigns"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "platform_email_link_clicks_delivery_id_fkey"
      columns: ["delivery_id"]
      referencedRelation: "platform_email_deliveries"
      referencedColumns: ["id"]
    },
  ]
}
