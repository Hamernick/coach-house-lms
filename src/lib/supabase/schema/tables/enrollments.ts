export type EnrollmentsTable = {
  Row: {
    id: string
    user_id: string
    class_id: string
    status: string
    created_at: string
  }
  Insert: {
    id?: string
    user_id: string
    class_id: string
    status?: string
    created_at?: string
  }
  Update: {
    id?: string
    user_id?: string
    class_id?: string
    status?: string
    created_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "enrollments_class_id_fkey"
      columns: ["class_id"]
      referencedRelation: "classes"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "enrollments_user_id_fkey"
      columns: ["user_id"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}

