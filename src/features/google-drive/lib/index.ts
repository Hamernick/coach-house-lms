const GOOGLE_DRIVE_FILE_ID_PATTERN = /^[A-Za-z0-9_-]{10,200}$/
const MAX_SELECTED_FILES = 20
const OAUTH_STATE_PATTERN = /^[A-Za-z0-9_-]{43}$/
const MAX_AUTHORIZATION_CODE_LENGTH = 4096
const GOOGLE_DRIVE_RETURN_PATHS = new Set([
  "/my-organization/documents",
  "/organization/documents",
  "/workspace/documents",
  "/workspace?drawer=tools",
])

export function normalizeGoogleDriveFileIds(value: unknown): string[] | null {
  if (
    !Array.isArray(value) ||
    value.length < 1 ||
    value.length > MAX_SELECTED_FILES
  )
    return null
  const ids = [...new Set(value)]
  if (
    ids.length !== value.length ||
    ids.some(
      (id) => typeof id !== "string" || !GOOGLE_DRIVE_FILE_ID_PATTERN.test(id)
    )
  )
    return null
  return ids as string[]
}

export function normalizeGoogleDriveWebViewLink(value: unknown): string | null {
  if (typeof value !== "string") return null
  try {
    const url = new URL(value)
    const allowedHost =
      url.hostname === "google.com" || url.hostname.endsWith(".google.com")
    return url.protocol === "https:" && allowedHost ? url.toString() : null
  } catch {
    return null
  }
}

export function normalizeGoogleDriveReturnPath(value: unknown) {
  return typeof value === "string" && GOOGLE_DRIVE_RETURN_PATHS.has(value)
    ? value
    : "/organization/documents"
}

export function normalizeGoogleDriveOAuthCallbackInput(
  state: unknown,
  code: unknown
) {
  if (
    typeof state !== "string" ||
    typeof code !== "string" ||
    !OAUTH_STATE_PATTERN.test(state) ||
    code.length < 1 ||
    code.length > MAX_AUTHORIZATION_CODE_LENGTH ||
    /[\u0000-\u001f\u007f]/.test(code)
  )
    return null
  return { state, code }
}
