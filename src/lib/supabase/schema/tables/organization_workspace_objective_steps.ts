import type { Json } from "../json"

export type OrganizationWorkspaceObjectiveStepsTable = {
  Row: {
    id: string
    objective_id: string
    org_id: string
    step_order: number
    step_type: string
    title: string
    status: string
    payload: Json
    started_at: string | null
    completed_at: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    objective_id: string
    org_id: string
    step_order: number
    step_type: string
    title: string
    status?: string
    payload?: Json
    started_at?: string | null
    completed_at?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    objective_id?: string
    org_id?: string
    step_order?: number
    step_type?: string
    title?: string
    status?: string
    payload?: Json
    started_at?: string | null
    completed_at?: string | null
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "organization_workspace_objective_steps_objective_id_fkey"
      columns: ["objective_id"]
      referencedRelation: "organization_workspace_objectives"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "organization_workspace_objective_steps_org_id_fkey"
      columns: ["org_id"]
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
  ]
}
