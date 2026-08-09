export type FinanceOpportunitySourcesTable = {
  Row: {
    id: string
    source_key: string
    source_type: string
    name: string
    base_url: string | null
    allowed_domains: string[]
    auth_type: string
    trust_level: string
    refresh_cadence_minutes: number
    enabled: boolean
    owner_user_id: string | null
    terms_notes: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    source_key: string
    source_type: string
    name: string
    base_url?: string | null
    allowed_domains?: string[]
    auth_type?: string
    trust_level: string
    refresh_cadence_minutes?: number
    enabled?: boolean
    owner_user_id?: string | null
    terms_notes?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    source_key?: string
    source_type?: string
    name?: string
    base_url?: string | null
    allowed_domains?: string[]
    auth_type?: string
    trust_level?: string
    refresh_cadence_minutes?: number
    enabled?: boolean
    owner_user_id?: string | null
    terms_notes?: string | null
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "finance_opportunity_sources_owner_user_id_fkey"
      columns: ["owner_user_id"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
