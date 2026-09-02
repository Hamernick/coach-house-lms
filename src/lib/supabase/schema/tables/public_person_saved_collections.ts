export type PublicPersonSavedCollectionsTable = {
  Row: {
    id: string
    profile_id: string
    name: string
    is_public: boolean
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    profile_id: string
    name: string
    is_public?: boolean
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    profile_id?: string
    name?: string
    is_public?: boolean
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "public_person_saved_collections_profile_id_fkey"
      columns: ["profile_id"]
      referencedRelation: "public_person_profiles"
      referencedColumns: ["profile_id"]
    },
  ]
}
