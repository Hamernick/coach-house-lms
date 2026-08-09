export const FISCAL_SPONSORSHIP_W9_TEMPLATE = {
  key: "irs-form-w-9-2024-03",
  path: "/fiscal-sponsorship/form-w-9.pdf",
  revision: "March 2024",
  sha256: "2d420cbb4123dcf1fb82595b2359cfbb5d81f00b9df9d359fcc7af361d093f53",
  version: 1,
} as const

export const FISCAL_SPONSORSHIP_W9_CONSENT_VERSION = "2026-07-27"
export const FISCAL_SPONSORSHIP_W9_CONSENT_TEXT =
  "I consent to use electronic records and signatures for this IRS Form W-9 and confirm that I am authorized to sign for the named U.S. person."

const W9_CERTIFICATION_ITEMS = [
  "The number shown on this form is my correct taxpayer identification number (or I am waiting for a number to be issued to me); and",
  "I am not subject to backup withholding because: (a) I am exempt from backup withholding, or (b) I have not been notified by the Internal Revenue Service (IRS) that I am subject to backup withholding as a result of a failure to report all interest or dividends, or (c) the IRS has notified me that I am no longer subject to backup withholding; and",
  "I am a U.S. citizen or other U.S. person (defined on Form W-9); and",
  "The FATCA code(s) entered on this form (if any) indicating that I am exempt from FATCA reporting is correct.",
] as const

export function getFiscalSponsorshipW9CertificationText(
  subjectToBackupWithholding: boolean
) {
  return [
    "Under penalties of perjury, I certify that:",
    `1. ${W9_CERTIFICATION_ITEMS[0]}`,
    subjectToBackupWithholding
      ? `2. [Crossed out because I am subject to backup withholding.] ${W9_CERTIFICATION_ITEMS[1]}`
      : `2. ${W9_CERTIFICATION_ITEMS[1]}`,
    `3. ${W9_CERTIFICATION_ITEMS[2]}`,
    `4. ${W9_CERTIFICATION_ITEMS[3]}`,
  ].join("\n")
}

export type FiscalSponsorshipW9TaxClassification =
  | "individual"
  | "c_corporation"
  | "s_corporation"
  | "partnership"
  | "trust_estate"
  | "llc"
  | "other"

export type FiscalSponsorshipW9LlcClassification = "C" | "S" | "P"
export type FiscalSponsorshipW9TinType = "ssn" | "ein"

export type FiscalSponsorshipW9Fields = {
  accountNumber: string
  address: string
  businessName: string
  city: string
  exemptPayeeCode: string
  fatcaExemptionCode: string
  foreignPartnersOwnersBeneficiaries: boolean
  llcClassification: FiscalSponsorshipW9LlcClassification | ""
  name: string
  otherClassification: string
  postalCode: string
  state: string
  subjectToBackupWithholding: boolean
  taxClassification: FiscalSponsorshipW9TaxClassification | ""
  tin: string
  tinType: FiscalSponsorshipW9TinType
}

export type FiscalSponsorshipW9RedactedFields = Omit<
  FiscalSponsorshipW9Fields,
  "tin"
> & {
  tinLast4: string
}

export const FISCAL_SPONSORSHIP_W9_CLASSIFICATION_OPTIONS = [
  { label: "Individual or sole proprietor", value: "individual" },
  { label: "C corporation", value: "c_corporation" },
  { label: "S corporation", value: "s_corporation" },
  { label: "Partnership", value: "partnership" },
  { label: "Trust or estate", value: "trust_estate" },
  { label: "Limited liability company", value: "llc" },
  { label: "Other", value: "other" },
] satisfies Array<{
  label: string
  value: FiscalSponsorshipW9TaxClassification
}>

const TAX_CLASSIFICATIONS = new Set<FiscalSponsorshipW9TaxClassification>(
  FISCAL_SPONSORSHIP_W9_CLASSIFICATION_OPTIONS.map((option) => option.value)
)
const LLC_CLASSIFICATIONS = new Set<FiscalSponsorshipW9LlcClassification>([
  "C",
  "S",
  "P",
])

function trim(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : ""
}

export function normalizeFiscalSponsorshipW9Fields(
  input: Partial<FiscalSponsorshipW9Fields>
): FiscalSponsorshipW9Fields {
  const taxClassification = TAX_CLASSIFICATIONS.has(
    input.taxClassification as FiscalSponsorshipW9TaxClassification
  )
    ? (input.taxClassification as FiscalSponsorshipW9TaxClassification)
    : ""
  const llcClassification = LLC_CLASSIFICATIONS.has(
    input.llcClassification as FiscalSponsorshipW9LlcClassification
  )
    ? (input.llcClassification as FiscalSponsorshipW9LlcClassification)
    : ""

  return {
    accountNumber: trim(input.accountNumber, 80),
    address: trim(input.address, 120),
    businessName: trim(input.businessName, 120),
    city: trim(input.city, 80),
    exemptPayeeCode: trim(input.exemptPayeeCode, 12),
    fatcaExemptionCode: trim(input.fatcaExemptionCode, 12),
    foreignPartnersOwnersBeneficiaries:
      input.foreignPartnersOwnersBeneficiaries === true,
    llcClassification,
    name: trim(input.name, 120),
    otherClassification: trim(input.otherClassification, 80),
    postalCode: trim(input.postalCode, 20),
    state: trim(input.state, 40),
    subjectToBackupWithholding: input.subjectToBackupWithholding === true,
    taxClassification,
    tin: trim(input.tin, 24),
    tinType: input.tinType === "ssn" ? "ssn" : "ein",
  }
}

export function getFiscalSponsorshipW9TinDigits(value: string) {
  return value.replace(/\D/g, "")
}

export function validateFiscalSponsorshipW9Fields(
  fields: FiscalSponsorshipW9Fields
) {
  const errors: Partial<Record<keyof FiscalSponsorshipW9Fields, string>> = {}
  if (fields.name.length < 2) {
    errors.name = "Enter the name shown on the tax return."
  }
  if (!fields.taxClassification) {
    errors.taxClassification = "Choose one federal tax classification."
  }
  if (
    fields.taxClassification === "llc" &&
    !LLC_CLASSIFICATIONS.has(
      fields.llcClassification as FiscalSponsorshipW9LlcClassification
    )
  ) {
    errors.llcClassification = "Choose the LLC tax classification."
  }
  if (
    fields.taxClassification === "other" &&
    fields.otherClassification.length < 2
  ) {
    errors.otherClassification = "Describe the federal tax classification."
  }
  if (fields.address.length < 3) {
    errors.address = "Enter the mailing address."
  }
  if (fields.city.length < 2) errors.city = "Enter the city."
  if (fields.state.length < 2) errors.state = "Enter the state."
  if (fields.postalCode.length < 5) {
    errors.postalCode = "Enter a valid ZIP code."
  }
  if (getFiscalSponsorshipW9TinDigits(fields.tin).length !== 9) {
    errors.tin = "Enter a nine-digit SSN, ITIN, or EIN."
  }
  return errors
}

export function redactFiscalSponsorshipW9Fields(
  fields: FiscalSponsorshipW9Fields
): FiscalSponsorshipW9RedactedFields {
  const { tin, ...safeFields } = fields
  return {
    ...safeFields,
    tinLast4: getFiscalSponsorshipW9TinDigits(tin).slice(-4),
  }
}
