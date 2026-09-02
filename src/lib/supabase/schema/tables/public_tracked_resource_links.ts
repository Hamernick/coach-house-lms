export type PublicTrackedResourceLinksTable = {
  Row: {
    id: string
    code: string
    owner_profile_id: string
    resource_id: string
    resource_title: string
    target_url: string
    is_active: boolean
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    code: string
    owner_profile_id: string
    resource_id: string
    resource_title: string
    target_url: string
    is_active?: boolean
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    code?: string
    owner_profile_id?: string
    resource_id?: string
    resource_title?: string
    target_url?: string
    is_active?: boolean
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "public_tracked_resource_links_owner_profile_id_fkey"
      columns: ["owner_profile_id"]
      referencedRelation: "public_person_profiles"
      referencedColumns: ["profile_id"]
    },
  ]
}
