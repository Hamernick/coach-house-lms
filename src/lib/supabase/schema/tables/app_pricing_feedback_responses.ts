export type AppPricingFeedbackResponsesTable = {
  Row: {
    id: string
    user_id: string
    org_id: string | null
    survey_key: string
    price_per_month_usd: number
    response_kind: "answered" | "skipped"
    would_pay: boolean | null
    feedback: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    user_id: string
    org_id?: string | null
    survey_key: string
    price_per_month_usd: number
    response_kind?: "answered" | "skipped"
    would_pay?: boolean | null
    feedback?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    user_id?: string
    org_id?: string | null
    survey_key?: string
    price_per_month_usd?: number
    response_kind?: "answered" | "skipped"
    would_pay?: boolean | null
    feedback?: string | null
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "app_pricing_feedback_responses_org_id_fkey"
      columns: ["org_id"]
      isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
    {
      foreignKeyName: "app_pricing_feedback_responses_user_id_fkey"
      columns: ["user_id"]
      isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
