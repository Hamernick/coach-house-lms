import { sha256 } from "./data-engine/shared.mjs"
import {
  compareProviderPageSnapshot,
  fetchProviderPageSnapshot,
} from "./provider-page-comparison.mjs"
import { isSpecificSocialAccountUrl } from "./provider-page-signals.mjs"

export const IRS_EO_WEBSITE_RESOLUTION_VERSION = "2026-09-01.4"

const SOCIAL_HOSTS = new Set([
  "facebook.com",
  "instagram.com",
  "linkedin.com",
  "tiktok.com",
  "twitter.com",
  "x.com",
  "youtube.com",
])

const DIRECTORY_HOSTS = new Set([
  "causeiq.com",
  "charitynavigator.org",
  "guidestar.org",
  "instrumentl.com",
  "nonprofitlocator.org",
  "orgcouncil.com",
  "petfinder.com",
  "philanthropy.com",
  "propublica.org",
  "usfiredept.com",
  "yelp.com",
])

const DECLARED_CANDIDATE_KINDS = new Set([
  "directory",
  "government",
  "news",
  "other",
  "provider_parent",
  "provider_website",
  "social",
])

const STATE_NAMES = {
  AL: "alabama",
  AK: "alaska",
  AZ: "arizona",
  AR: "arkansas",
  CA: "california",
  CO: "colorado",
  CT: "connecticut",
  DE: "delaware",
  DC: "district of columbia",
  FL: "florida",
  GA: "georgia",
  HI: "hawaii",
  ID: "idaho",
  IL: "illinois",
  IN: "indiana",
  IA: "iowa",
  KS: "kansas",
  KY: "kentucky",
  LA: "louisiana",
  ME: "maine",
  MD: "maryland",
  MA: "massachusetts",
  MI: "michigan",
  MN: "minnesota",
  MS: "mississippi",
  MO: "missouri",
  MT: "montana",
  NE: "nebraska",
  NV: "nevada",
  NH: "new hampshire",
  NJ: "new jersey",
  NM: "new mexico",
  NY: "new york",
  NC: "north carolina",
  ND: "north dakota",
  OH: "ohio",
  OK: "oklahoma",
  OR: "oregon",
  PA: "pennsylvania",
  PR: "puerto rico",
  RI: "rhode island",
  SC: "south carolina",
  SD: "south dakota",
  TN: "tennessee",
  TX: "texas",
  UT: "utah",
  VT: "vermont",
  VA: "virginia",
  VI: "virgin islands",
  WA: "washington",
  WV: "west virginia",
  WI: "wisconsin",
  WY: "wyoming",
}

function readString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return null
}

function baseHost(value) {
  const parts = value
    .toLocaleLowerCase("en-US")
    .replace(/^www\./u, "")
    .split(".")
    .filter(Boolean)
  return parts.slice(-2).join(".")
}

export function normalizeIrsEoWebsiteCandidateUrl(value) {
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

export function classifyIrsEoWebsiteCandidate(value) {
  const normalizedUrl = normalizeIrsEoWebsiteCandidateUrl(value)
  if (!normalizedUrl) return "invalid"
  const host = baseHost(new URL(normalizedUrl).hostname)
  if (SOCIAL_HOSTS.has(host)) return "social"
  if (DIRECTORY_HOSTS.has(host)) return "directory"
  return "provider_website"
}

export function normalizeIrsEoWebsiteCandidateSet(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Website candidate set must be an object.")
  }
  const ein = String(value.ein ?? "").replace(/\D/gu, "")
  if (ein.length !== 9) {
    throw new Error("Website candidate set requires a nine-digit EIN.")
  }
  const seen = new Set()
  const candidates = (Array.isArray(value.candidates) ? value.candidates : [])
    .map((candidate, index) => {
      const raw =
        typeof candidate === "string" ? { url: candidate } : (candidate ?? {})
      const url = normalizeIrsEoWebsiteCandidateUrl(raw.url)
      if (!url || seen.has(url)) return null
      seen.add(url)
      const automaticKind = classifyIrsEoWebsiteCandidate(url)
      const declaredKind = readString(raw.candidateKind)
      const candidateKind =
        automaticKind === "provider_website" &&
        DECLARED_CANDIDATE_KINDS.has(declaredKind)
          ? declaredKind
          : automaticKind
      return {
        url,
        candidateKind,
        rank: Number.isFinite(Number(raw.rank)) ? Number(raw.rank) : index + 1,
        title: readString(raw.title),
        snippet: readString(raw.snippet),
        query: readString(raw.query),
        adapterId: readString(raw.adapterId),
        sourceUrl: normalizeIrsEoWebsiteCandidateUrl(raw.sourceUrl),
        sourceKind: readString(raw.sourceKind),
        sourceContentHash: /^[a-f0-9]{64}$/u.test(raw.sourceContentHash ?? "")
          ? raw.sourceContentHash
          : null,
        matchMethod: readString(raw.matchMethod),
        discoveredAt: readString(raw.discoveredAt, value.discoveredAt),
        snippetEvidenceAllowed: false,
      }
    })
    .filter(Boolean)
    .sort((left, right) => left.rank - right.rank)

  return {
    schemaVersion: 1,
    ein,
    searchCompleted: value.searchCompleted === true,
    candidates,
  }
}

export function normalizeIrsEoWebsiteSnapshotCacheEntry(value) {
  const url = normalizeIrsEoWebsiteCandidateUrl(value?.url)
  const fetchedAt = readString(value?.fetchedAt, value?.snapshot?.checkedAt)
  if (!url || !fetchedAt || !value?.snapshot) return null
  return {
    schemaVersion: 1,
    cacheKey: `irs-eo-website:${sha256(url)}`,
    resolverVersion: readString(
      value.resolverVersion,
      value.snapshot.resolverVersion
    ),
    url,
    fetchedAt,
    snapshot: value.snapshot,
  }
}

export function isFreshIrsEoWebsiteSnapshot(
  cacheEntry,
  { now = new Date(), maxAgeDays = 30 } = {}
) {
  if (cacheEntry?.resolverVersion !== IRS_EO_WEBSITE_RESOLUTION_VERSION) {
    return false
  }
  const fetchedAt = Date.parse(cacheEntry?.fetchedAt ?? "")
  if (!Number.isFinite(fetchedAt)) return false
  return now.getTime() - fetchedAt <= maxAgeDays * 24 * 60 * 60 * 1_000
}

function buildComparisonRecord(workItem, websiteUrl) {
  return {
    extractedFields: {
      organizationName: workItem.organizationName,
      providerName: workItem.organizationName,
      websiteUrl,
    },
  }
}

export function isStrongIrsEoWebsiteComparison(
  comparison,
  { candidateKind = "provider_website" } = {}
) {
  if (comparison?.status !== "supported") return false
  const signals = new Set(comparison.matchedSignals ?? [])
  if (signals.has("phone")) return true
  if (
    signals.has("exact_provider_name") &&
    (signals.has("provider_domain") || signals.has("provider_acronym_domain"))
  ) {
    return true
  }
  if (
    candidateKind === "provider_website" &&
    signals.has("exact_provider_name") &&
    comparison.filingGeographySupported === true
  ) {
    return true
  }
  if (
    candidateKind === "provider_parent" &&
    signals.has("exact_provider_name") &&
    comparison.matchedTokens?.length >= 2 &&
    comparison.filingGeographySupported === true
  ) {
    return true
  }
  return (
    signals.has("provider_name_tokens") &&
    comparison.filingGeographySupported === true &&
    (signals.has("provider_domain") ||
      signals.has("provider_name_acronym") ||
      signals.has("provider_acronym_domain"))
  )
}

function normalizeEvidenceText(value) {
  return ` ${String(value ?? "")
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()} `
}

function filingGeographySupported(workItem, snapshot) {
  const city = readString(workItem.filingAddress?.city)?.toLocaleLowerCase(
    "en-US"
  )
  const state = readString(workItem.filingAddress?.state)?.toUpperCase()
  const postalCode = readString(workItem.filingAddress?.postalCode)?.match(
    /\d{5}/u
  )?.[0]
  const stateName = state ? STATE_NAMES[state] : null
  const text = normalizeEvidenceText(snapshot.visibleText)
  return Boolean(
    (postalCode && text.includes(` ${postalCode} `)) ||
    (city && state && text.includes(` ${city} ${state.toLowerCase()} `)) ||
    (city && stateName && text.includes(` ${city} ${stateName} `))
  )
}

function publicSnapshot(snapshot) {
  const { visibleText, evidenceSnippet, error, ...metadata } = snapshot
  return {
    ...metadata,
    error: readString(error),
    evidenceSnippet: readString(evidenceSnippet),
  }
}

function cacheableSnapshot(snapshot) {
  return {
    ...snapshot,
    resolverVersion: IRS_EO_WEBSITE_RESOLUTION_VERSION,
    visibleText: readString(snapshot.visibleText)?.slice(0, 100_000) ?? "",
  }
}

function scoreComparison(comparison) {
  const signals = new Set(comparison.matchedSignals ?? [])
  return (
    (signals.has("exact_provider_name") ? 100 : 0) +
    (signals.has("phone") ? 90 : 0) +
    (signals.has("provider_domain") ? 50 : 0) +
    (signals.has("provider_acronym_domain") ? 45 : 0) +
    (signals.has("provider_name_tokens") ? 30 : 0) +
    (signals.has("provider_name_acronym") ? 20 : 0) +
    Math.round(Number(comparison.tokenCoverage ?? 0) * 10)
  )
}

function candidateHostname(value) {
  try {
    return new URL(value).hostname
      .toLocaleLowerCase("en-US")
      .replace(/^www\./u, "")
  } catch {
    return null
  }
}

function applySameSiteParentCorroboration(evaluations) {
  for (const evaluation of evaluations) {
    if (
      evaluation.candidateKind !== "provider_parent" ||
      evaluation.status !== "supported" ||
      !(evaluation.matchedSignals ?? []).includes("exact_provider_name") ||
      (evaluation.matchedTokens ?? []).length < 2
    ) {
      continue
    }
    const hostname = candidateHostname(evaluation.finalUrl ?? evaluation.url)
    const geographySupported = evaluations.some(
      (candidate) =>
        candidate.candidateKind === "provider_parent" &&
        candidate.status === "supported" &&
        candidateHostname(candidate.finalUrl ?? candidate.url) === hostname &&
        candidate.filingGeographySupported === true
    )
    if (hostname && geographySupported) {
      evaluation.resolutionStatus = "strong_match"
      evaluation.sameSiteParentCorroborated = true
    }
  }
}

function heldResult(workItem, evidenceUrls, reasonCodes) {
  return {
    ein: workItem.ein,
    acquisitionStatus: "held",
    websiteUrl: null,
    evidenceUrls,
    providerIdentitySupported: false,
    identitySignals: [],
    socialAccounts: [],
    services: [],
    serviceAreas: [],
    reasonCodes,
    publicDisplayEligible: false,
    publicationBlocked: true,
  }
}

export async function resolveIrsEoProviderWebsite({
  workItem,
  candidateSet,
  cacheByUrl = new Map(),
  network = false,
  maxCandidates = 3,
  maxAgeDays = 30,
  now = new Date(),
  fetchSnapshot = fetchProviderPageSnapshot,
}) {
  const normalizedSet = normalizeIrsEoWebsiteCandidateSet(candidateSet)
  if (normalizedSet.ein !== workItem.ein) {
    throw new Error(
      `Website candidates do not match work item ${workItem.ein}.`
    )
  }
  const providerCandidates = normalizedSet.candidates
    .filter((candidate) =>
      ["provider_parent", "provider_website"].includes(candidate.candidateKind)
    )
    .slice(0, maxCandidates)
  const evaluations = []
  const cacheWrites = []
  let cacheHits = 0
  let networkRequests = 0
  let needsNetwork = 0

  for (const candidate of providerCandidates) {
    const cached = cacheByUrl.get(candidate.url)
    let snapshot = null
    let source = "none"
    if (isFreshIrsEoWebsiteSnapshot(cached, { now, maxAgeDays })) {
      snapshot = cached.snapshot
      cacheHits += 1
      source = "cache"
    } else if (network) {
      snapshot = await fetchSnapshot(candidate.url, {
        checkedAt: now.toISOString(),
      })
      networkRequests += 1
      source = "network"
      const cacheEntry = normalizeIrsEoWebsiteSnapshotCacheEntry({
        url: candidate.url,
        fetchedAt: now.toISOString(),
        resolverVersion: IRS_EO_WEBSITE_RESOLUTION_VERSION,
        snapshot: cacheableSnapshot(snapshot),
      })
      cacheByUrl.set(candidate.url, cacheEntry)
      cacheWrites.push(cacheEntry)
    } else {
      needsNetwork += 1
    }

    if (!snapshot) {
      evaluations.push({ ...candidate, resolutionStatus: "needs_network" })
      continue
    }
    const comparison = {
      ...compareProviderPageSnapshot(
        buildComparisonRecord(workItem, candidate.url),
        snapshot
      ),
      filingGeographySupported: filingGeographySupported(workItem, snapshot),
    }
    evaluations.push({
      ...candidate,
      ...publicSnapshot(comparison),
      resolutionStatus: isStrongIrsEoWebsiteComparison(comparison, {
        candidateKind: candidate.candidateKind,
      })
        ? "strong_match"
        : comparison.status,
      score: scoreComparison(comparison),
      snapshotSource: source,
    })
  }

  applySameSiteParentCorroboration(evaluations)

  const strongMatches = evaluations
    .filter((evaluation) => evaluation.resolutionStatus === "strong_match")
    .sort((left, right) => right.score - left.score || left.rank - right.rank)
  const selected = strongMatches[0] ?? null
  let researchResult = null
  if (selected) {
    researchResult = {
      ein: workItem.ein,
      acquisitionStatus: "website_matched",
      websiteUrl: selected.finalUrl ?? selected.url,
      evidenceUrls: [selected.finalUrl ?? selected.url],
      providerIdentitySupported: true,
      identitySignals: selected.matchedSignals ?? [],
      socialAccounts: (selected.pageSignals?.socialAccounts ?? []).filter(
        (account) => isSpecificSocialAccountUrl(account.url)
      ),
      services: [],
      serviceAreas: [],
      providerLinkedContacts: selected.pageSignals?.contacts ?? [],
      providerLinkedEvidencePages:
        selected.pageSignals?.evidenceLinkCandidates ?? [],
      mediaEvidence: selected.pageSignals?.imageCandidates ?? [],
      sourceContentHash: selected.contentHash ?? null,
      sourceFetchedAt: selected.checkedAt ?? null,
      publicDisplayEligible: false,
      publicationBlocked: true,
    }
  } else if (providerCandidates.length === 0 && normalizedSet.searchCompleted) {
    researchResult = heldResult(workItem, [], ["no_provider_website_candidate"])
  } else if (
    normalizedSet.searchCompleted &&
    needsNetwork === 0 &&
    evaluations.length > 0
  ) {
    researchResult = heldResult(
      workItem,
      evaluations.map((evaluation) => evaluation.finalUrl ?? evaluation.url),
      ["provider_identity_not_supported"]
    )
  }

  return {
    schemaVersion: 1,
    resolutionId: `irs-eo-website-resolution:${workItem.ein}`,
    ein: workItem.ein,
    organizationName: workItem.organizationName,
    searchedCandidateCount: normalizedSet.candidates.length,
    providerCandidateCount: providerCandidates.length,
    searchCompleted: normalizedSet.searchCompleted,
    selectedWebsiteUrl: researchResult?.websiteUrl ?? null,
    resolutionStatus: researchResult?.acquisitionStatus ?? "needs_network",
    evaluations,
    researchResult,
    cacheWrites,
    counts: { cacheHits, networkRequests, needsNetwork },
    aiCalls: 0,
    reviewed: 0,
    published: 0,
  }
}
