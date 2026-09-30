type CoachingCreditGrantRow = {
  id: string
  user_id: string
  org_id: string | null
  source_type: string
  label: string
  quantity: number
  reason: string
  expires_at: string | null
  issued_by: string | null
  request_key: string
  created_at: string
}
export type CoachingCreditGrantsTable = {
  Row: CoachingCreditGrantRow
  Insert: Omit<CoachingCreditGrantRow, "id" | "created_at" | "org_id" | "expires_at" | "issued_by"> & { id?: string; created_at?: string; org_id?: string | null; expires_at?: string | null; issued_by?: string | null }
  Update: Partial<CoachingCreditGrantRow>
  Relationships: []
}
