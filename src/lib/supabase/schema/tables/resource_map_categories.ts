export type ResourceMapCategoriesTable = {
  Row: {
    key: string
    label: string
    parent_key: string | null
    sort_order: number
    marker_color: string | null
    icon_name: string | null
    aliases: string[]
    description: string | null
    is_active: boolean
    created_at: string
    updated_at: string
  }
  Insert: {
    key: string
    label: string
    parent_key?: string | null
    sort_order?: number
    marker_color?: string | null
    icon_name?: string | null
    aliases?: string[]
    description?: string | null
    is_active?: boolean
    created_at?: string
    updated_at?: string
  }
  Update: {
    key?: string
    label?: string
    parent_key?: string | null
    sort_order?: number
    marker_color?: string | null
    icon_name?: string | null
    aliases?: string[]
    description?: string | null
    is_active?: boolean
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "resource_map_categories_parent_key_fkey"
      columns: ["parent_key"]
      referencedRelation: "resource_map_categories"
      referencedColumns: ["key"]
    },
  ]
}
