export type FiscalSponsorshipSigningDraftsTable = {
  Row: {
    id: string
    packet_id: string
    application_id: string
    org_id: string
    project_id: string
    signer_id: string
    signer_role: string
    signer_title: string | null
    field_values: unknown
    confirmed_fields: string[]
    signature_method: string | null
    signature_value: string | null
    document_sha256: string | null
    revision: number
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    packet_id: string
    application_id: string
    org_id: string
    project_id: string
    signer_id: string
    signer_role: string
    signer_title?: string | null
    field_values?: unknown
    confirmed_fields?: string[]
    signature_method?: string | null
    signature_value?: string | null
    document_sha256?: string | null
    revision?: number
    created_at?: string
    updated_at?: string
  }
  Update: Partial<FiscalSponsorshipSigningDraftsTable["Insert"]>
  Relationships: []
}
