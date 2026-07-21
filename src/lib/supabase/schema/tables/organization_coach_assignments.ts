export type OrganizationCoachAssignmentsTable = {
  Row: {
    organization_id: string
    coach_user_id: string
    assigned_by: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    organization_id: string
    coach_user_id: string
    assigned_by?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    organization_id?: string
    coach_user_id?: string
    assigned_by?: string | null
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "organization_coach_assignments_organization_id_fkey"
      columns: ["organization_id"]
      isOneToOne: true
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
    {
      foreignKeyName: "organization_coach_assignments_coach_user_id_fkey"
      columns: ["coach_user_id"]
      isOneToOne: false
      referencedRelation: "platform_staff_members"
      referencedColumns: ["user_id"]
    },
    {
      foreignKeyName: "organization_coach_assignments_assigned_by_fkey"
      columns: ["assigned_by"]
      isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
