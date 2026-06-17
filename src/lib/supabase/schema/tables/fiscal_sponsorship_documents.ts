export type FiscalSponsorshipDocumentsTable = {
  Row: {
    id: string
    application_id: string
    org_id: string
    project_id: string
    asset_id: string | null
    kind: string
    status: string
    document_key: string | null
    review_status: string
    title: string
    version: number
    storage_path: string | null
    mime: string | null
    size_bytes: number | null
    source_snapshot: unknown
    generated_by: string | null
    generated_at: string
    uploaded_by: string | null
    uploaded_at: string | null
    reviewed_by: string | null
    reviewed_at: string | null
    review_notes: string | null
    metadata: unknown
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    application_id: string
    org_id: string
    project_id: string
    asset_id?: string | null
    kind: string
    status?: string
    document_key?: string | null
    review_status?: string
    title: string
    version?: number
    storage_path?: string | null
    mime?: string | null
    size_bytes?: number | null
    source_snapshot?: unknown
    generated_by?: string | null
    generated_at?: string
    uploaded_by?: string | null
    uploaded_at?: string | null
    reviewed_by?: string | null
    reviewed_at?: string | null
    review_notes?: string | null
    metadata?: unknown
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    application_id?: string
    org_id?: string
    project_id?: string
    asset_id?: string | null
    kind?: string
    status?: string
    document_key?: string | null
    review_status?: string
    title?: string
    version?: number
    storage_path?: string | null
    mime?: string | null
    size_bytes?: number | null
    source_snapshot?: unknown
    generated_by?: string | null
    generated_at?: string
    uploaded_by?: string | null
    uploaded_at?: string | null
    reviewed_by?: string | null
    reviewed_at?: string | null
    review_notes?: string | null
    metadata?: unknown
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "fiscal_sponsorship_documents_application_id_fkey"
      columns: ["application_id"]
      referencedRelation: "fiscal_sponsorship_applications"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "fiscal_sponsorship_documents_org_id_fkey"
      columns: ["org_id"]
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
    {
      foreignKeyName: "fiscal_sponsorship_documents_project_id_fkey"
      columns: ["project_id"]
      referencedRelation: "organization_projects"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "fiscal_sponsorship_documents_asset_id_fkey"
      columns: ["asset_id"]
      referencedRelation: "organization_project_assets"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "fiscal_sponsorship_documents_generated_by_fkey"
      columns: ["generated_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "fiscal_sponsorship_documents_uploaded_by_fkey"
      columns: ["uploaded_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "fiscal_sponsorship_documents_reviewed_by_fkey"
      columns: ["reviewed_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
