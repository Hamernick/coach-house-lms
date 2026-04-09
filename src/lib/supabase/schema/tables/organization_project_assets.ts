export type OrganizationProjectAssetsTable = {
  Row: {
    id: string
    org_id: string
    project_id: string
    name: string
    description: string | null
    asset_type: string
    storage_path: string | null
    external_url: string | null
    mime: string | null
    size_bytes: number | null
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
    description?: string | null
    asset_type?: string
    storage_path?: string | null
    external_url?: string | null
    mime?: string | null
    size_bytes?: number | null
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
    description?: string | null
    asset_type?: string
    storage_path?: string | null
    external_url?: string | null
    mime?: string | null
    size_bytes?: number | null
    created_by?: string
    updated_by?: string | null
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "organization_project_assets_org_id_fkey"
      columns: ["org_id"]
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
    {
      foreignKeyName: "organization_project_assets_project_id_fkey"
      columns: ["project_id"]
      referencedRelation: "organization_projects"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "organization_project_assets_created_by_fkey"
      columns: ["created_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "organization_project_assets_updated_by_fkey"
      columns: ["updated_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
