import "server-only"

import { env } from "@/lib/env"
import { GoogleDriveError } from "../types"

export const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file"
export const GOOGLE_DRIVE_SCOPES = ["openid", "email", GOOGLE_DRIVE_SCOPE]

export function getGoogleDriveConfig() {
  if (
    env.GOOGLE_DRIVE_ENABLED !== "true" ||
    !env.GOOGLE_DRIVE_CLIENT_ID ||
    !env.GOOGLE_DRIVE_CLIENT_SECRET ||
    !env.GOOGLE_DRIVE_REDIRECT_URI
  ) throw new GoogleDriveError("not_configured", 503)

  let redirectUri: URL
  try {
    redirectUri = new URL(env.GOOGLE_DRIVE_REDIRECT_URI)
  } catch {
    throw new GoogleDriveError("not_configured", 503)
  }
  const localHttp = redirectUri.protocol === "http:" &&
    (redirectUri.hostname === "localhost" || redirectUri.hostname === "127.0.0.1")
  if (
    (redirectUri.protocol !== "https:" && !localHttp) ||
    redirectUri.pathname !== "/api/integrations/google-drive/callback" ||
    redirectUri.search ||
    redirectUri.hash
  ) throw new GoogleDriveError("not_configured", 503)

  return {
    clientId: env.GOOGLE_DRIVE_CLIENT_ID,
    clientSecret: env.GOOGLE_DRIVE_CLIENT_SECRET,
    redirectUri: redirectUri.toString(),
  }
}

export function getGoogleDrivePickerConfig() {
  if (
    env.GOOGLE_DRIVE_ENABLED !== "true" ||
    !env.GOOGLE_DRIVE_PICKER_API_KEY ||
    !env.GOOGLE_DRIVE_PICKER_APP_ID ||
    !/^\d{6,20}$/.test(env.GOOGLE_DRIVE_PICKER_APP_ID)
  ) throw new GoogleDriveError("not_configured", 503)

  return {
    developerKey: env.GOOGLE_DRIVE_PICKER_API_KEY,
    appId: env.GOOGLE_DRIVE_PICKER_APP_ID,
  }
}
