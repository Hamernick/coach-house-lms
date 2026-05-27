export type CoachingCreditLedgerTable = {
  Row: {
    id: string
    org_id: string
    user_id: string
    booking_id: string | null
    source: string
    quantity: number
    note: string | null
    stripe_checkout_session_id: string | null
    stripe_payment_intent_id: string | null
    expires_at: string | null
    created_at: string
  }
  Insert: {
    id?: string
    org_id: string
    user_id: string
    booking_id?: string | null
    source: string
    quantity: number
    note?: string | null
    stripe_checkout_session_id?: string | null
    stripe_payment_intent_id?: string | null
    expires_at?: string | null
    created_at?: string
  }
  Update: {
    id?: string
    org_id?: string
    user_id?: string
    booking_id?: string | null
    source?: string
    quantity?: number
    note?: string | null
    stripe_checkout_session_id?: string | null
    stripe_payment_intent_id?: string | null
    expires_at?: string | null
    created_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "coaching_credit_ledger_org_id_fkey"
      columns: ["org_id"]
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
    {
      foreignKeyName: "coaching_credit_ledger_user_id_fkey"
      columns: ["user_id"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "coaching_credit_ledger_booking_id_fkey"
      columns: ["booking_id"]
      referencedRelation: "coaching_bookings"
      referencedColumns: ["id"]
    },
  ]
}
