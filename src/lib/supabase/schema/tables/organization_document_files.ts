export type OrganizationDocumentFilesTable = {
  Row: {
    id: string
    org_id: string
    document_kind: string | null
    storage_path: string
    name: string
    mime_type: string
    size_bytes: number
    created_by: string
    deleted_at: string | null
    created_at: string
    updated_at: string
  }
  Insert: Omit<
    OrganizationDocumentFilesTable["Row"],
    "id" | "deleted_at" | "created_at" | "updated_at"
  > & {
    id?: string
    deleted_at?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: Partial<OrganizationDocumentFilesTable["Insert"]>
  Relationships: [
    {
      foreignKeyName: "organization_document_files_org_id_fkey"
      columns: ["org_id"]
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
    {
      foreignKeyName: "organization_document_files_created_by_fkey"
      columns: ["created_by"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
