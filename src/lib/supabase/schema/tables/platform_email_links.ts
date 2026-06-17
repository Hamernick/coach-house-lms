export type PlatformEmailLinksTable = {
  Row: {
    id: string
    campaign_id: string | null
    link_key: string
    label: string
    url: string
    block_id: string | null
    metadata: unknown
    created_at: string
  }
  Insert: {
    id?: string
    campaign_id?: string | null
    link_key: string
    label?: string
    url: string
    block_id?: string | null
    metadata?: unknown
    created_at?: string
  }
  Update: {
    id?: string
    campaign_id?: string | null
    link_key?: string
    label?: string
    url?: string
    block_id?: string | null
    metadata?: unknown
    created_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "platform_email_links_campaign_id_fkey"
      columns: ["campaign_id"]
      referencedRelation: "platform_email_campaigns"
      referencedColumns: ["id"]
    },
  ]
}
