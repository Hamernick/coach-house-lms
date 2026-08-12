export type LegalDocumentSection = {
  id: string
  heading: string
  body: readonly string[]
  items?: readonly string[]
}

export type LegalDocument = {
  slug: "terms" | "privacy"
  title: string
  description: string
  effectiveDate: string
  version: string
  sha256: string
  sections: readonly LegalDocumentSection[]
}

export type SignupLegalConsent = {
  version: string
  termsSha256: string
  privacySha256: string
  acceptedAt: string
}
