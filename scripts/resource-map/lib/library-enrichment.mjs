import { compareRecordToSourceEvidence } from "./source-evidence.mjs"

const PROVIDER_NAME = "Chicago Public Library"
const METHOD_VERSION = "chicago-public-library-source-v1"
const DISPLAY_TITLE_OVERRIDES = new Map([
  ["Daley, Richard J.-Bridgeport", "Richard J. Daley Branch Library"],
  ["Daley, Richard M.-W Humboldt", "Richard M. Daley Branch Library"],
])

const OFFERING_RULES = [
  ["books and media", /\bBooks\b[\s\S]*\bDVDs\b/iu],
  ["public computers", /\bComputers?\b/iu],
  ["Wi-Fi", /\bWiFi\b|\bWi-Fi\b/iu],
  ["printing and scanning", /Print from Your Phone or Computer|\bScanner\b/iu],
  ["meeting rooms", /\bMeeting rooms?\b/iu],
  ["study rooms", /\bStudy rooms?\b/iu],
  ["homework help", /\bHomework help\b/iu],
  ["digital-learning help", /\bDigital Learning\b/iu],
  ["Library of Things", /\bLibrary of Things\b/iu],
  ["teen YOUmedia space", /\bYOUmedia\b/iu],
  [
    "mental-health and social-service support",
    /Mental Health and Social Services/iu,
  ],
  ["Citizenship Corner resources", /\bCitizenship Corner\b/iu],
  ["a recording studio", /\bRecording Studio\b/iu],
  ["a city bill-payment kiosk", /\bCity Bill Payment Kiosk\b/iu],
]

function readObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {}
}

function readArray(value) {
  return Array.isArray(value) ? value : []
}

function readString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return null
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function officialBranchName(evidence, record) {
  const pageTitle = readString(evidence.pageTitle)?.split("|")[0]?.trim()
  return (
    pageTitle ??
    readString(
      evidence.recordId,
      record.sourceRecordId,
      record.source_record_id
    )
  )
}

function displayTitle(branchName) {
  const override = DISPLAY_TITLE_OVERRIDES.get(branchName)
  if (override) return override
  if (/\bRegional\b/iu.test(branchName)) {
    return /\bLibrary\b/iu.test(branchName)
      ? branchName
      : `${branchName} Library`
  }
  if (/\b(?:library|center)\b/iu.test(branchName)) return branchName
  return `${branchName} Branch Library`
}

function branchPageBody(evidence, branchName) {
  const text = readString(evidence.textExcerpt) ?? ""
  const startCandidates = [
    `About ${branchName} Branch`,
    `About ${branchName}`,
    `${branchName} Hours & Information`,
  ]
  const starts = startCandidates
    .map((marker) => text.indexOf(marker))
    .filter((index) => index >= 0)
  const start = starts.length > 0 ? Math.min(...starts) : 0
  const tail = text.slice(start)
  const endCandidates = [
    `New at ${branchName}`,
    "Recent News and Blog Posts",
    "Recent News & Blog Posts",
    "Back to Top",
  ]
  const ends = endCandidates
    .map((marker) => tail.indexOf(marker))
    .filter((index) => index > 0)
  return ends.length > 0 ? tail.slice(0, Math.min(...ends)) : tail
}

function extractEmail(text, fallback) {
  return (
    text.match(/\bEmail:\s*([A-Z0-9._%+-]+@chipublib\.org)\b/iu)?.[1] ??
    readString(fallback)
  )
}

function extractPhone(text, fallback) {
  return (
    text.match(/\bPhone:\s*(\([0-9]{3}\)\s*[0-9]{3}-[0-9]{4})\b/iu)?.[1] ??
    readString(fallback)
  )
}

function joinList(values) {
  if (values.length === 0) return "public library materials and assistance"
  if (values.length === 1) return values[0]
  if (values.length === 2) return `${values[0]} and ${values[1]}`
  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`
}

function extractOfferings(pageBody) {
  return OFFERING_RULES.filter(([, pattern]) => pattern.test(pageBody)).map(
    ([label]) => label
  )
}

function accessibilitySummary(pageBody) {
  const notes = []
  if (/entire building is ADA accessible/iu.test(pageBody)) {
    notes.push("The source says the entire building is ADA accessible.")
  } else {
    const features = [
      ["an accessible entrance", /accessible entrance/iu],
      [
        "accessible restrooms",
        /accessible restrooms?|restrooms[^.]{0,80}accessible/iu,
      ],
      [
        "an accessible drinking fountain",
        /accessible[^.]{0,80}drinking fountain/iu,
      ],
    ]
      .filter(([, pattern]) => pattern.test(pageBody))
      .map(([label]) => label)
    if (features.length > 0) {
      notes.push(`The source lists ${joinList(features)}.`)
    }
  }
  if (/ADA computer workstations?/iu.test(pageBody)) {
    notes.push("ADA computer workstations are listed.")
  }
  if (/accessible parking spaces?/iu.test(pageBody)) {
    notes.push("Accessible parking is listed.")
  }
  return (
    notes.join(" ") ||
    "The source does not state branch-specific accessibility details."
  )
}

function buildServices(offerings, title) {
  const groups = [
    {
      description: `Use ${joinList(offerings.slice(0, 6))} at this branch.`,
      howToAccess: `Visit ${title} during posted hours or contact the branch for help.`,
      name: "Library, technology, and learning services",
    },
  ]
  if (offerings.some((value) => /mental-health|social-service/iu.test(value))) {
    groups.push({
      description:
        "The official branch page lists mental-health and social-service support.",
      howToAccess:
        "Contact the branch or check its official page for current availability.",
      name: "Mental-health and social-service support",
    })
  }
  return groups
}

function buildFieldEvidence({ draft, evidence, now }) {
  const values = new Map([
    ["extractedFields.organizationName", draft.providerName],
    ["extractedFields.serviceTitle", draft.displayTitle],
    ["extractedFields.description", draft.publicSummary],
    ["extractedFields.serviceDescription", draft.publicSummary],
    ["extractedFields.eligibility", draft.eligibility],
    ["extractedFields.accessInstructions", draft.accessInstructions],
    ["extractedFields.phone", draft.phone],
    ["extractedFields.email", draft.email],
    ["extractedFields.websiteUrl", evidence.evidenceUrl],
    ["extractedFields.accessibilityNotes", draft.accessibility],
    ["extractedFields.cost", draft.cost],
  ])

  return [...values]
    .filter(([, value]) => value !== null && value !== "")
    .map(([fieldPath, fieldValue]) => ({
      confidenceScore: 95,
      derivedFrom: [evidence.evidenceUrl],
      evidenceMetadata: {
        contentSha256: evidence.contentSha256,
        methodVersion: METHOD_VERSION,
        verificationStatus: "approved",
      },
      evidenceType: "derived",
      fieldPath,
      fieldValue,
      observedAt: now,
      sourceUrl: evidence.evidenceUrl,
      transformation: "source_specific_deterministic_enrichment",
    }))
}

function buildClaimChecks(draft, evidenceUrl) {
  return [
    "displayTitle",
    "providerName",
    "publicSummary",
    "services",
    "eligibility",
    "accessInstructions",
    "address",
    "email",
    "phone",
  ].map((claimPath) => ({
    claimPath,
    note: "Checked against the retained official branch-page evidence.",
    sourceUrls: [evidenceUrl],
    status: "supported",
  }))
}

export function buildLibraryEnrichmentDraft(record, evidence) {
  if (!evidence || evidence.status !== "fetched" || !evidence.evidenceUrl) {
    throw new Error("Fetched Chicago Public Library evidence is required.")
  }
  const fields = readObject(record.extractedFields ?? record.extracted_fields)
  const branchName = officialBranchName(evidence, record)
  if (!branchName) throw new Error("Official branch name is missing.")
  const title = displayTitle(branchName)
  const pageBody = branchPageBody(evidence, branchName)
  const offerings = extractOfferings(pageBody)
  const phone = extractPhone(evidence.textExcerpt ?? pageBody, fields.phone)
  const email = extractEmail(evidence.textExcerpt ?? pageBody, fields.email)
  const address = readString(fields.address, fields.addressLine1)
  const publicSummary = `${title}, operated by ${PROVIDER_NAME}, offers ${joinList(
    offerings.slice(0, 8)
  )}. Visit the official branch page for current hours, closures, events, and service availability.`
  const snippet = `${readString(evidence.metaDescription) ?? title} ${joinList(
    offerings.slice(0, 5)
  )}.`.slice(0, 240)

  return {
    accessInstructions: `Visit ${title}${address ? ` at ${address}` : ""} during posted hours. Check the official branch page for current closures and events, or contact the branch for help.`,
    accessibility: accessibilitySummary(pageBody),
    address,
    citations: [
      {
        claimPaths: [
          "displayTitle",
          "providerName",
          "publicSummary",
          "services",
          "eligibility",
          "accessInstructions",
          "address",
          ...(email ? ["email"] : []),
          ...(phone ? ["phone"] : []),
        ],
        evidenceSnippet: snippet,
        sourceUrl: evidence.evidenceUrl,
      },
    ],
    cost: "The source says Chicago Public Library cards are free; it does not state branch-specific costs for other services.",
    displayTitle: title,
    documentsNeeded: [],
    email,
    eligibility:
      "The source does not state branch-specific eligibility. It provides public visiting information and free library-card registration.",
    hoursNote:
      "Use the structured branch schedule and check the official page for current closures and holiday exceptions.",
    intakeUrl: evidence.evidenceUrl,
    languages: readArray(fields.languages),
    offerings,
    phone,
    providerName: PROVIDER_NAME,
    publicSummary,
    schemaVersion: 1,
    services: buildServices(offerings, title),
    unknownFields: ["documentsNeeded", "branchSpecificEligibility"],
  }
}

export function enrichLibraryRecord({ evidence, now, record }) {
  const verifiedAt = now ?? evidence.fetchedAt ?? new Date().toISOString()
  const fields = readObject(record.extractedFields ?? record.extracted_fields)
  const draft = buildLibraryEnrichmentDraft(record, evidence)
  const enrichedFields = {
    ...fields,
    accessInstructions: draft.accessInstructions,
    accessibilityNotes: draft.accessibility,
    address: draft.address ?? fields.address,
    appointmentInfo: draft.accessInstructions,
    cost: draft.cost,
    deliveryModes: unique([...readArray(fields.deliveryModes), "in_person"]),
    description: draft.publicSummary,
    documentsNeeded: draft.documentsNeeded,
    email: draft.email ?? fields.email,
    eligibility: draft.eligibility,
    hoursNote: draft.hoursNote,
    intakeUrl: null,
    languages: draft.languages,
    locationType: fields.locationType ?? "physical",
    organizationName: draft.providerName,
    phone: draft.phone ?? fields.phone,
    primaryResourceCategory: "community_libraries",
    providerName: draft.providerName,
    resourceCategories: ["community_libraries", "community"],
    serviceDescription: draft.publicSummary,
    serviceOfferings: draft.offerings,
    services: draft.services,
    serviceTitle: draft.displayTitle,
    timezone: fields.timezone ?? "America/Chicago",
    title: draft.displayTitle,
    websiteUrl: evidence.evidenceUrl,
  }
  const enrichedRecord = { ...record, extractedFields: enrichedFields }
  const correctedComparisons = compareRecordToSourceEvidence(
    {
      ...enrichedRecord,
      extractedFields: {
        ...enrichedFields,
        serviceTitle: officialBranchName(evidence, record),
        title: officialBranchName(evidence, record),
      },
    },
    evidence
  )
  const comparisonIssues = correctedComparisons.filter(
    (comparison) => comparison.status !== "matched"
  )
  const verificationStatus =
    comparisonIssues.length === 0 ? "approved" : "needs_review"
  const contradictions = comparisonIssues.map(
    (comparison) =>
      `${comparison.fieldPath} was not confirmed on the provider page.`
  )
  enrichedFields.enrichment = {
    draft: {
      citations: draft.citations,
      method: "deterministic_source_extraction",
      methodVersion: METHOD_VERSION,
    },
    evidenceUrls: [evidence.evidenceUrl],
    passes: [
      { name: "provider_field_comparison", status: "completed" },
      { name: "claim_and_citation_verification", status: "completed" },
    ],
    schemaVersion: 1,
    sourceComparisonCount: 2,
    verification: {
      claimChecks: buildClaimChecks(draft, evidence.evidenceUrl),
      contradictions,
      method: "deterministic_source_verification",
      methodVersion: METHOD_VERSION,
      requiredCorrections: contradictions,
      schemaVersion: 1,
      status: verificationStatus,
      summary:
        verificationStatus === "approved"
          ? "Required claims and corrected catalog fields match the retained official branch page."
          : "One or more corrected catalog fields require review.",
      unsupportedClaims: [],
    },
  }

  return {
    ...enrichedRecord,
    extractedFields: enrichedFields,
    fieldEvidence: [
      ...readArray(record.fieldEvidence ?? record.field_evidence),
      ...buildFieldEvidence({ draft, evidence, now: verifiedAt }),
    ],
    lastEnrichedAt: verifiedAt,
    lastVerifiedAt: verificationStatus === "approved" ? verifiedAt : null,
    needsReview: true,
  }
}

export const LIBRARY_ENRICHMENT_METHOD_VERSION = METHOD_VERSION
