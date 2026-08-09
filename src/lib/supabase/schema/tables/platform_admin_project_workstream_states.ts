export type PlatformAdminProjectWorkstreamStatesTable = {
  Row: {
    owner_id: string
    project_id: string
    category_id: string
    started_at: string
    created_at: string
    updated_at: string
  }
  Insert: {
    owner_id: string
    project_id: string
    category_id: string
    started_at?: string
    created_at?: string
    updated_at?: string
  }
  Update: {
    owner_id?: string
    project_id?: string
    category_id?: string
    started_at?: string
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "platform_admin_project_workstream_states_owner_id_fkey"
      columns: ["owner_id"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "platform_admin_project_workstream_states_project_id_fkey"
      columns: ["project_id"]
      referencedRelation: "organization_projects"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "platform_admin_project_workstream_states_category_fkey"
      columns: ["owner_id", "category_id"]
      referencedRelation: "platform_admin_workstream_categories"
      referencedColumns: ["owner_id", "id"]
    },
  ]
}
