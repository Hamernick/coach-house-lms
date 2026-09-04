export type GoogleDriveConnectionsTable = {
  Row: {
    id: string
    user_id: string
    google_subject: string
    google_email: string
    refresh_token_ciphertext: string | null
    refresh_token_iv: string | null
    refresh_token_auth_tag: string | null
    key_version: string | null
    granted_scopes: string[]
    status: string
    last_verified_at: string | null
    last_error_code: string | null
    connected_at: string
    disconnected_at: string | null
    updated_at: string
  }
  Insert: Omit<GoogleDriveConnectionsTable["Row"], "id" | "connected_at" | "updated_at"> & {
    id?: string
    connected_at?: string
    updated_at?: string
  }
  Update: Partial<GoogleDriveConnectionsTable["Insert"]>
  Relationships: [
    {
      foreignKeyName: "google_drive_connections_user_id_fkey"
      columns: ["user_id"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
