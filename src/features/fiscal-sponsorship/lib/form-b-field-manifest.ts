export const FISCAL_SPONSORSHIP_FORM_B_TEMPLATE = {
  key: "form_b_fiscal_sponsorship_agreement",
  version: 2,
  href: "/fiscal-sponsorship/form-b-fiscal-sponsorship-agreement.pdf",
  sha256: "21245b9560f49a42e981e1c3335e2186f70978e8b34c3e09f4112b199ac77c42",
} as const

export type FiscalSponsorshipFormBFields = {
  projectId: string
  applicantFullName: string
  applicationDate: string
  mailingStreetAddress: string
  mailingStreetAddress2: string
  mailingCity: string
  mailingState: string
  mailingPostalCode: string
  phoneNumber: string
  primaryEmail: string
  legalEntityName: string
  legalEntityType: string
  projectName: string
}

export type FiscalSponsorshipFormBFieldKey = keyof FiscalSponsorshipFormBFields

export const FISCAL_SPONSORSHIP_FORM_B_REQUIRED_FIELDS = [
  "projectId",
  "applicantFullName",
  "applicationDate",
  "mailingStreetAddress",
  "mailingCity",
  "mailingState",
  "mailingPostalCode",
  "phoneNumber",
  "primaryEmail",
  "legalEntityName",
  "legalEntityType",
  "projectName",
] as const satisfies readonly FiscalSponsorshipFormBFieldKey[]

export const FISCAL_SPONSORSHIP_FORM_B_FIELDS = [
  { key: "projectId", label: "Project ID", maxLength: 42 },
  { key: "applicantFullName", label: "Applicant Full Name", maxLength: 90 },
  {
    key: "applicationDate",
    label: "Application Date",
    maxLength: 10,
    type: "date",
  },
  {
    key: "mailingStreetAddress",
    label: "Mailing Street Address",
    maxLength: 100,
  },
  {
    key: "mailingStreetAddress2",
    label: "Apartment, Suite, or Unit",
    maxLength: 60,
    optional: true,
  },
  { key: "mailingCity", label: "City", maxLength: 60 },
  { key: "mailingState", label: "State", maxLength: 32 },
  { key: "mailingPostalCode", label: "Postal Code", maxLength: 16 },
  { key: "phoneNumber", label: "Phone Number", maxLength: 32, type: "tel" },
  {
    key: "primaryEmail",
    label: "Primary Email Address",
    maxLength: 120,
    type: "email",
  },
  { key: "legalEntityName", label: "Legal Entity Name", maxLength: 110 },
  { key: "legalEntityType", label: "Legal Entity Type", maxLength: 72 },
  {
    key: "projectName",
    label: "Project, Program, or Initiative Name",
    maxLength: 110,
  },
] as const satisfies readonly {
  key: FiscalSponsorshipFormBFieldKey
  label: string
  maxLength: number
  optional?: boolean
  type?: "date" | "email" | "tel"
}[]

export const FISCAL_SPONSORSHIP_FORM_B_RECTS = {
  projectId: { page: 0, x: 251.93, top: 158.77, width: 295.92, height: 14 },
  applicantFullName: {
    page: 0,
    x: 251.93,
    top: 187.56,
    width: 295.92,
    height: 14,
  },
  applicationDate: {
    page: 0,
    x: 251.93,
    top: 215.56,
    width: 295.92,
    height: 14,
  },
  mailingAddress: {
    page: 0,
    x: 251.93,
    top: 243.55,
    width: 295.92,
    height: 27.2,
  },
  phoneNumber: {
    page: 0,
    x: 251.93,
    top: 279.54,
    width: 295.92,
    height: 14,
  },
  primaryEmail: {
    page: 0,
    x: 251.93,
    top: 307.54,
    width: 295.92,
    height: 14,
  },
  legalEntityName: {
    page: 0,
    x: 251.93,
    top: 335.53,
    width: 295.92,
    height: 14,
  },
  legalEntityType: {
    page: 0,
    x: 251.93,
    top: 392.72,
    width: 295.92,
    height: 14,
  },
  projectName: {
    page: 0,
    x: 251.93,
    top: 424.72,
    width: 295.92,
    height: 14,
  },
  granteeLegalEntityName: {
    page: 3,
    x: 112,
    top: 543,
    width: 172,
    height: 14,
  },
  granteeSignature: {
    page: 3,
    x: 122,
    top: 568,
    width: 162,
    height: 22,
  },
  granteePrintedName: {
    page: 3,
    x: 96,
    top: 608,
    width: 188,
    height: 17,
  },
  granteeTitle: {
    page: 3,
    x: 62,
    top: 643,
    width: 222,
    height: 17,
  },
  granteeSignedDate: {
    page: 3,
    x: 62,
    top: 678,
    width: 222,
    height: 17,
  },
  coachHouseSignature: {
    page: 3,
    x: 391,
    top: 568,
    width: 162,
    height: 22,
  },
  coachHousePrintedName: {
    page: 3,
    x: 365,
    top: 608,
    width: 188,
    height: 17,
  },
  coachHouseTitle: {
    page: 3,
    x: 331,
    top: 643,
    width: 222,
    height: 17,
  },
  coachHouseSignedDate: {
    page: 3,
    x: 331,
    top: 678,
    width: 222,
    height: 17,
  },
} as const

export function normalizeFiscalSponsorshipFormBFields(
  value: Partial<FiscalSponsorshipFormBFields>
): FiscalSponsorshipFormBFields {
  return Object.fromEntries(
    FISCAL_SPONSORSHIP_FORM_B_FIELDS.map(({ key }) => [
      key,
      typeof value[key] === "string" ? value[key].trim() : "",
    ])
  ) as FiscalSponsorshipFormBFields
}

export function validateFiscalSponsorshipFormBFields(
  value: FiscalSponsorshipFormBFields
) {
  const errors: Partial<Record<FiscalSponsorshipFormBFieldKey, string>> = {}

  for (const field of FISCAL_SPONSORSHIP_FORM_B_FIELDS) {
    const fieldValue = value[field.key].trim()
    const optional = "optional" in field && field.optional
    if (!optional && !fieldValue)
      errors[field.key] = `${field.label} is required.`
    if (fieldValue.length > field.maxLength) {
      errors[field.key] =
        `${field.label} must be ${field.maxLength} characters or fewer.`
    }
  }

  if (value.primaryEmail && !/^\S+@\S+\.\S+$/.test(value.primaryEmail)) {
    errors.primaryEmail = "Enter a valid email address."
  }

  if (
    value.applicationDate &&
    !/^\d{4}-\d{2}-\d{2}$/.test(value.applicationDate)
  ) {
    errors.applicationDate = "Enter a valid date."
  }

  return errors
}

export function formatFiscalSponsorshipLegalEntityType(value: string | null) {
  const labels: Record<string, string> = {
    corporation: "Corporation",
    individual: "Individual",
    informal_group_with_ein: "Informal Group With EIN",
    llc: "Limited Liability Company",
    partnership: "Partnership",
    other: "Other",
  }
  return value ? (labels[value] ?? value) : ""
}
