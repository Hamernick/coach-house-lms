import type { Json } from "../json"
import type { PublicEnums } from "../enums"

export type AssignmentSubmissionsTable = {
  Row: {
    id: string
    module_id: string
    user_id: string
    answers: Json
    status: PublicEnums["submission_status"]
    feedback: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    module_id: string
    user_id: string
    answers?: Json
    status?: PublicEnums["submission_status"]
    feedback?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    module_id?: string
    user_id?: string
    answers?: Json
    status?: PublicEnums["submission_status"]
    feedback?: string | null
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "assignment_submissions_module_id_fkey"
      columns: ["module_id"]
      referencedRelation: "modules"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "assignment_submissions_user_id_fkey"
      columns: ["user_id"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}

