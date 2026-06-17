export type FiscalSponsorshipSignaturePacketsTable = {
  Row: {
    id: string
    application_id: string
    document_id: string
    org_id: string
    project_id: string
    provider: string
    provider_template_id: string | null
    provider_submission_id: string | null
    status: string
    coach_signer_name: string | null
    coach_signer_email: string | null
    applicant_signer_name: string | null
    applicant_signer_email: string | null
    sent_by: string | null
    sent_at: string | null
    completed_at: string | null
    executed_document_id: string | null
    audit_document_id: string | null
    provider_payload: unknown
    metadata: unknown
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    application_id: string
    document_id: string
    org_id: string
    project_id: string
    provider?: string
    provider_template_id?: string | null
    provider_submission_id?: string | null
    status?: string
    coach_signer_name?: string | null
    coach_signer_email?: string | null
    applicant_signer_name?: string | null
    applicant_signer_email?: string | null
    sent_by?: string | null
    sent_at?: string | null
    completed_at?: string | null
    executed_document_id?: string | null
    audit_document_id?: string | null
    provider_payload?: unknown
    metadata?: unknown
    created_at?: string
    updated_at?: string
  }
  Update: Partial<FiscalSponsorshipSignaturePacketsTable["Insert"]>
  Relationships: [
    {
      foreignKeyName: "fiscal_sponsorship_signature_packets_application_id_fkey"
      columns: ["application_id"]
      referencedRelation: "fiscal_sponsorship_applications"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "fiscal_sponsorship_signature_packets_document_id_fkey"
      columns: ["document_id"]
      referencedRelation: "fiscal_sponsorship_documents"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "fiscal_sponsorship_signature_packets_org_id_fkey"
      columns: ["org_id"]
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
    {
      foreignKeyName: "fiscal_sponsorship_signature_packets_project_id_fkey"
      columns: ["project_id"]
      referencedRelation: "organization_projects"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "fiscal_sponsorship_signature_packets_sent_by_fkey"
      columns: ["sent_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
