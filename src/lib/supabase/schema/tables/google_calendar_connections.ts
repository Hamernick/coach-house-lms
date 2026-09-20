import type { Json } from "../json"
export type GoogleCalendarConnectionsTable = {
  Row: {
    user_id: string
    google_subject: string
    google_email: string
    refresh_secret: Json | null
    granted_scopes: string[]
    status: string
    enabled: boolean
    export_org_id: string | null
    time_zone: string
    state: Json
    revision: string
    lease_id: string | null
    lease_expires_at: string | null
    last_synced_at: string | null
    last_error: string | null
    next_sync_at: string
    updated_at: string
  }
  Insert: Pick<
    GoogleCalendarConnectionsTable["Row"],
    "user_id" | "google_subject" | "google_email"
  > &
    Partial<GoogleCalendarConnectionsTable["Row"]>
  Update: Partial<GoogleCalendarConnectionsTable["Row"]>
  Relationships: []
}
export type GoogleCalendarOauthIntentsTable = {
  Row: {
    user_id: string
    state_sha256: string
    verifier: Json
    expires_at: string
  }
  Insert: GoogleCalendarOauthIntentsTable["Row"]
  Update: Partial<GoogleCalendarOauthIntentsTable["Row"]>
  Relationships: []
}
