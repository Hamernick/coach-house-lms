import { createReadStream } from "node:fs"
import { createInterface } from "node:readline"

import { readString, sha256 } from "./data-engine/shared.mjs"
import { isSpecificSocialAccountUrl } from "./provider-page-signals.mjs"

export const IRS_EO_DISCOVERY_SCHEMA_VERSION = 1
export const IRS_EO_RESEARCH_STATUSES = [
  "website_matched",
  "evidence_fetched",
  "deterministically_complete",
  "needs_ai",
  "verified",
  "held",
  "ready_for_review",
]

const NTEE_CATEGORY_HINTS = {
  B: { category: "education", score: 55 },
  C: { category: "environment", score: 55 },
  D: { category: "animals", score: 55 },
  E: { category: "health", score: 90 },
  F: { category: "health", score: 90 },
  G: { category: "health", score: 85 },
  I: { category: "safety", score: 70 },
  J: { category: "employment", score: 75 },
  K: { category: "food", score: 95 },
  L: { category: "housing", score: 95 },
  M: { category: "emergency", score: 60 },
  N: { category: "community", score: 50 },
  O: { category: "family", score: 80 },
  P: { category: "family", score: 80 },
  Q: { category: "international", score: 50 },
  R: { category: "legal", score: 70 },
  S: { category: "community", score: 55 },
  U: { category: "education", score: 50 },
  W: { category: "community", score: 55 },
}

const NTEE_DETAIL_HINTS = [
  {
    prefix: "P51",
    categories: ["finance_financial_coaching", "finance"],
    score: 90,
  },
  {
    prefix: "P52",
    categories: ["community_transportation"],
    score: 90,
  },
  {
    prefix: "P60",
    categories: ["finance_emergency_assistance", "emergency"],
    score: 90,
  },
  { prefix: "K30", categories: ["food_food_pantries"], score: 95 },
  { prefix: "K35", categories: ["food_community_meals"], score: 95 },
  { prefix: "L41", categories: ["housing_emergency_shelter"], score: 95 },
  { prefix: "L80", categories: ["housing_homeless_services"], score: 95 },
  { prefix: "R20", categories: ["legal_civil_rights"], score: 75 },
]

const RESOURCE_NAME_HINTS = [
  {
    id: "digital_access",
    pattern:
      /\b(?:BROADBAND ACCESS|COMPUTER LITERACY|DEVICE ACCESS|DIGITAL ACCESS|DIGITAL EQUITY|DIGITAL INCLUSION|DIGITAL LITERACY|INTERNET ACCESS)\b/iu,
    categories: [
      "community_internet_access",
      "community_device_access",
      "education_digital_literacy",
    ],
    score: 90,
  },
  {
    id: "benefits_access",
    pattern: /\b(?:BENEFITS ACCESS|BENEFITS ENROLLMENT)\b/iu,
    categories: ["finance_benefits_enrollment", "finance"],
    score: 90,
  },
  {
    id: "tax_preparation",
    pattern: /\b(?:FREE TAX PREPARATION|VOLUNTEER INCOME TAX ASSISTANCE)\b/iu,
    categories: ["finance_tax_preparation", "finance"],
    score: 90,
  },
]
const RESOURCE_NAME_HINT_GATE =
  /BROADBAND|COMPUTER|DEVICE|DIGITAL|INTERNET|BENEFIT|TAX/i

function normalizeText(value) {
  return readString(value)?.replace(/\s+/gu, " ") ?? null
}

function findResourceNameHints(value) {
  const name = String(value ?? "")
  if (!RESOURCE_NAME_HINT_GATE.test(name)) return []
  const upperName = name.toUpperCase()
  const candidates = []

  if (
    ["BROADBAND", "COMPUTER", "DEVICE", "DIGITAL", "INTERNET"].some((term) =>
      upperName.includes(term)
    )
  ) {
    candidates.push(RESOURCE_NAME_HINTS[0])
  }
  if (upperName.includes("BENEFIT")) candidates.push(RESOURCE_NAME_HINTS[1])
  if (upperName.includes("TAX")) candidates.push(RESOURCE_NAME_HINTS[2])

  return candidates.filter(({ pattern }) => pattern.test(name))
}

export function parseDelimitedRow(line, delimiter = ",") {
  const values = []
  let current = ""
  let quoted = false

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"'
        index += 1
      } else {
        quoted = !quoted
      }
      continue
    }
    if (character === delimiter && !quoted) {
      values.push(current.trim())
      current = ""
      continue
    }
    current += character
  }

  values.push(current.trim())
  return values
}

export async function* readIrsEoCsvRows(filePath) {
  const lines = createInterface({
    input: createReadStream(filePath, { encoding: "utf8" }),
    crlfDelay: Number.POSITIVE_INFINITY,
  })
  let headers = null

  for await (const rawLine of lines) {
    const line = rawLine.replace(/^\uFEFF/u, "")
    if (!line.trim()) continue
    if (!headers) {
      headers = parseDelimitedRow(line).map((header) => header.toUpperCase())
      continue
    }

    const values = parseDelimitedRow(line)
    yield Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""])
    )
  }
}

export function normalizeIrsEin(value) {
  const digits = String(value ?? "").replace(/\D/gu, "")
  return digits.length === 9 ? digits : null
}

export function isIrsFilingPoBox(value) {
  return /\bP(?:OST(?:AL)?)?\.?\s*O(?:FFICE)?\.?\s*BOX\b|\bPOB\b/iu.test(
    String(value ?? "")
  )
}

export function classifyIrsEoCandidate(row) {
  const nteeCode = normalizeText(row.NTEE_CD)?.toUpperCase() ?? null
  const detail = nteeCode
    ? NTEE_DETAIL_HINTS.find(({ prefix }) => nteeCode.startsWith(prefix))
    : null
  const broad = nteeCode ? NTEE_CATEGORY_HINTS[nteeCode[0]] : null
  const categoryHints = [
    ...new Set([...(detail?.categories ?? []), broad?.category]),
  ].filter(Boolean)
  let score = Math.max(broad?.score ?? 0, detail?.score ?? 0)
  const reasons = []

  if (detail) reasons.push(`ntee_detail:${detail.prefix}`)
  else if (broad) reasons.push(`ntee_major:${nteeCode[0]}`)
  else reasons.push(nteeCode ? "ntee_not_direct_service" : "ntee_missing")

  if (isIrsFilingPoBox(row.STREET)) {
    score = Math.max(0, score - 10)
    reasons.push("filing_address_po_box")
  }

  return {
    categoryHints,
    directServiceScore: score,
    shortlistReasons: reasons,
  }
}

export function applyIrsEoQueueNameHints(candidate) {
  const nameHints = findResourceNameHints(candidate?.organizationName)
  if (nameHints.length === 0) return candidate

  return {
    ...candidate,
    categoryHints: [
      ...new Set([
        ...nameHints.flatMap(({ categories }) => categories),
        ...(candidate.categoryHints ?? []),
      ]),
    ],
    directServiceScore: Math.max(
      candidate.directServiceScore ?? 0,
      ...nameHints.map(({ score }) => score)
    ),
    shortlistReasons: [
      ...new Set([
        ...nameHints.map(({ id }) => `name_hint:${id}`),
        ...(candidate.shortlistReasons ?? []),
      ]),
    ],
  }
}

export function buildIrsEoDiscoveryCandidate(row, { sourceFile }) {
  const ein = normalizeIrsEin(row.EIN)
  if (!ein) return null

  const classification = classifyIrsEoCandidate(row)
  const street = normalizeText(row.STREET)

  return {
    schemaVersion: IRS_EO_DISCOVERY_SCHEMA_VERSION,
    recordType: "irs_eo_discovery_candidate",
    discoveryId: `irs-eo:${ein}`,
    ein,
    organizationName: normalizeText(row.NAME),
    sortName: normalizeText(row.SORT_NAME),
    inCareOf: normalizeText(row.ICO),
    nteeCode: normalizeText(row.NTEE_CD)?.toUpperCase() ?? null,
    activityCode: normalizeText(row.ACTIVITY),
    subsectionCode: normalizeText(row.SUBSECTION),
    rulingDate: normalizeText(row.RULING),
    taxPeriod: normalizeText(row.TAX_PERIOD),
    filingAddress: {
      kind: "irs_filing_address",
      street,
      city: normalizeText(row.CITY),
      state: normalizeText(row.STATE)?.toUpperCase() ?? null,
      postalCode: normalizeText(row.ZIP),
      isPoBox: isIrsFilingPoBox(street),
      serviceLocationVerified: false,
    },
    ...classification,
    acquisitionStatus: "identity_only",
    websiteUrl: null,
    socialAccounts: [],
    services: [],
    hours: null,
    eligibility: null,
    coordinates: null,
    serviceAreas: [],
    serviceLocation: null,
    primaryImage: null,
    publicDisplayEligible: false,
    requiresProviderEvidence: true,
    source: {
      kind: "irs_eo_bmf",
      label: "IRS Exempt Organizations Business Master File",
      file: sourceFile,
      identityEvidenceOnly: true,
    },
  }
}

export function buildIrsEoCandidatePriority(candidate, seed = "coach-house") {
  return sha256(`${seed}:${candidate.ein}`)
}

export function buildIrsEoSearchQueries(candidate) {
  const location = [
    candidate.filingAddress?.city,
    candidate.filingAddress?.state,
  ]
    .filter(Boolean)
    .join(" ")
  const quotedName = `"${candidate.organizationName}"`

  return [
    [quotedName, location, "official"].filter(Boolean).join(" "),
    [quotedName, candidate.ein].filter(Boolean).join(" "),
    [quotedName, "services nonprofit"].filter(Boolean).join(" "),
  ]
}

export function buildIrsEoWorkItem(candidate) {
  return {
    schemaVersion: 1,
    workItemId: `irs-eo-work:${candidate.ein}`,
    ein: candidate.ein,
    organizationName: candidate.organizationName,
    categoryHints: candidate.categoryHints,
    filingAddress: candidate.filingAddress,
    directServiceScore: candidate.directServiceScore,
    acquisitionStatus: "pending_website_match",
    searchQueries: buildIrsEoSearchQueries(candidate),
    requiredEvidence: [
      "provider_identity",
      "specific_service",
      "access_or_contact",
      "service_location_or_area",
    ],
    publicationBlocked: true,
  }
}

function normalizeHttpUrl(value) {
  const raw = readString(value)
  if (!raw) return null
  try {
    const url = new URL(raw)
    return ["http:", "https:"].includes(url.protocol) ? url.href : null
  } catch {
    return null
  }
}

function normalizeResearchUrls(value) {
  if (!Array.isArray(value)) return []
  return [...new Set(value.map(normalizeHttpUrl).filter(Boolean))]
}

export function normalizeIrsEoResearchResult(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Research result must be an object.")
  }

  const ein = normalizeIrsEin(value.ein)
  if (!ein) throw new Error("Research result requires a nine-digit EIN.")
  const acquisitionStatus = readString(value.acquisitionStatus)
  if (!IRS_EO_RESEARCH_STATUSES.includes(acquisitionStatus)) {
    throw new Error(
      `Research result ${ein} has unsupported status: ${acquisitionStatus ?? "missing"}.`
    )
  }

  const websiteUrl = normalizeHttpUrl(value.websiteUrl)
  const evidenceUrls = normalizeResearchUrls(value.evidenceUrls)
  if (acquisitionStatus !== "held" && !websiteUrl) {
    throw new Error(`Research result ${ein} requires a provider website URL.`)
  }
  if (
    !["website_matched", "held"].includes(acquisitionStatus) &&
    evidenceUrls.length === 0
  ) {
    throw new Error(
      `Research result ${ein} requires at least one evidence URL.`
    )
  }
  if (
    ["verified", "ready_for_review"].includes(acquisitionStatus) &&
    value.providerIdentitySupported !== true
  ) {
    throw new Error(
      `Research result ${ein} requires supported provider identity before ${acquisitionStatus}.`
    )
  }
  if (
    acquisitionStatus === "ready_for_review" &&
    (!Array.isArray(value.services) || value.services.length === 0)
  ) {
    throw new Error(
      `Research result ${ein} requires a source-supported service before review.`
    )
  }

  return {
    ...value,
    schemaVersion: 1,
    resultId: `irs-eo-result:${ein}`,
    ein,
    acquisitionStatus,
    websiteUrl,
    evidenceUrls,
    socialAccounts: Array.isArray(value.socialAccounts)
      ? value.socialAccounts.filter((account) =>
          isSpecificSocialAccountUrl(account?.url)
        )
      : [],
    services: Array.isArray(value.services) ? value.services : [],
    serviceAreas: Array.isArray(value.serviceAreas) ? value.serviceAreas : [],
    publicDisplayEligible: false,
    publicationBlocked: true,
  }
}
