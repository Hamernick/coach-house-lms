import type { SignupLegalConsent } from "../types"
import { PRIVACY_DOCUMENT } from "./privacy-document"
import { TERMS_DOCUMENT } from "./terms-document"
import { LEGAL_DOCUMENT_VERSION } from "./version"

export function createSignupLegalConsent(now = new Date()): SignupLegalConsent {
  return {
    version: LEGAL_DOCUMENT_VERSION,
    termsSha256: TERMS_DOCUMENT.sha256,
    privacySha256: PRIVACY_DOCUMENT.sha256,
    acceptedAt: now.toISOString(),
  }
}

export function isCurrentSignupLegalConsent(
  value: unknown
): value is SignupLegalConsent {
  if (!value || typeof value !== "object") return false

  const consent = value as Partial<SignupLegalConsent>
  return (
    consent.version === LEGAL_DOCUMENT_VERSION &&
    consent.termsSha256 === TERMS_DOCUMENT.sha256 &&
    consent.privacySha256 === PRIVACY_DOCUMENT.sha256 &&
    typeof consent.acceptedAt === "string" &&
    Number.isFinite(Date.parse(consent.acceptedAt))
  )
}
