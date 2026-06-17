export type PlatformEmailCampaignsTable = {
  Row: {
    id: string
    slug: string
    title: string
    subject: string
    preview_text: string
    markdown_content: string
    status: string
    audience_segment_id: string
    created_by: string
    approved_by: string | null
    scheduled_for: string | null
    sent_at: string | null
    metadata: unknown
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    slug: string
    title: string
    subject: string
    preview_text?: string
    markdown_content?: string
    status?: string
    audience_segment_id: string
    created_by: string
    approved_by?: string | null
    scheduled_for?: string | null
    sent_at?: string | null
    metadata?: unknown
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    slug?: string
    title?: string
    subject?: string
    preview_text?: string
    markdown_content?: string
    status?: string
    audience_segment_id?: string
    created_by?: string
    approved_by?: string | null
    scheduled_for?: string | null
    sent_at?: string | null
    metadata?: unknown
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "platform_email_campaigns_created_by_fkey"
      columns: ["created_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "platform_email_campaigns_approved_by_fkey"
      columns: ["approved_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
