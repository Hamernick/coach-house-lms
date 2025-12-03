export type OnboardingResponsesTable = {
  Row: {
    id: string
    user_id: string
    org_id: string | null
    confidence_operating: number
    confidence_funding: number
    confidence_funders: number
    notes: string | null
    follow_up: boolean
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    user_id: string
    org_id?: string | null
    confidence_operating: number
    confidence_funding: number
    confidence_funders: number
    notes?: string | null
    follow_up?: boolean
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    user_id?: string
    org_id?: string | null
    confidence_operating?: number
    confidence_funding?: number
    confidence_funders?: number
    notes?: string | null
    follow_up?: boolean
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "onboarding_responses_org_id_fkey"
      columns: ["org_id"]
      isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
    {
      foreignKeyName: "onboarding_responses_user_id_fkey"
      columns: ["user_id"]
      isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
