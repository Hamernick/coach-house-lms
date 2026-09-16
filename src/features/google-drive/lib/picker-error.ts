function pickerErrorMessage(code: unknown) {
  switch (code) {
    case "not_configured":
      return "Google Drive file selection is unavailable in this environment. Reconnecting your account will not fix this setup issue."
    case "unauthorized":
      return "Your Coach House session expired. Sign in again to choose a Google Drive file."
    case "forbidden":
      return "You do not have permission to add Google Drive files to this organization."
    case "google_revoked":
    case "missing_refresh_token":
      return "Google Drive access expired or is disconnected. Reconnect in Workspace Tools, then try again."
    case "scope_denied":
      return "Allow selected-file access in Workspace Tools to choose a Google Drive file."
    case "rate_limited":
      return "Google Drive is busy. Try again shortly."
    default:
      return "Google Drive file selection could not load. Try again."
  }
}

export class GoogleDrivePickerError extends Error {
  readonly requiresReconnect: boolean

  constructor(code?: unknown) {
    super(pickerErrorMessage(code))
    this.name = "GoogleDrivePickerError"
    this.requiresReconnect =
      code === "google_revoked" ||
      code === "missing_refresh_token" ||
      code === "scope_denied"
  }
}
