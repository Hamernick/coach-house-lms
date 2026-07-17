export type FiscalSponsorshipSignaturesTable = {
  Row: {
    id: string
    packet_id: string
    application_id: string
    org_id: string
    project_id: string
    signer_id: string
    signer_role: string
    signer_name: string
    signer_email: string | null
    signer_title: string
    signature_method: string
    signature_value: string
    consent_version: string
    consent_text: string
    consent_sha256: string
    signed_document_sha256: string
    signature_sha256: string
    signed_at: string
    metadata: unknown
    created_at: string
  }
  Insert: {
    id?: string
    packet_id: string
    application_id: string
    org_id: string
    project_id: string
    signer_id: string
    signer_role: string
    signer_name: string
    signer_email?: string | null
    signer_title: string
    signature_method: string
    signature_value: string
    consent_version: string
    consent_text: string
    consent_sha256: string
    signed_document_sha256: string
    signature_sha256: string
    signed_at: string
    metadata?: unknown
    created_at?: string
  }
  Update: Partial<FiscalSponsorshipSignaturesTable["Insert"]>
  Relationships: []
}
