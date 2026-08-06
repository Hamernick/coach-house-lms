export type OrganizationPeopleTagsTable = {
  Row: {
    id: string
    org_id: string
    label: string
    color: string
    sort_order: number
    created_by: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    org_id: string
    label: string
    color?: string
    sort_order?: number
    created_by?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    org_id?: string
    label?: string
    color?: string
    sort_order?: number
    created_by?: string | null
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "organization_people_tags_org_id_fkey"
      columns: ["org_id"]
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
    {
      foreignKeyName: "organization_people_tags_created_by_fkey"
      columns: ["created_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
