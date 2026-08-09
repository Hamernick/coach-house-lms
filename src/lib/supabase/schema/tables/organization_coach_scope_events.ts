export type OrganizationCoachScopeEventsTable = {
  Row: {
    id: number
    assigned_only_enabled: boolean
    organization_count: number
    assignment_count: number
    changed_by: string
    created_at: string
  }
  Insert: {
    id?: number
    assigned_only_enabled: boolean
    organization_count: number
    assignment_count: number
    changed_by: string
    created_at?: string
  }
  Update: {
    id?: number
    assigned_only_enabled?: boolean
    organization_count?: number
    assignment_count?: number
    changed_by?: string
    created_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "organization_coach_scope_events_changed_by_fkey"
      columns: ["changed_by"]
      isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
