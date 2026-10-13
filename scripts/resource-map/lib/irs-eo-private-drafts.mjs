import { createHash } from "node:crypto"

const FIELD_KEYS = new Map([
  ["service", "services"],
  ["access", "accessInstructions"],
  ["eligibility", "eligibility"],
  ["hours", "hours"],
  ["service_area", "serviceAreas"],
])

function readString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function normalizeHttpUrl(value) {
  const raw = readString(value)
  if (!raw) return null
  try {
    const url = new URL(raw)
    if (!["http:", "https:"].includes(url.protocol)) return null
    url.hash = ""
    return url.toString()
  } catch {
    return null
  }
}

function uniqueBy(rows, readKey) {
  const seen = new Set()
  return rows.filter((row) => {
    const key = readKey(row)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function normalizeEvidenceCandidate(value) {
  const field = readString(value?.field)
  const snippet = readString(value?.snippet)
  const sourceUrl = normalizeHttpUrl(value?.sourceUrl)
  if (!FIELD_KEYS.has(field) || !snippet || !sourceUrl) return null
  return {
    snippet,
    sourceUrl,
    sourceContentHash: readString(value.sourceContentHash),
    fetchedAt: readString(value.fetchedAt),
    extractionMethod: readString(value.extractionMethod),
    candidateOnly: true,
    publishable: false,
  }
}

function normalizeContact(value) {
  const type = readString(value?.type)
  const contactValue = readString(value?.value)
  const sourceUrl = normalizeHttpUrl(value?.sourceUrl)
  if (!["email", "phone"].includes(type) || !contactValue || !sourceUrl) {
    return null
  }
  return {
    type,
    value: contactValue,
    sourceUrl,
    candidateOnly: true,
    visibility: "private",
  }
}

function contactKey(contact) {
  let value = contact.value.toLocaleLowerCase("en-US")
  if (contact.type === "phone") {
    value = value.replace(/\D/gu, "")
    if (value.length === 11 && value.startsWith("1")) value = value.slice(1)
  }
  return `${contact.type}:${value}`
}

function normalizeSocialAccount(value) {
  const platform = readString(value?.platform)
  const url = normalizeHttpUrl(value?.url)
  const sourceUrl = normalizeHttpUrl(value?.sourceUrl)
  if (!platform || !url || !sourceUrl || value?.providerLinked !== true) {
    return null
  }
  return {
    platform,
    url,
    sourceUrl,
    candidateOnly: true,
    visibility: "private",
  }
}

function normalizeMedia(value) {
  const url = normalizeHttpUrl(value?.url)
  const sourceUrl = normalizeHttpUrl(value?.sourceUrl)
  if (!url || !sourceUrl) return null
  return {
    url,
    sourceUrl,
    kind: readString(value.kind) ?? "image_candidate",
    alt: readString(value.alt),
    candidateOnly: true,
    rightsStatus: "unreviewed",
    publishable: false,
  }
}

function evidenceHash(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex")
}

export function buildIrsEoPrivateDraft({ researchResult, candidate }) {
  if (
    !researchResult?.ein ||
    !candidate?.organizationName ||
    researchResult.providerIdentitySupported !== true ||
    !["website_matched", "evidence_fetched"].includes(
      researchResult.acquisitionStatus
    )
  ) {
    return null
  }

  const websiteUrl = normalizeHttpUrl(researchResult.websiteUrl)
  if (!websiteUrl) return null

  const candidateFields = {
    services: [],
    accessInstructions: [],
    eligibility: [],
    hours: [],
    serviceAreas: [],
  }
  for (const value of researchResult.serviceEvidence ?? []) {
    const normalized = normalizeEvidenceCandidate(value)
    const key = FIELD_KEYS.get(value?.field)
    if (!normalized || !key) continue
    candidateFields[key].push(normalized)
  }
  for (const key of Object.keys(candidateFields)) {
    candidateFields[key] = uniqueBy(
      candidateFields[key],
      (item) => `${item.sourceUrl}:${item.snippet.toLocaleLowerCase("en-US")}`
    )
  }

  const contacts = uniqueBy(
    (researchResult.providerLinkedContacts ?? [])
      .map(normalizeContact)
      .filter(Boolean),
    contactKey
  )
  const socialAccounts = uniqueBy(
    (researchResult.socialAccounts ?? [])
      .map(normalizeSocialAccount)
      .filter(Boolean),
    (account) => `${account.platform}:${account.url.replace(/\/+$/u, "")}`
  )
  const media = uniqueBy(
    (researchResult.mediaEvidence ?? []).map(normalizeMedia).filter(Boolean),
    (item) => item.url
  )
  const evidenceUrls = uniqueBy(
    (researchResult.evidenceUrls ?? [])
      .map(normalizeHttpUrl)
      .filter(Boolean)
      .map((url) => ({ url })),
    (item) => item.url
  ).map((item) => item.url)
  const evidencePayload = {
    websiteUrl,
    evidenceUrls,
    candidateFields,
    contacts,
    socialAccounts,
    media,
  }

  return {
    schemaVersion: 1,
    kind: "irs_eo_private_draft_field_candidates",
    draftId: `irs-eo-private-draft:${researchResult.ein}`,
    ein: researchResult.ein,
    organizationName: candidate.organizationName,
    acquisitionStatus: researchResult.acquisitionStatus,
    discoveryCategoryHints: (candidate.categoryHints ?? []).map((value) => ({
      value,
      basis: "irs_discovery_hint",
      claimSupported: false,
    })),
    providerIdentity: {
      supported: true,
      websiteUrl,
      evidenceUrls,
    },
    candidateFields,
    privateContacts: contacts,
    privateSocialAccounts: socialAccounts,
    privateMediaCandidates: media,
    serviceLocationCandidates: [],
    coordinatesCandidates: [],
    exclusions: {
      irsFilingAddressUsedAsServiceLocation: false,
      reason: "IRS filing addresses are identity evidence only.",
    },
    coverage: {
      website: 1,
      services: candidateFields.services.length,
      accessInstructions: candidateFields.accessInstructions.length,
      eligibility: candidateFields.eligibility.length,
      hours: candidateFields.hours.length,
      serviceAreas: candidateFields.serviceAreas.length,
      contacts: contacts.length,
      socialAccounts: socialAccounts.length,
      mediaCandidates: media.length,
      serviceLocations: 0,
      coordinates: 0,
    },
    evidenceHash: evidenceHash(evidencePayload),
    requiresIndependentVerification: true,
    readyForReview: false,
    publicDisplayEligible: false,
    publicationBlocked: true,
  }
}
