export type PlatformEmailSuppressionsTable = {
  Row: {
    id: string
    email: string
    reason: string
    source: string
    created_by: string | null
    metadata: unknown
    created_at: string
  }
  Insert: {
    id?: string
    email: string
    reason: string
    source?: string
    created_by?: string | null
    metadata?: unknown
    created_at?: string
  }
  Update: {
    id?: string
    email?: string
    reason?: string
    source?: string
    created_by?: string | null
    metadata?: unknown
    created_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "platform_email_suppressions_created_by_fkey"
      columns: ["created_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
