export type NotificationsTable = {
  Row: {
    id: string
    type: string | null
    user_id: string
    org_id: string | null
    actor_id: string | null
    title: string
    description: string
    href: string | null
    tone: string | null
    metadata: Record<string, unknown> | null
    read_at: string | null
    archived_at: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    type?: string | null
    user_id: string
    org_id?: string | null
    actor_id?: string | null
    title: string
    description: string
    href?: string | null
    tone?: string | null
    metadata?: Record<string, unknown> | null
    read_at?: string | null
    archived_at?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    type?: string | null
    user_id?: string
    org_id?: string | null
    actor_id?: string | null
    title?: string
    description?: string
    href?: string | null
    tone?: string | null
    metadata?: Record<string, unknown> | null
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
    {
      foreignKeyName: "notifications_org_id_fkey"
      columns: ["org_id"]
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
    {
      foreignKeyName: "notifications_actor_id_fkey"
      columns: ["actor_id"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
