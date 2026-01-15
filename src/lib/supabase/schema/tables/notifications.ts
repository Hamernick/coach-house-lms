export type NotificationsTable = {
  Row: {
    id: string
    user_id: string
    title: string
    description: string
    href: string | null
    tone: string | null
    read_at: string | null
    archived_at: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    user_id: string
    title: string
    description: string
    href?: string | null
    tone?: string | null
    read_at?: string | null
    archived_at?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    user_id?: string
    title?: string
    description?: string
    href?: string | null
    tone?: string | null
    read_at?: string | null
    archived_at?: string | null
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "notifications_user_id_fkey"
      columns: ["user_id"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
