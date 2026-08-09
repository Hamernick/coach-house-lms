export type OrganizationFinanceAccessTable = {
  Row: {
    org_id: string
    member_id: string
    access_level: string
    granted_by: string
    created_at: string
    updated_at: string
  }
  Insert: {
    org_id: string
    member_id: string
    access_level?: string
    granted_by: string
    created_at?: string
    updated_at?: string
  }
  Update: {
    org_id?: string
    member_id?: string
    access_level?: string
    granted_by?: string
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "organization_finance_access_org_id_fkey"
      columns: ["org_id"]
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
    {
      foreignKeyName: "organization_finance_access_granted_by_fkey"
      columns: ["granted_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
