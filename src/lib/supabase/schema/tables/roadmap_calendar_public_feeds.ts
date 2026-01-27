export type RoadmapCalendarPublicFeedsTable = {
  Row: {
    org_id: string
    token: string
    created_at: string
    rotated_at: string
  }
  Insert: {
    org_id: string
    token: string
    created_at?: string
    rotated_at?: string
  }
  Update: {
    org_id?: string
    token?: string
    created_at?: string
    rotated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "roadmap_calendar_public_feeds_org_id_fkey"
      columns: ["org_id"]
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
  ]
}
