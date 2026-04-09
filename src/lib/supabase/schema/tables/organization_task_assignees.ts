export type OrganizationTaskAssigneesTable = {
  Row: {
    id: string
    org_id: string
    task_id: string
    user_id: string
    created_by: string
    created_at: string
  }
  Insert: {
    id?: string
    org_id: string
    task_id: string
    user_id: string
    created_by: string
    created_at?: string
  }
  Update: {
    id?: string
    org_id?: string
    task_id?: string
    user_id?: string
    created_by?: string
    created_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "organization_task_assignees_org_id_fkey"
      columns: ["org_id"]
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
    {
      foreignKeyName: "organization_task_assignees_task_id_fkey"
      columns: ["task_id"]
      referencedRelation: "organization_tasks"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "organization_task_assignees_user_id_fkey"
      columns: ["user_id"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "organization_task_assignees_created_by_fkey"
      columns: ["created_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
