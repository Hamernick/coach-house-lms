export type PublicPersonProfilesTable = {
  Row: {
    profile_id: string
    display_name: string
    headline: string | null
    bio: string | null
    location_label: string | null
    website_url: string | null
    avatar_url: string | null
    is_public: boolean
    show_organizations: boolean
    show_program_activity: boolean
    show_saved_locations: boolean
    created_at: string
    updated_at: string
  }
  Insert: {
    profile_id: string
    display_name: string
    headline?: string | null
    bio?: string | null
    location_label?: string | null
    website_url?: string | null
    avatar_url?: string | null
    is_public?: boolean
    show_organizations?: boolean
    show_program_activity?: boolean
    show_saved_locations?: boolean
    created_at?: string
    updated_at?: string
  }
  Update: {
    profile_id?: string
    display_name?: string
    headline?: string | null
    bio?: string | null
    location_label?: string | null
    website_url?: string | null
    avatar_url?: string | null
    is_public?: boolean
    show_organizations?: boolean
    show_program_activity?: boolean
    show_saved_locations?: boolean
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "public_person_profiles_profile_id_fkey"
      columns: ["profile_id"]
      isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
