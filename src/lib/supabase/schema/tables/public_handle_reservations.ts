export type PublicHandleReservationsTable = {
  Row: {
    handle: string
    reason: string
    created_at: string
  }
  Insert: {
    handle: string
    reason: string
    created_at?: string
  }
  Update: {
    handle?: string
    reason?: string
    created_at?: string
  }
  Relationships: []
}
