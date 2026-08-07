export type OrganizationPeopleTagMembersTable = {
  Row: {
    tag_id: string
    person_id: string
    added_by: string | null
    created_at: string
  }
  Insert: {
    tag_id: string
    person_id: string
    added_by?: string | null
    created_at?: string
  }
  Update: {
    tag_id?: string
    person_id?: string
    added_by?: string | null
    created_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "organization_people_tag_members_tag_id_fkey"
      columns: ["tag_id"]
      referencedRelation: "organization_people_tags"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "organization_people_tag_members_added_by_fkey"
      columns: ["added_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
