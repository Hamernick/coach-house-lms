export type OrganizationStaffKanbanPreferencesTable = {
  Row: {
    staff_user_id: string
    organization_id: string
    hidden_at: string
    created_at: string
    updated_at: string
  }
  Insert: {
    staff_user_id: string
    organization_id: string
    hidden_at?: string
    created_at?: string
    updated_at?: string
  }
  Update: {
    staff_user_id?: string
    organization_id?: string
    hidden_at?: string
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "organization_staff_kanban_preferences_staff_user_id_fkey"
      columns: ["staff_user_id"]
      isOneToOne: false
      referencedRelation: "platform_staff_members"
      referencedColumns: ["user_id"]
    },
    {
      foreignKeyName: "organization_staff_kanban_preferences_organization_id_fkey"
      columns: ["organization_id"]
      isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
  ]
}
