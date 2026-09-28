import type { Json } from "../json"

export type OrganizationProjectsTable = {
  Row: {
    id: string
    tracker_metadata?: Json | null
    org_id: string
    canonical_org_id: string | null
    organization_unassigned?: boolean
    project_kind: string
    name: string
    description: string | null
    status: string
    priority: string
    progress: number
    start_date: string | null
    recurrence?: "none" | "monthly"
    recurrence_anchor_start?: string | null
    recurrence_anchor_end?: string | null
    recurrence_occurrence?: number
    recurrence_generated?: boolean
    guided_setup?: Json | null
    creation_request_id?: string | null
    schedule_confirmed?: boolean
    end_date: string | null
    client_name: string | null
    option_settings?: Json | null
    type_label: string | null
    duration_label: string | null
    tags: string[]
    member_labels: string[]
    task_count: number
    created_source: string
    starter_seed_key: string | null
    starter_seed_version: number | null
    created_by: string | null
    updated_by: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    tracker_metadata?: Json | null
    org_id: string
    canonical_org_id?: string | null
    organization_unassigned?: boolean
    project_kind?: string
    name: string
    description?: string | null
    status?: string
    priority?: string
    progress?: number
    start_date: string | null
    recurrence?: "none" | "monthly"
    recurrence_anchor_start?: string | null
    recurrence_anchor_end?: string | null
    recurrence_occurrence?: number
    recurrence_generated?: boolean
    guided_setup?: Json | null
    creation_request_id?: string | null
    schedule_confirmed?: boolean
    end_date: string | null
    client_name?: string | null
    option_settings?: Json | null
    type_label?: string | null
    duration_label?: string | null
    tags?: string[]
    member_labels?: string[]
    task_count?: number
    created_source?: string
    starter_seed_key?: string | null
    starter_seed_version?: number | null
    created_by?: string | null
    updated_by?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    tracker_metadata?: Json | null
    org_id?: string
    canonical_org_id?: string | null
    organization_unassigned?: boolean
    project_kind?: string
    name?: string
    description?: string | null
    status?: string
    priority?: string
    progress?: number
    start_date?: string | null
    recurrence?: "none" | "monthly"
    recurrence_anchor_start?: string | null
    recurrence_anchor_end?: string | null
    recurrence_occurrence?: number
    recurrence_generated?: boolean
    guided_setup?: Json | null
    creation_request_id?: string | null
    schedule_confirmed?: boolean
    end_date?: string | null
    client_name?: string | null
    option_settings?: Json | null
    type_label?: string | null
    duration_label?: string | null
    tags?: string[]
    member_labels?: string[]
    task_count?: number
    created_source?: string
    starter_seed_key?: string | null
    starter_seed_version?: number | null
    created_by?: string | null
    updated_by?: string | null
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "organization_projects_org_id_fkey"
      columns: ["org_id"]
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
    {
      foreignKeyName: "organization_projects_canonical_org_id_fkey"
      columns: ["canonical_org_id"]
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
    {
      foreignKeyName: "organization_projects_created_by_fkey"
      columns: ["created_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "organization_projects_updated_by_fkey"
      columns: ["updated_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
