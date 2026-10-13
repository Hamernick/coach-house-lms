import { createHash } from "node:crypto"

import { fetchProviderPageSnapshot } from "./provider-page-comparison.mjs"

export const IRS_EO_SERVICE_EVIDENCE_VERSION = "2026-09-01.3"

const EVIDENCE_FALSE_POSITIVE_PATTERN =
  /\b(?:completed the requirements|failed to provide|have questions or need assistance|program graduates|protective services)\b/iu

const FIELD_PATTERNS = {
  hours: [
    /\b(?:hours?|open|meal service|service times?)\b.{0,120}(?:\b(?:mon|tues|wed|thu|fri|sat|sun)(?:day)?s?\b|\b(?:noon|midnight)\b|\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b)/iu,
    /\b(?:mon|tues|wed|thu|fri|sat|sun)(?:day)?s?\b.{0,120}(?:\b(?:noon|midnight|closed)\b|\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b)/iu,
  ],
  eligibility: [
    /\b(?:eligib|qualif|requirements?|must be|open to|ages? \d|income|residents? of)\b/iu,
  ],
  access: [
    /\b(?:apply|application|register|sign up|call|email|walk[ -]?in|appointment|online|in[ -]?person|contact us|join us|find support|get help)\b/iu,
  ],
  service_area: [
    /\b(?:service area|nationwide|residents? of|counties|county residents|communities across|following locations|locations around the country)\b/iu,
  ],
  service: [
    /\b(?:we (?:provide|offer)|provides?|offers?|programs?|services?|support groups?|workshops?|assistance)\b/iu,
    /\b(?:match(?:es)?|connects?)\b.{0,120}\b(?:adults|families|individuals|people|volunteers)\b/iu,
  ],
}

function readString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return null
}

function normalizeUrl(value) {
  try {
    const url = new URL(value)
    if (!["http:", "https:"].includes(url.protocol)) return null
    url.hash = ""
    return url.toString()
  } catch {
    return null
  }
}

function normalizedHost(value) {
  return new URL(value).hostname
    .toLocaleLowerCase("en-US")
    .replace(/^www\./u, "")
}

function isSameProviderSite(value, providerUrl) {
  const host = normalizedHost(value)
  const providerHost = normalizedHost(providerUrl)
  return (
    host === providerHost ||
    host.endsWith(`.${providerHost}`) ||
    providerHost.endsWith(`.${host}`)
  )
}

export function isProviderLinkedServicePage(candidate, websiteUrl) {
  const pageUrl = normalizeUrl(candidate?.url)
  const providerUrl = normalizeUrl(websiteUrl)
  const sourceUrl = normalizeUrl(candidate?.sourceUrl)
  if (
    !pageUrl ||
    !providerUrl ||
    !sourceUrl ||
    candidate?.providerLinked !== true
  ) {
    return false
  }
  if (/context\.(?:item|submission)|%22%22/iu.test(pageUrl)) return false
  return (
    isSameProviderSite(pageUrl, providerUrl) &&
    isSameProviderSite(sourceUrl, providerUrl)
  )
}

function boundedSnippet(value) {
  return String(value ?? "")
    .replace(/\s+/gu, " ")
    .trim()
    .slice(0, 500)
}

function evidenceSegments(snapshot) {
  const page = snapshot?.pageEvidence ?? {}
  const pageValues = [
    page.pageTitle,
    ...(Array.isArray(page.headings) ? page.headings : []),
    page.metaDescription,
    page.textExcerpt,
  ].filter(Boolean)
  const source = (pageValues.length ? pageValues : [snapshot?.evidenceSnippet])
    .filter(Boolean)
    .join(". ")
  return source
    .split(/(?:[.!?]\s+|\n+)/u)
    .map(boundedSnippet)
    .filter((segment) => segment.length >= 12)
}

function matchesField(segment, patterns) {
  return patterns.some((pattern) => pattern.test(segment))
}

export function extractIrsEoServiceFieldEvidence(snapshot) {
  if (snapshot?.fetchStatus !== "fetched") return []
  const sourceUrl = normalizeUrl(snapshot.finalUrl ?? snapshot.websiteUrl)
  if (!sourceUrl) return []
  const contentHash = readString(
    snapshot.contentHash,
    snapshot.pageEvidence?.contentSha256
  )
  const candidates = []
  const seen = new Set()

  for (const segment of evidenceSegments(snapshot)) {
    if (EVIDENCE_FALSE_POSITIVE_PATTERN.test(segment)) continue
    for (const [field, patterns] of Object.entries(FIELD_PATTERNS)) {
      if (!matchesField(segment, patterns)) continue
      const key = `${field}:${segment.toLocaleLowerCase("en-US")}`
      if (seen.has(key)) continue
      seen.add(key)
      candidates.push({
        field,
        snippet: segment,
        sourceUrl,
        sourceContentHash: contentHash,
        fetchedAt: snapshot.checkedAt ?? null,
        extractionMethod: "deterministic_pattern",
        publishable: false,
      })
    }
  }

  const perField = new Map()
  return candidates.filter((candidate) => {
    const count = perField.get(candidate.field) ?? 0
    if (count >= 3) return false
    perField.set(candidate.field, count + 1)
    return true
  })
}

function snapshotForCache(snapshot) {
  return {
    ...snapshot,
    visibleText: readString(snapshot?.visibleText)?.slice(0, 100_000) ?? "",
  }
}

export function normalizeIrsEoServiceEvidenceCacheEntry(value) {
  const url = normalizeUrl(value?.url)
  const fetchedAt = readString(value?.fetchedAt, value?.snapshot?.checkedAt)
  if (!url || !fetchedAt || !value?.snapshot) return null
  return {
    cacheKey: `irs-eo-service:${createHash("sha256").update(url).digest("hex")}`,
    collectorVersion:
      readString(value.collectorVersion) ?? IRS_EO_SERVICE_EVIDENCE_VERSION,
    fetchedAt,
    snapshot: value.snapshot,
    url,
  }
}

export function isFreshIrsEoServiceEvidenceCache(
  value,
  { now = new Date(), maxAgeDays = 30 } = {}
) {
  if (value?.collectorVersion !== IRS_EO_SERVICE_EVIDENCE_VERSION) return false
  const fetchedAt = Date.parse(value?.fetchedAt ?? "")
  return (
    Number.isFinite(fetchedAt) &&
    now.getTime() - fetchedAt <= maxAgeDays * 24 * 60 * 60 * 1_000
  )
}

function uniqueUrls(values) {
  return [...new Set(values.map(normalizeUrl).filter(Boolean))]
}

export async function collectIrsEoServiceEvidence({
  researchResult,
  cacheByUrl = new Map(),
  network = false,
  maxPages = 3,
  maxAgeDays = 30,
  now = new Date(),
  fetchSnapshot = fetchProviderPageSnapshot,
}) {
  if (
    !researchResult?.ein ||
    researchResult.providerIdentitySupported !== true
  ) {
    throw new Error("Service evidence requires a supported provider identity.")
  }
  const websiteUrl = normalizeUrl(researchResult.websiteUrl)
  if (!websiteUrl)
    throw new Error("Service evidence requires a provider website.")

  const linkedPages = researchResult.providerLinkedEvidencePages ?? []
  const pageCandidates = [
    {
      url: websiteUrl,
      sourceUrl: websiteUrl,
      providerLinked: true,
      label: "Confirmed provider page",
    },
    ...linkedPages,
  ]
  const pages = pageCandidates
    .filter((candidate) => isProviderLinkedServicePage(candidate, websiteUrl))
    .filter(
      (candidate, index, items) =>
        items.findIndex(
          (item) => normalizeUrl(item.url) === normalizeUrl(candidate.url)
        ) === index
    )
    .slice(0, maxPages)
  const pageEvidence = []
  const cacheWrites = []
  let cacheHits = 0
  let networkRequests = 0
  let needsNetwork = 0

  for (const page of pages) {
    const pageUrl = normalizeUrl(page.url)
    const cached = cacheByUrl.get(pageUrl)
    let snapshot = null
    let source = "none"
    if (isFreshIrsEoServiceEvidenceCache(cached, { now, maxAgeDays })) {
      snapshot = cached.snapshot
      cacheHits += 1
      source = "cache"
    } else if (network) {
      snapshot = await fetchSnapshot(pageUrl, { checkedAt: now.toISOString() })
      networkRequests += 1
      source = "network"
      const cacheEntry = normalizeIrsEoServiceEvidenceCacheEntry({
        collectorVersion: IRS_EO_SERVICE_EVIDENCE_VERSION,
        fetchedAt: now.toISOString(),
        snapshot: snapshotForCache(snapshot),
        url: pageUrl,
      })
      cacheByUrl.set(pageUrl, cacheEntry)
      cacheWrites.push(cacheEntry)
    } else {
      needsNetwork += 1
    }
    if (!snapshot) {
      pageEvidence.push({ url: pageUrl, status: "needs_network", source })
      continue
    }
    const finalUrl = normalizeUrl(snapshot.finalUrl ?? pageUrl)
    const fetchStatus =
      snapshot.fetchStatus === "fetched" &&
      finalUrl &&
      !isSameProviderSite(finalUrl, websiteUrl)
        ? "off_site_redirect"
        : snapshot.fetchStatus
    pageEvidence.push({
      url: pageUrl,
      finalUrl,
      status: fetchStatus,
      httpStatus: snapshot.httpStatus ?? null,
      pageTitle: snapshot.pageTitle ?? null,
      contentHash: snapshot.contentHash ?? null,
      checkedAt: snapshot.checkedAt ?? null,
      snapshotSource: source,
      fieldEvidence:
        fetchStatus === "fetched"
          ? extractIrsEoServiceFieldEvidence(snapshot)
          : [],
    })
  }

  const fetchedPages = pageEvidence.filter((page) => page.status === "fetched")
  const fieldEvidence = fetchedPages.flatMap((page) => page.fieldEvidence)
  const serviceEvidence = fieldEvidence.filter(
    (evidence) => evidence.field === "service"
  )
  const updatedResult = serviceEvidence.length
    ? {
        ...researchResult,
        acquisitionStatus: "evidence_fetched",
        evidenceUrls: uniqueUrls([
          ...(researchResult.evidenceUrls ?? []),
          ...fetchedPages.map((page) => page.finalUrl ?? page.url),
        ]),
        serviceEvidence: fieldEvidence,
        publicDisplayEligible: false,
        publicationBlocked: true,
      }
    : researchResult

  return {
    schemaVersion: 1,
    collectionId: `irs-eo-service-evidence:${researchResult.ein}`,
    ein: researchResult.ein,
    websiteUrl,
    attemptedPageCount: pages.length,
    pageEvidence,
    researchResult: updatedResult,
    cacheWrites,
    counts: {
      cacheHits,
      networkRequests,
      needsNetwork,
      fetchedPages: fetchedPages.length,
      fieldEvidence: fieldEvidence.length,
      serviceEvidence: serviceEvidence.length,
      advanced: serviceEvidence.length ? 1 : 0,
    },
    aiCalls: 0,
    reviewed: 0,
    published: 0,
  }
}
