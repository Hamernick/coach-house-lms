export type OrganizationAccessSettingsTable = {
  Row: {
    org_id: string
    admins_can_invite: boolean
    staff_can_manage_calendar: boolean
    created_at: string
    updated_at: string
  }
  Insert: {
    org_id: string
    admins_can_invite?: boolean
    staff_can_manage_calendar?: boolean
    created_at?: string
    updated_at?: string
  }
  Update: {
    org_id?: string
    admins_can_invite?: boolean
    staff_can_manage_calendar?: boolean
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "organization_access_settings_org_id_fkey"
      columns: ["org_id"]
      isOneToOne: true
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
  ]
}
