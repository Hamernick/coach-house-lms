export type GoogleAuthMode = "link" | "login" | "signup"

export type GoogleSignupIntentFocus = "build" | "find" | "fund" | "support"

export type GoogleSignupMetadataValue = string | number | boolean | null

export type GoogleSignupInput = {
  credential: string
  nonce: string
  acceptedLegal: true
  accountIntent: string
  intentFocus: GoogleSignupIntentFocus
  signUpMetadata?: Record<string, GoogleSignupMetadataValue>
}

export type GoogleSignupProvisionResult =
  | { ok: true }
  | { ok: false; code: "invalid" | "unavailable" }

export type GoogleLinkValidationResult =
  | { ok: true }
  | {
      ok: false
      code: "email_mismatch" | "invalid" | "unauthorized" | "unavailable"
    }
