export type LegalDocumentSection = {
  heading: string
  body: string
}

export type LegalDocument = {
  title: string
  description: string
  version: string
  sha256: string
  sections: LegalDocumentSection[]
}

export type SignupLegalConsent = {
  version: string
  termsSha256: string
  privacySha256: string
  acceptedAt: string
}
