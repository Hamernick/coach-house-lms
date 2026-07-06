export type ResourceMapServiceCategoriesTable = {
  Row: {
    service_id: string
    category_key: string
    is_primary: boolean
    confidence: number | null
    source_id: string | null
    created_at: string
  }
  Insert: {
    service_id: string
    category_key: string
    is_primary?: boolean
    confidence?: number | null
    source_id?: string | null
    created_at?: string
  }
  Update: {
    service_id?: string
    category_key?: string
    is_primary?: boolean
    confidence?: number | null
    source_id?: string | null
    created_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "resource_map_service_categories_service_id_fkey"
      columns: ["service_id"]
      referencedRelation: "resource_map_services"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "resource_map_service_categories_category_key_fkey"
      columns: ["category_key"]
      referencedRelation: "resource_map_categories"
      referencedColumns: ["key"]
    },
    {
      foreignKeyName: "resource_map_service_categories_source_id_fkey"
      columns: ["source_id"]
      referencedRelation: "resource_map_sources"
      referencedColumns: ["id"]
    },
  ]
}
