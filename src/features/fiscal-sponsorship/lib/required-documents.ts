import type {
  FiscalSponsorshipDocumentKey,
  FiscalSponsorshipLegalEntityType,
} from "../types"

export type FiscalSponsorshipRequiredDocumentRequirement = {
  key: FiscalSponsorshipDocumentKey
  label: string
  description: string
  legalEntityTypes?: FiscalSponsorshipLegalEntityType[]
  stage: "application" | "post_signature" | "as_requested"
}

export const FISCAL_SPONSORSHIP_REQUIRED_DOCUMENTS = [
  {
    key: "tax_id_confirmation",
    label: "Tax ID confirmation",
    description:
      "IRS/EIN support or equivalent U.S. tax identity confirmation for the sponsored project.",
    stage: "application",
  },
  {
    key: "governing_documents",
    label: "Governing documents",
    description:
      "Bylaws, operating agreement, or other documents that show who controls the project entity.",
    legalEntityTypes: [
      "informal_group_with_ein",
      "llc",
      "corporation",
      "partnership",
      "other",
    ],
    stage: "application",
  },
  {
    key: "formation_or_good_standing",
    label: "Formation or good standing",
    description:
      "Formation filings or good-standing support when Coach House requests entity verification.",
    legalEntityTypes: ["llc", "corporation", "partnership", "other"],
    stage: "application",
  },
  {
    key: "budget_support",
    label: "Budget support",
    description:
      "Budget, expense categories, vendor estimates, or other support for requested project costs.",
    stage: "application",
  },
  {
    key: "fundraising_materials",
    label: "Fundraising materials",
    description:
      "Public fundraising copy, donor materials, or grant language that mentions Coach House.",
    stage: "application",
  },
  {
    key: "insurance",
    label: "Insurance",
    description:
      "Insurance certificates or risk documentation when the project activity requires it.",
    stage: "as_requested",
  },
  {
    key: "grant_request_support",
    label: "Grant request support",
    description:
      "Invoices, payment details, intended use, timeframe, and certification support before funds move.",
    stage: "post_signature",
  },
  {
    key: "grantee_report",
    label: "Grantee report",
    description:
      "Monthly, quarterly, annual, or final activity and expense reporting requested by Coach House.",
    stage: "post_signature",
  },
  {
    key: "closeout_report",
    label: "Closeout report",
    description:
      "Final report, remaining-funds explanation, and closeout documentation if sponsorship ends.",
    stage: "post_signature",
  },
  {
    key: "additional_info",
    label: "Additional information",
    description:
      "Clarifying documents requested by Coach House during application or grant-request review.",
    stage: "as_requested",
  },
] satisfies FiscalSponsorshipRequiredDocumentRequirement[]

export function filterFiscalSponsorshipRequiredDocuments({
  connectedKeys,
  legalEntityType,
  showPostSignature,
}: {
  connectedKeys?: Set<FiscalSponsorshipDocumentKey>
  legalEntityType?: FiscalSponsorshipLegalEntityType | null
  showPostSignature: boolean
}) {
  return FISCAL_SPONSORSHIP_REQUIRED_DOCUMENTS.filter((requirement) => {
    const alreadyConnected = connectedKeys?.has(requirement.key) ?? false

    if (requirement.stage === "post_signature") {
      return showPostSignature || alreadyConnected
    }

    if (requirement.stage === "as_requested") {
      return alreadyConnected
    }

    if (!requirement.legalEntityTypes) return true
    if (!legalEntityType) return false

    const legalEntityTypes: readonly FiscalSponsorshipLegalEntityType[] =
      requirement.legalEntityTypes

    return legalEntityTypes.includes(legalEntityType) || alreadyConnected
  })
}

export function formatFiscalSponsorshipDocumentKey(
  key: FiscalSponsorshipDocumentKey
) {
  return (
    FISCAL_SPONSORSHIP_REQUIRED_DOCUMENTS.find(
      (requirement) => requirement.key === key
    )?.label ?? "Fiscal sponsorship document"
  )
}
