import { sha256 } from "./data-engine/shared.mjs"
import {
  classifyIrsEoWebsiteCandidate,
  normalizeIrsEoWebsiteCandidateSet,
} from "./irs-eo-website-resolution.mjs"
import { stableJson } from "./irs-eo-research-control-plane.mjs"
import { validateIrsEoWorkPackage } from "./irs-eo-work-packages.mjs"
import {
  acquisitionHostKey,
  buildHostAcquisitionPolicy,
  normalizeAcquisitionUrl,
  robotsUrlFor,
} from "./web-acquisition-policy.mjs"

export const IRS_EO_SEARCH_PLAN_SCHEMA_VERSION = 3
export const IRS_EO_SEARCH_POLICY_VERSION = "resource-map-owned-discovery-v1"

export const IRS_EO_SEARCH_ADAPTERS = Object.freeze([
  {
    adapterId: "local_evidence_cache",
    tier: 0,
    networkRequired: false,
    paid: false,
  },
  {
    adapterId: "authoritative_directory_index",
    tier: 1,
    networkRequired: false,
    paid: false,
  },
  {
    adapterId: "self_hosted_evidence_index",
    tier: 2,
    networkRequired: false,
    paid: false,
  },
  {
    adapterId: "deterministic_domain_candidates",
    tier: 3,
    networkRequired: false,
    paid: false,
  },
  {
    adapterId: "bounded_public_crawler",
    tier: 4,
    networkRequired: true,
    paid: false,
  },
  {
    adapterId: "sandboxed_browser",
    tier: 5,
    networkRequired: true,
    paid: false,
  },
])

export const IRS_EO_URL_EVIDENCE_ADAPTERS = Object.freeze([
  {
    adapterId: "live_provider_fetch",
    purpose: "current_provider_evidence",
    networkRequired: true,
  },
  {
    adapterId: "common_crawl_archive",
    purpose: "known_url_history_only",
    networkRequired: true,
  },
])

const ADAPTER_IDS = new Set(
  IRS_EO_SEARCH_ADAPTERS.map(({ adapterId }) => adapterId)
)
const TERMINAL_SEARCH_STATUSES = new Set(["completed", "no_results"])

function normalizeQuery(value) {
  return String(value ?? "")
    .replace(/\s+/gu, " ")
    .trim()
}

export function buildIrsEoSearchPlan(workPackage) {
  validateIrsEoWorkPackage(workPackage)
  if (
    workPackage?.kind !== "irs_eo_discovery_work_package" ||
    workPackage?.publicationBlocked !== true
  ) {
    throw new Error(
      "Search planning requires a private discovery work package."
    )
  }
  const requests = []
  const seen = new Set()
  for (const record of workPackage.records ?? []) {
    for (const [queryIndex, rawQuery] of (
      record.searchQueries ?? []
    ).entries()) {
      const query = normalizeQuery(rawQuery)
      if (!query) continue
      const dedupeKey = `${record.ein}:${query.toLocaleLowerCase("en-US")}`
      if (seen.has(dedupeKey)) continue
      seen.add(dedupeKey)
      const requestBody = {
        schemaVersion: IRS_EO_SEARCH_PLAN_SCHEMA_VERSION,
        policyVersion: IRS_EO_SEARCH_POLICY_VERSION,
        packageId: workPackage.packageId,
        ein: record.ein,
        organizationName: record.organizationName,
        filingState: record.filingState,
        query,
        queryIndex,
        adapterWaterfall: IRS_EO_SEARCH_ADAPTERS.map(
          ({ adapterId }) => adapterId
        ),
        stopAfterProviderCandidates: 3,
        snippetsAreEvidence: false,
        publicationBlocked: true,
      }
      requests.push({
        ...requestBody,
        requestId: `search-${sha256(stableJson(requestBody)).slice(0, 20)}`,
      })
    }
  }
  if (requests.length > (workPackage.budgets?.maxSearchQueries ?? 0)) {
    throw new Error(
      "Search request plan exceeds the work-package query budget."
    )
  }
  const planBody = {
    schemaVersion: IRS_EO_SEARCH_PLAN_SCHEMA_VERSION,
    kind: "irs_eo_provider_search_plan",
    policyVersion: IRS_EO_SEARCH_POLICY_VERSION,
    packageId: workPackage.packageId,
    packageHash: workPackage.packageHash,
    requests,
    adapters: IRS_EO_SEARCH_ADAPTERS,
    ownedDiscoveryPolicy: {
      paidProvidersAllowed: false,
      commercialSearchScrapingAllowed: false,
      maxDomainHypothesesPerOrganization: 2,
      maxCrawlerRequests: workPackage.budgets?.maxHttpRequests ?? 0,
      maxRetainedBytes: workPackage.budgets?.maxRetainedBytes ?? 0,
      maxRequestsPerHost: 3,
      robotsRequired: true,
      rawResponsesRetained: false,
    },
    publicDisplayEligible: false,
    publicationBlocked: true,
  }
  return { ...planBody, planHash: sha256(stableJson(planBody)) }
}

function normalizeAdapterResultRow(value, requestById) {
  const request = requestById.get(value?.requestId)
  if (!request)
    throw new Error(`Unknown search request: ${value?.requestId ?? "missing"}.`)
  if (!ADAPTER_IDS.has(value?.adapterId)) {
    throw new Error(
      `Unsupported search adapter: ${value?.adapterId ?? "missing"}.`
    )
  }
  const status = String(value?.status ?? "")
  if (
    !["completed", "no_results", "miss", "failed", "budget_exhausted"].includes(
      status
    )
  ) {
    throw new Error(
      `Unsupported search adapter status: ${status || "missing"}.`
    )
  }
  return {
    request,
    adapterId: value.adapterId,
    status,
    results: (Array.isArray(value.results) ? value.results : []).slice(0, 10),
    telemetry: value.telemetry ?? {},
  }
}

export function normalizeIrsEoSearchAdapterResults(plan, rows) {
  const requestById = new Map(
    plan.requests.map((request) => [request.requestId, request])
  )
  const normalizedRows = rows.map((row) =>
    normalizeAdapterResultRow(row, requestById)
  )
  const candidatesByEin = new Map()
  const terminalRequests = new Set()
  let invalidUrls = 0
  let duplicateUrls = 0

  for (const row of normalizedRows) {
    if (TERMINAL_SEARCH_STATUSES.has(row.status)) {
      terminalRequests.add(row.request.requestId)
    }
    const bucket = candidatesByEin.get(row.request.ein) ?? new Map()
    for (const [index, result] of row.results.entries()) {
      const url = normalizeAcquisitionUrl(result?.url)
      if (!url) {
        invalidUrls += 1
        continue
      }
      if (bucket.has(url)) {
        duplicateUrls += 1
        continue
      }
      bucket.set(url, {
        url,
        candidateKind: classifyIrsEoWebsiteCandidate(url),
        rank: row.request.queryIndex * 100 + index + 1,
        title: String(result?.title ?? "").trim() || null,
        snippet:
          String(result?.snippet ?? "")
            .trim()
            .slice(0, 500) || null,
        query: row.request.query,
        adapterId: row.adapterId,
        sourceUrl: normalizeAcquisitionUrl(result?.sourceUrl),
        sourceKind: String(result?.sourceKind ?? "").trim() || null,
        sourceContentHash: /^[a-f0-9]{64}$/u.test(
          result?.sourceContentHash ?? ""
        )
          ? result.sourceContentHash
          : null,
        matchMethod: String(result?.matchMethod ?? "").trim() || null,
        discoveredAt: result?.discoveredAt ?? null,
        snippetEvidenceAllowed: false,
      })
    }
    candidatesByEin.set(row.request.ein, bucket)
  }

  const candidateSets = []
  for (const ein of new Set(plan.requests.map((request) => request.ein))) {
    const requests = plan.requests.filter((request) => request.ein === ein)
    candidateSets.push(
      normalizeIrsEoWebsiteCandidateSet({
        ein,
        searchCompleted: requests.every((request) =>
          terminalRequests.has(request.requestId)
        ),
        candidates: [...(candidatesByEin.get(ein)?.values() ?? [])],
      })
    )
  }

  return {
    candidateSets,
    counts: {
      adapterRows: normalizedRows.length,
      requestsPlanned: plan.requests.length,
      requestsTerminal: terminalRequests.size,
      candidateSets: candidateSets.length,
      candidates: candidateSets.reduce(
        (sum, set) => sum + set.candidates.length,
        0
      ),
      invalidUrls,
      duplicateUrls,
    },
  }
}

export function buildSharedProviderFetchPlan(
  candidateSets,
  {
    maxNetworkRequests = 75,
    maxPerHost = 3,
    maxRetainedBytes = 25_000_000,
    packageId = null,
    parentPlanHash = null,
  } = {}
) {
  const requestByUrl = new Map()
  const rejected = []
  for (const set of candidateSets.map(normalizeIrsEoWebsiteCandidateSet)) {
    for (const candidate of set.candidates) {
      if (
        !["provider_parent", "provider_website"].includes(
          candidate.candidateKind
        )
      ) {
        rejected.push({
          ein: set.ein,
          url: candidate.url,
          reason: "not_provider_candidate",
        })
        continue
      }
      const url = normalizeAcquisitionUrl(candidate.url)
      const hostname = acquisitionHostKey(url)
      if (!url || !hostname) {
        rejected.push({
          ein: set.ein,
          url: candidate.url,
          reason: "invalid_url",
        })
        continue
      }
      const existing = requestByUrl.get(url)
      if (existing) {
        existing.consumers.push({ ein: set.ein, rank: candidate.rank })
        continue
      }
      requestByUrl.set(url, {
        requestId: `fetch-${sha256(url).slice(0, 20)}`,
        url,
        hostname,
        robotsUrl: robotsUrlFor(url),
        robotsStatus: "needs_check",
        consumers: [{ ein: set.ein, rank: candidate.rank }],
        publicationBlocked: true,
      })
    }
  }

  const selected = []
  const hostCounts = new Map()
  const selectedOrigins = new Set()
  const ordered = [...requestByUrl.values()].sort(
    (left, right) =>
      Math.min(...left.consumers.map(({ rank }) => rank)) -
        Math.min(...right.consumers.map(({ rank }) => rank)) ||
      left.url.localeCompare(right.url)
  )
  for (const request of ordered) {
    const origin = new URL(request.robotsUrl).origin
    const requestCost = 1 + (selectedOrigins.has(origin) ? 0 : 1)
    if (
      selected.length + selectedOrigins.size + requestCost >
      maxNetworkRequests
    ) {
      rejected.push({ url: request.url, reason: "total_fetch_budget" })
      continue
    }
    const hostCount = hostCounts.get(request.hostname) ?? 0
    if (hostCount >= maxPerHost) {
      rejected.push({ url: request.url, reason: "host_fetch_budget" })
      continue
    }
    hostCounts.set(request.hostname, hostCount + 1)
    selectedOrigins.add(origin)
    selected.push(request)
  }

  const hostPolicies = [...hostCounts.entries()]
    .map(([hostname, count]) =>
      buildHostAcquisitionPolicy(hostname, { maxRequests: count })
    )
    .sort((left, right) => left.hostname.localeCompare(right.hostname))
  const robotsRequests = [
    ...new Map(
      selected.map((request) => [
        new URL(request.robotsUrl).origin,
        {
          requestId: `robots-${sha256(request.robotsUrl).slice(0, 20)}`,
          url: request.robotsUrl,
          hostname: request.hostname,
        },
      ])
    ).values(),
  ]
  const planBody = {
    schemaVersion: 2,
    kind: "irs_eo_shared_provider_fetch_plan",
    packageId,
    parentPlanHash,
    executionPolicy: {
      networkRequestBudget: maxNetworkRequests,
      retainedByteBudget: maxRetainedBytes,
      maxRequestsPerHost: maxPerHost,
      maxPageBytes: 1_000_000,
      maxRobotsBytes: 256_000,
      requestTimeoutMs: 15_000,
      maxRedirects: 3,
      userAgent:
        "CoachHouseResourceResearch/1.0 (+https://coachhouse.app)",
      allowedPorts: [80, 443],
      rawResponsesRetained: false,
    },
    requests: selected,
    robotsRequests,
    hostPolicies,
    rejected,
    counts: {
      uniqueCandidateUrls: requestByUrl.size,
      sharedUrlConsumers: selected.reduce(
        (sum, request) => sum + Math.max(0, request.consumers.length - 1),
        0
      ),
      selected: selected.length,
      uniqueHosts: hostCounts.size,
      robotsChecks: robotsRequests.length,
      plannedNetworkRequests: selected.length + robotsRequests.length,
      rejected: rejected.length,
    },
    publicDisplayEligible: false,
    publicationBlocked: true,
  }
  return { ...planBody, planHash: sha256(stableJson(planBody)) }
}

export function buildSearchStageTelemetry({
  packageId,
  adapterRows = [],
  normalizedCounts,
  fetchPlan,
}) {
  const byAdapter = {}
  for (const row of adapterRows) {
    const adapterId = ADAPTER_IDS.has(row.adapterId) ? row.adapterId : "unknown"
    const entry = byAdapter[adapterId] ?? { rows: 0, queries: 0, results: 0 }
    entry.rows += 1
    entry.queries += Number(row.telemetry?.queries ?? 0)
    entry.results += Array.isArray(row.results) ? row.results.length : 0
    byAdapter[adapterId] = entry
  }
  return {
    schemaVersion: 1,
    kind: "irs_eo_search_stage_telemetry",
    packageId,
    dimensions: { stage: "provider_discovery" },
    byAdapter,
    counts: { ...normalizedCounts, ...fetchPlan.counts },
    identifiersExcludedFromMetricLabels: ["ein", "url", "query"],
    publicationBlocked: true,
  }
}
