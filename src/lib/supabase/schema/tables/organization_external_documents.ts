export type OrganizationExternalDocumentsTable = {
  Row: {
    id: string
    org_id: string
    provider: string
    provider_file_id: string
    connection_id: string | null
    name: string
    mime_type: string
    web_view_link: string
    drive_id: string | null
    modified_at: string | null
    status: string
    attached_by: string | null
    attached_at: string
    last_verified_at: string | null
    updated_at: string
  }
  Insert: Omit<OrganizationExternalDocumentsTable["Row"], "id" | "provider" | "attached_at" | "updated_at"> & {
    id?: string
    provider?: string
    attached_at?: string
    updated_at?: string
  }
  Update: Partial<OrganizationExternalDocumentsTable["Insert"]>
  Relationships: [
    {
      foreignKeyName: "organization_external_documents_org_id_fkey"
      columns: ["org_id"]
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
    {
      foreignKeyName: "organization_external_documents_connection_id_fkey"
      columns: ["connection_id"]
      referencedRelation: "google_drive_connections"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "organization_external_documents_attached_by_fkey"
      columns: ["attached_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
