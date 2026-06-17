export type PlatformEmailPreferencesTable = {
  Row: {
    id: string
    email: string
    topic_id: string
    status: string
    source: string
    person_id: string | null
    metadata: unknown
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    email: string
    topic_id: string
    status: string
    source?: string
    person_id?: string | null
    metadata?: unknown
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    email?: string
    topic_id?: string
    status?: string
    source?: string
    person_id?: string | null
    metadata?: unknown
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "platform_email_preferences_topic_id_fkey"
      columns: ["topic_id"]
      referencedRelation: "platform_email_topics"
      referencedColumns: ["id"]
    },
  ]
}
