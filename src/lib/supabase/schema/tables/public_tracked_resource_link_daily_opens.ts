export type PublicTrackedResourceLinkDailyOpensTable = {
  Row: {
    link_id: string
    opened_on: string
    visitor_hash: string
    opened_at: string
  }
  Insert: {
    link_id: string
    opened_on?: string
    visitor_hash: string
    opened_at?: string
  }
  Update: {
    link_id?: string
    opened_on?: string
    visitor_hash?: string
    opened_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "public_tracked_resource_link_daily_opens_link_id_fkey"
      columns: ["link_id"]
      referencedRelation: "public_tracked_resource_links"
      referencedColumns: ["id"]
    },
  ]
}
