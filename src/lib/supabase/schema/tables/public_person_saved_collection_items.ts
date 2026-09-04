export type PublicPersonSavedCollectionItemsTable = {
  Row: {
    collection_id: string
    item_kind: "organization" | "resource"
    item_id: string
    position: number
    created_at: string
  }
  Insert: {
    collection_id: string
    item_kind: "organization" | "resource"
    item_id: string
    position: number
    created_at?: string
  }
  Update: {
    collection_id?: string
    item_kind?: "organization" | "resource"
    item_id?: string
    position?: number
    created_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "public_person_saved_collection_items_collection_id_fkey"
      columns: ["collection_id"]
      referencedRelation: "public_person_saved_collections"
      referencedColumns: ["id"]
    },
  ]
}
