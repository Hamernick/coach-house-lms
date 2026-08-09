export type PlatformAdminWorkstreamCategoriesTable = {
  Row: {
    id: string
    owner_id: string
    name: string
    color: string
    position: number
    default_key: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    owner_id: string
    name: string
    color?: string
    position?: number
    default_key?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    owner_id?: string
    name?: string
    color?: string
    position?: number
    default_key?: string | null
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "platform_admin_workstream_categories_owner_id_fkey"
      columns: ["owner_id"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
