export type EnrollmentInvitesTable = {
  Row: {
    id: string
    class_id: string
    email: string
    token: string
    expires_at: string
    invited_by: string | null
    accepted_at: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    class_id: string
    email: string
    token: string
    expires_at: string
    invited_by?: string | null
    accepted_at?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    class_id?: string
    email?: string
    token?: string
    expires_at?: string
    invited_by?: string | null
    accepted_at?: string | null
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "enrollment_invites_class_id_fkey"
      columns: ["class_id"]
      referencedRelation: "classes"
      referencedColumns: ["id"]
    },
  ]
}

