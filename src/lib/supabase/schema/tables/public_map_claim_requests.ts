export type PublicMapClaimRequestsTable = {
  Row: {
    id: string
    target_kind: string
    target_id: string | null
    listing_name: string
    claimant_name: string
    claimant_email: string
    message: string | null
    status: string
    submission_key: string
    risk_key: string
    email_target_key: string
    task_id: string | null
    delivery_status: string
    delivery_error: string | null
    assigned_to: string | null
    reviewed_by: string | null
    reviewed_at: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    target_kind: string
    target_id?: string | null
    listing_name: string
    claimant_name: string
    claimant_email: string
    message?: string | null
    status?: string
    submission_key: string
    risk_key: string
    email_target_key: string
    task_id?: string | null
    delivery_status?: string
    delivery_error?: string | null
    assigned_to?: string | null
    reviewed_by?: string | null
    reviewed_at?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: Partial<PublicMapClaimRequestsTable["Insert"]>
  Relationships: [
    {
      foreignKeyName: "public_map_claim_requests_task_id_fkey"
      columns: ["task_id"]
      referencedRelation: "organization_tasks"
      referencedColumns: ["id"]
    },
  ]
}
