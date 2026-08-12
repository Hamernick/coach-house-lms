export type PlatformLegalAcceptancesTable = {
  Row: {
    id: number
    user_id: string
    document_version: string
    terms_sha256: string
    privacy_sha256: string
    accepted_at: string
    source: string
    created_at: string
  }
  Insert: {
    id?: number
    user_id: string
    document_version: string
    terms_sha256: string
    privacy_sha256: string
    accepted_at: string
    source: string
    created_at?: string
  }
  Update: {
    id?: number
    user_id?: string
    document_version?: string
    terms_sha256?: string
    privacy_sha256?: string
    accepted_at?: string
    source?: string
    created_at?: string
  }
  Relationships: []
}
