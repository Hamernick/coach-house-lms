import "server-only"
import { OAuth2Client } from "google-auth-library"
import { CalendarError, type CalendarChoice } from "../types"
import {
  calendarConfig,
  CALENDAR_LIST_SCOPE,
  CALENDAR_READ_SCOPE,
} from "./config"

export async function googleFetch(url: string, init: RequestInit = {}) {
  let response: Response
  try {
    response = await fetch(url, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    })
  } catch {
    throw new CalendarError("provider_unavailable", 503)
  }
  if (response.status === 401)
    throw new CalendarError("reconnect_required", 409)
  if (response.status === 429) throw new CalendarError("rate_limited", 429)
  if (response.status === 403) {
    const failure = await response
      .clone()
      .json()
      .catch(() => ({}))
    const reasons =
      failure?.error?.errors?.map((item: { reason?: string }) => item.reason) ??
      []
    if (reasons.some((reason: string) => /[Rr]ateLimit|quota/.test(reason)))
      throw new CalendarError("rate_limited", 429)
    throw new CalendarError("calendar_unavailable", 403)
  }
  return response
}
type TokenResponse = {
  access_token?: string
  refresh_token?: string
  id_token?: string
  scope?: string
}
export async function exchangeCalendarCode(code: string, verifier: string) {
  const config = calendarConfig()
  const response = await googleFetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      code,
      code_verifier: verifier,
      grant_type: "authorization_code",
    }),
  })
  if (!response.ok) throw new CalendarError("authorization_denied")
  const tokens = (await response.json()) as TokenResponse
  if (!tokens.access_token || !tokens.id_token)
    throw new CalendarError("authorization_denied")
  const scopes = (tokens.scope ?? "").split(" ")
  if (
    ![CALENDAR_READ_SCOPE, CALENDAR_LIST_SCOPE].every((scope) =>
      scopes.includes(scope)
    )
  )
    throw new CalendarError("scope_denied")
  try {
    const ticket = await new OAuth2Client(config.clientId).verifyIdToken({
      idToken: tokens.id_token,
      audience: config.clientId,
    })
    const payload = ticket.getPayload()
    if (!payload?.sub || !payload.email || !payload.email_verified)
      throw new Error()
    return { tokens, subject: payload.sub, email: payload.email, scopes }
  } catch {
    throw new CalendarError("authorization_denied")
  }
}
export async function refreshCalendarToken(refreshToken: string) {
  const config = calendarConfig()
  const response = await googleFetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  })
  if (response.status === 400)
    throw new CalendarError("reconnect_required", 409)
  if (!response.ok) throw new CalendarError("provider_unavailable", 503)
  const token = (await response.json()) as TokenResponse
  if (!token.access_token) throw new CalendarError("reconnect_required", 409)
  return token.access_token
}
export async function calendarRequest<T>(
  token: string,
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await googleFetch(
    "https://www.googleapis.com/calendar/v3/" + path,
    {
      ...init,
      headers: {
        ...init.headers,
        authorization: "Bearer " + token,
        "content-type": "application/json",
      },
    }
  )
  if ([404, 410, 409].includes(response.status))
    throw new CalendarError("google_" + response.status, response.status)
  if (!response.ok) throw new CalendarError("provider_unavailable", 503)
  return response.status === 204
    ? (undefined as T)
    : ((await response.json()) as T)
}
export async function listCalendarChoices(
  token: string
): Promise<CalendarChoice[]> {
  const choices: CalendarChoice[] = []
  let pageToken: string | undefined
  for (let page = 0; page < 20; page++) {
    const params = new URLSearchParams({
      maxResults: "250",
      minAccessRole: "reader",
      fields: "nextPageToken,items(id,summary,timeZone,deleted)",
    })
    if (pageToken) params.set("pageToken", pageToken)
    const result = await calendarRequest<{
      items?: {
        id: string
        summary?: string
        timeZone?: string
        deleted?: boolean
      }[]
      nextPageToken?: string
    }>(token, "users/me/calendarList?" + params)
    choices.push(
      ...(result.items ?? [])
        .filter((item) => !item.deleted)
        .map((item) => ({
          id: item.id,
          name: item.summary?.slice(0, 500) ?? "Calendar",
          timeZone: item.timeZone ?? "UTC",
        }))
    )
    pageToken = result.nextPageToken
    if (!pageToken) return choices
  }
  throw new CalendarError("calendar_too_large", 422)
}
