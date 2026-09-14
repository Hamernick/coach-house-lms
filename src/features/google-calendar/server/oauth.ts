import "server-only"
import { createHash, randomBytes, randomUUID } from "node:crypto"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { CalendarError, type EncryptedCalendarSecret } from "../types"
import {
  calendarConfig,
  CALENDAR_EXPORT_SCOPE,
  CALENDAR_LIST_SCOPE,
  CALENDAR_READ_SCOPE,
} from "./config"
import { encryptCalendarSecret, decryptCalendarSecret } from "./token-crypto"
import { exchangeCalendarCode, refreshCalendarToken } from "./google-api"
import {
  asJson,
  checked,
  emptyCalendarState,
  getConnection,
  stateOf,
  updateConnection,
  type Connection,
} from "./store"
const hash = (value: string) => createHash("sha256").update(value).digest("hex")
const aad = (userId: string) => "google-calendar:connection:" + userId

export async function startCalendarConnection(userId: string) {
  const config = calendarConfig()
  const state = randomBytes(32).toString("base64url")
  const verifier = randomBytes(64).toString("base64url")
  checked(
    await createSupabaseAdminClient()
      .from("google_calendar_oauth_intents")
      .upsert({
        user_id: userId,
        state_sha256: hash(state),
        verifier: asJson(
          encryptCalendarSecret(verifier, "google-calendar:intent:" + userId)
        ),
        expires_at: new Date(Date.now() + 600000).toISOString(),
      })
  )
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth")
  url.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: [
      "openid",
      "email",
      CALENDAR_READ_SCOPE,
      CALENDAR_LIST_SCOPE,
      CALENDAR_EXPORT_SCOPE,
    ].join(" "),
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent select_account",
    state,
    code_challenge: createHash("sha256").update(verifier).digest("base64url"),
    code_challenge_method: "S256",
  }).toString()
  return url.toString()
}
export async function completeCalendarConnection(
  userId: string,
  state: string,
  code: string
) {
  if (
    !/^[a-zA-Z0-9_-]{43}$/.test(state) ||
    !code ||
    code.length > 4096 ||
    /[\x00-\x20\x7f]/.test(code)
  )
    throw new CalendarError("invalid_state")
  const admin = createSupabaseAdminClient()
  // DELETE RETURNING atomically consumes state; replay and concurrent callbacks fail.
  const intent = checked(
    await admin
      .from("google_calendar_oauth_intents")
      .delete()
      .eq("user_id", userId)
      .eq("state_sha256", hash(state))
      .gt("expires_at", new Date().toISOString())
      .select("*")
      .maybeSingle()
  )
  if (!intent) throw new CalendarError("invalid_state")
  const existing = await getConnection(userId)
  const result = await exchangeCalendarCode(
    code,
    decryptCalendarSecret(
      intent.verifier as unknown as EncryptedCalendarSecret,
      "google-calendar:intent:" + userId
    )
  )
  let refresh = result.tokens.refresh_token
  if (
    !refresh &&
    existing?.google_subject === result.subject &&
    existing.refresh_secret
  )
    refresh = decryptCalendarSecret(
      existing.refresh_secret as unknown as EncryptedCalendarSecret,
      aad(userId)
    )
  if (!refresh) throw new CalendarError("missing_refresh_token", 409)
  const sameAccount = existing?.google_subject === result.subject
  const values = {
    user_id: userId,
    google_subject: result.subject,
    google_email: result.email,
    refresh_secret: asJson(encryptCalendarSecret(refresh, aad(userId))),
    granted_scopes: result.scopes,
    status: "connected",
    enabled: false,
    export_org_id: sameAccount ? existing.export_org_id : null,
    state: asJson(sameAccount ? stateOf(existing) : emptyCalendarState()),
    revision: randomUUID(),
    last_error: null,
    lease_id: null,
    lease_expires_at: null,
    last_synced_at: sameAccount ? existing.last_synced_at : null,
    updated_at: new Date().toISOString(),
  }
  if (existing) await updateConnection(existing, values)
  else checked(await admin.from("google_calendar_connections").insert(values))
}
export async function accessToken(row: Connection) {
  if (!row.refresh_secret || row.status !== "connected")
    throw new CalendarError("reconnect_required", 409)
  try {
    return await refreshCalendarToken(
      decryptCalendarSecret(
        row.refresh_secret as unknown as EncryptedCalendarSecret,
        aad(row.user_id)
      )
    )
  } catch (error) {
    if (error instanceof CalendarError && error.code === "reconnect_required")
      await updateConnection(
        row,
        {
          status: "reconnect_required",
          enabled: false,
          refresh_secret: null,
          last_error: error.code,
        },
        true
      )
    throw error
  }
}
