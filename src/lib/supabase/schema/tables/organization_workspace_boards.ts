import type { Json } from "../json"

export type OrganizationWorkspaceBoardsTable = {
  Row: {
    org_id: string
    state: Json
    updated_by: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    org_id: string
    state?: Json
    updated_by?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    org_id?: string
    state?: Json
    updated_by?: string | null
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "organization_workspace_boards_org_id_fkey"
      columns: ["org_id"]
      isOneToOne: true
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
    {
      foreignKeyName: "organization_workspace_boards_updated_by_fkey"
      columns: ["updated_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
