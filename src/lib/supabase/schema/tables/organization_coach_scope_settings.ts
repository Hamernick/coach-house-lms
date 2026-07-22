export type OrganizationCoachScopeSettingsTable = {
  Row: {
    id: boolean
    assigned_only_enabled: boolean
    activated_at: string | null
    activated_by: string | null
    updated_at: string
    updated_by: string | null
  }
  Insert: {
    id?: boolean
    assigned_only_enabled?: boolean
    activated_at?: string | null
    activated_by?: string | null
    updated_at?: string
    updated_by?: string | null
  }
  Update: {
    id?: boolean
    assigned_only_enabled?: boolean
    activated_at?: string | null
    activated_by?: string | null
    updated_at?: string
    updated_by?: string | null
  }
  Relationships: [
    {
      foreignKeyName: "organization_coach_scope_settings_activated_by_fkey"
      columns: ["activated_by"]
      isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "organization_coach_scope_settings_updated_by_fkey"
      columns: ["updated_by"]
      isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
