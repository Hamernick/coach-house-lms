export type GoogleDriveOauthIntentsTable = {
  Row: {
    id: string
    user_id: string
    org_id: string
    state_sha256: string
    pkce_verifier_ciphertext: string
    pkce_verifier_iv: string
    pkce_verifier_auth_tag: string
    key_version: string
    return_path: string
    expires_at: string
    consumed_at: string | null
    created_at: string
  }
  Insert: Omit<GoogleDriveOauthIntentsTable["Row"], "id" | "consumed_at" | "created_at"> & {
    id?: string
    consumed_at?: string | null
    created_at?: string
  }
  Update: Partial<GoogleDriveOauthIntentsTable["Insert"]>
  Relationships: [
    {
      foreignKeyName: "google_drive_oauth_intents_user_id_fkey"
      columns: ["user_id"]
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "google_drive_oauth_intents_org_id_fkey"
      columns: ["org_id"]
      referencedRelation: "organizations"
      referencedColumns: ["user_id"]
    },
  ]
}
