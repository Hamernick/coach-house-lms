export type OrganizationTasksTable = {
  Row: {
    id: string
    org_id: string
    project_id: string
    title: string
    description: string | null
    task_type: string
    status: string
    start_date: string
    end_date: string
    priority: string
    tag_label: string | null
    workstream_name: string | null
    sort_order: number
    created_source: string
    starter_seed_key: string | null
    starter_seed_version: number | null
    created_by: string
    updated_by: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    org_id: string
    project_id: string
    title: string
    description?: string | null
    task_type?: string
    status?: string
    start_date: string
    end_date: string
    priority?: string
    tag_label?: string | null
    workstream_name?: string | null
    sort_order?: number
    created_source?: string
    starter_seed_key?: string | null
    starter_seed_version?: number | null
    created_by: string
    updated_by?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    org_id?: string
    project_id?: string
    title?: string
    description?: string | null
    task_type?: string
    status?: string
    start_date?: string
    end_date?: string
    priority?: string
    tag_label?: string | null
    workstream_name?: string | null
    sort_order?: number
    created_source?: string
    starter_seed_key?: string | null
    starter_seed_version?: number | null
    created_by?: string
    updated_by?: string | null
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "organization_tasks_org_id_fkey"
      columns: ["org_id"]
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
    {
      foreignKeyName: "organization_tasks_project_id_fkey"
      columns: ["project_id"]
      referencedRelation: "organization_projects"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "organization_tasks_created_by_fkey"
      columns: ["created_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "organization_tasks_updated_by_fkey"
      columns: ["updated_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
