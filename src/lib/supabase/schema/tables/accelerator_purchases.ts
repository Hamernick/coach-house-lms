export type AcceleratorPurchasesTable = {
  Row: {
    id: string
    user_id: string
    stripe_checkout_session_id: string | null
    stripe_payment_intent_id: string | null
    stripe_customer_id: string | null
    coaching_included: boolean
    status: "active" | "refunded"
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    user_id: string
    stripe_checkout_session_id?: string | null
    stripe_payment_intent_id?: string | null
    stripe_customer_id?: string | null
    coaching_included?: boolean
    status?: "active" | "refunded"
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    user_id?: string
    stripe_checkout_session_id?: string | null
    stripe_payment_intent_id?: string | null
    stripe_customer_id?: string | null
    coaching_included?: boolean
    status?: "active" | "refunded"
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "accelerator_purchases_user_id_fkey"
      columns: ["user_id"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
