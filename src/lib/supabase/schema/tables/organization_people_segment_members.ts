export type OrganizationPeopleSegmentMembersTable = {
  Row: {
    segment_id: string
    person_id: string
    added_by: string | null
    created_at: string
  }
  Insert: {
    segment_id: string
    person_id: string
    added_by?: string | null
    created_at?: string
  }
  Update: {
    segment_id?: string
    person_id?: string
    added_by?: string | null
    created_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "organization_people_segment_members_segment_id_fkey"
      columns: ["segment_id"]
      referencedRelation: "organization_people_segments"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "organization_people_segment_members_added_by_fkey"
      columns: ["added_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
