import type { LegalDocument, SignupLegalConsent } from "../types"

export const LEGAL_DOCUMENT_VERSION = "2026-08-11-draft.1"

export const TERMS_DOCUMENT: LegalDocument = {
  title: "Terms of Service",
  description: "The rules for using Coach House.",
  version: LEGAL_DOCUMENT_VERSION,
  sha256: "cf47c9cd8cf77a2c633c4f9bbfc08246e241fa8ea816d5501d87779a4db31342",
  sections: [
    {
      heading: "Using Coach House",
      body: "You must provide accurate account information, protect your sign-in credentials, and use Coach House only for lawful purposes. You are responsible for activity under your account.",
    },
    {
      heading: "Platform guidance",
      body: "Coach House provides educational and organizational tools. It does not provide legal, tax, accounting, investment, or other professional advice. You remain responsible for decisions made for your organization.",
    },
    {
      heading: "Your content",
      body: "You retain ownership of content you submit. You give Coach House permission to host, process, and display that content only as needed to provide the service and the sharing choices you select.",
    },
    {
      heading: "Paid services",
      body: "Prices and billing terms are shown before purchase. Stripe processes payments. You may manage or cancel a subscription through the available billing tools, subject to the terms shown when you purchase.",
    },
    {
      heading: "Availability and enforcement",
      body: "We may change, suspend, or restrict the service to protect users, comply with law, or address misuse. The service is provided as available, to the extent permitted by law.",
    },
    {
      heading: "Changes and contact",
      body: "We may update these terms and will identify the effective version. Material changes will require renewed acceptance when appropriate. Questions may be sent to support@coachhousesolutions.org.",
    },
  ],
}

export const PRIVACY_DOCUMENT: LegalDocument = {
  title: "Privacy Policy",
  description: "How Coach House handles personal information.",
  version: LEGAL_DOCUMENT_VERSION,
  sha256: "8a4f592b9ec4dbb92cd41d27ac5bc55c802596be0400a4f54aab8e7fb061094c",
  sections: [
    {
      heading: "Information we collect",
      body: "We collect account details, organization and profile information, content you submit, service usage and device data, support communications, and payment references from Stripe. Coach House does not store full payment-card numbers.",
    },
    {
      heading: "How we use information",
      body: "We use information to operate and secure the service, provide requested features, support users, improve reliability, communicate about accounts, and meet legal obligations.",
    },
    {
      heading: "How information is shared",
      body: "Information may be shared with organization collaborators you authorize, vendors that operate the service, or authorities when legally required. Coach House does not sell personal information.",
    },
    {
      heading: "Retention and security",
      body: "We retain information while needed to provide the service, satisfy legal obligations, and resolve disputes. We use technical and organizational safeguards, but no system can guarantee absolute security.",
    },
    {
      heading: "Your choices",
      body: "You may review or update account information through the product and request account deletion where available. You may also contact support@coachhousesolutions.org about access, correction, or privacy questions.",
    },
    {
      heading: "Children and changes",
      body: "Coach House is not directed to children under 13. We may update this policy and will identify the effective version. Material changes will be communicated when appropriate.",
    },
  ],
}

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
