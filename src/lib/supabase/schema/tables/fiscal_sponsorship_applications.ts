export type FiscalSponsorshipApplicationsTable = {
  Row: {
    id: string
    org_id: string
    project_id: string
    status: string
    applicant_full_name: string | null
    applicant_first_name: string | null
    applicant_last_name: string | null
    mailing_street_address: string | null
    mailing_street_address_2: string | null
    mailing_city: string | null
    mailing_state: string | null
    mailing_postal_code: string | null
    phone_number: string | null
    primary_email: string | null
    legal_entity_type: string | null
    legal_entity_has_501c3: boolean | null
    formation_status: string | null
    project_name: string | null
    project_duration_type: string | null
    temporary_start_date: string | null
    temporary_end_date: string | null
    focus_area: string | null
    project_description: string | null
    project_location: string | null
    estimated_budget_cents: number | null
    expense_summary: string | null
    prospective_funding_sources: string | null
    public_benefit: string | null
    leadership_background: string | null
    initiative_history: string | null
    short_public_description: string | null
    operates_outside_united_states: boolean | null
    receives_investor_return_funds: boolean | null
    engages_in_lobbying: boolean | null
    has_legal_compliance_financial_concerns: boolean | null
    concerns_explanation: string | null
    source_snapshot: unknown
    document_template_payload: unknown
    review_notes: string | null
    submitted_at: string | null
    reviewed_by: string | null
    reviewed_at: string | null
    created_by: string | null
    updated_by: string | null
    metadata: unknown
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    org_id: string
    project_id: string
    status?: string
    applicant_full_name?: string | null
    applicant_first_name?: string | null
    applicant_last_name?: string | null
    mailing_street_address?: string | null
    mailing_street_address_2?: string | null
    mailing_city?: string | null
    mailing_state?: string | null
    mailing_postal_code?: string | null
    phone_number?: string | null
    primary_email?: string | null
    legal_entity_type?: string | null
    legal_entity_has_501c3?: boolean | null
    formation_status?: string | null
    project_name?: string | null
    project_duration_type?: string | null
    temporary_start_date?: string | null
    temporary_end_date?: string | null
    focus_area?: string | null
    project_description?: string | null
    project_location?: string | null
    estimated_budget_cents?: number | null
    expense_summary?: string | null
    prospective_funding_sources?: string | null
    public_benefit?: string | null
    leadership_background?: string | null
    initiative_history?: string | null
    short_public_description?: string | null
    operates_outside_united_states?: boolean | null
    receives_investor_return_funds?: boolean | null
    engages_in_lobbying?: boolean | null
    has_legal_compliance_financial_concerns?: boolean | null
    concerns_explanation?: string | null
    source_snapshot?: unknown
    document_template_payload?: unknown
    review_notes?: string | null
    submitted_at?: string | null
    reviewed_by?: string | null
    reviewed_at?: string | null
    created_by?: string | null
    updated_by?: string | null
    metadata?: unknown
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    org_id?: string
    project_id?: string
    status?: string
    applicant_full_name?: string | null
    applicant_first_name?: string | null
    applicant_last_name?: string | null
    mailing_street_address?: string | null
    mailing_street_address_2?: string | null
    mailing_city?: string | null
    mailing_state?: string | null
    mailing_postal_code?: string | null
    phone_number?: string | null
    primary_email?: string | null
    legal_entity_type?: string | null
    legal_entity_has_501c3?: boolean | null
    formation_status?: string | null
    project_name?: string | null
    project_duration_type?: string | null
    temporary_start_date?: string | null
    temporary_end_date?: string | null
    focus_area?: string | null
    project_description?: string | null
    project_location?: string | null
    estimated_budget_cents?: number | null
    expense_summary?: string | null
    prospective_funding_sources?: string | null
    public_benefit?: string | null
    leadership_background?: string | null
    initiative_history?: string | null
    short_public_description?: string | null
    operates_outside_united_states?: boolean | null
    receives_investor_return_funds?: boolean | null
    engages_in_lobbying?: boolean | null
    has_legal_compliance_financial_concerns?: boolean | null
    concerns_explanation?: string | null
    source_snapshot?: unknown
    document_template_payload?: unknown
    review_notes?: string | null
    submitted_at?: string | null
    reviewed_by?: string | null
    reviewed_at?: string | null
    created_by?: string | null
    updated_by?: string | null
    metadata?: unknown
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "fiscal_sponsorship_applications_org_id_fkey"
      columns: ["org_id"]
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
    {
      foreignKeyName: "fiscal_sponsorship_applications_project_id_fkey"
      columns: ["project_id"]
      referencedRelation: "organization_projects"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "fiscal_sponsorship_applications_reviewed_by_fkey"
      columns: ["reviewed_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "fiscal_sponsorship_applications_created_by_fkey"
      columns: ["created_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "fiscal_sponsorship_applications_updated_by_fkey"
      columns: ["updated_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
