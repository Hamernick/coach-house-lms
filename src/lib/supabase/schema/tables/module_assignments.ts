import type { Json } from "../json"

export type ModuleAssignmentsTable = {
  Row: {
    module_id: string
    schema: Json
    complete_on_submit: boolean
    created_at: string
    updated_at: string
  }
  Insert: {
    module_id: string
    schema?: Json
    complete_on_submit?: boolean
    created_at?: string
    updated_at?: string
  }
  Update: {
    module_id?: string
    schema?: Json
    complete_on_submit?: boolean
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "module_assignments_module_id_fkey"
      columns: ["module_id"]
      referencedRelation: "modules"
      referencedColumns: ["id"]
    },
  ]
}

