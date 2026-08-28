import type {
  GoogleAuthMode,
  GoogleLinkValidationResult,
  GoogleSignupMetadataValue,
  GoogleSignupProvisionResult,
} from "../types"

const MAX_METADATA_KEYS = 20
const MAX_METADATA_STRING_LENGTH = 256

export function sanitizeGoogleSignupMetadata(
  value: Record<string, unknown> | undefined
) {
  if (!value) return {}

  return Object.fromEntries(
    Object.entries(value)
      .slice(0, MAX_METADATA_KEYS)
      .filter(([key]) => /^[a-z][a-z0-9_]{0,63}$/i.test(key))
      .filter(
        ([, item]) =>
          item === null ||
          typeof item === "string" ||
          typeof item === "boolean" ||
          (typeof item === "number" && Number.isFinite(item))
      )
      .map(([key, item]) => [
        key,
        typeof item === "string"
          ? item.slice(0, MAX_METADATA_STRING_LENGTH)
          : item,
      ])
  ) as Record<string, GoogleSignupMetadataValue>
}

export function resolveGoogleAuthErrorMessage({
  mode,
  result,
}: {
  mode: GoogleAuthMode
  result?: GoogleLinkValidationResult | GoogleSignupProvisionResult
}) {
  if (mode === "login") {
    return "Unable to sign in with Google. If this is your first visit, create an account first."
  }

  if (mode === "link") {
    if (result?.ok === false && result.code === "email_mismatch") {
      return "Choose the Google account that matches your Coach House email."
    }

    if (result?.ok === false && result.code === "unauthorized") {
      return "Your session expired. Sign in again before connecting Google."
    }

    if (result?.ok === false && result.code === "invalid") {
      return "Google could not verify this account. Please try again."
    }

    return "Unable to connect Google. Please try again."
  }

  if (result?.ok === false && result.code === "invalid") {
    return "Google could not verify this account. Please try again."
  }

  return "Unable to create your account with Google. Please try again."
}
