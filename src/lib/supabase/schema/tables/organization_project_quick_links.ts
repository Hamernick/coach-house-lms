export type OrganizationProjectQuickLinksTable = {
  Row: {
    id: string
    org_id: string
    project_id: string
    name: string
    url: string
    link_type: string
    size_mb: number
    created_by: string
    updated_by: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    org_id: string
    project_id: string
    name: string
    url: string
    link_type?: string
    size_mb?: number
    created_by: string
    updated_by?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    org_id?: string
    project_id?: string
    name?: string
    url?: string
    link_type?: string
    size_mb?: number
    created_by?: string
    updated_by?: string | null
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "organization_project_quick_links_org_id_fkey"
      columns: ["org_id"]
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
    {
      foreignKeyName: "organization_project_quick_links_project_id_fkey"
      columns: ["project_id"]
      referencedRelation: "organization_projects"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "organization_project_quick_links_created_by_fkey"
      columns: ["created_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "organization_project_quick_links_updated_by_fkey"
      columns: ["updated_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
