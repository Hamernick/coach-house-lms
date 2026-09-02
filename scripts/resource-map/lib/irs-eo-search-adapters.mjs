import { sha256 } from "./data-engine/shared.mjs"
import { normalizeIrsEin } from "./irs-eo-acquisition.mjs"
import { IRS_EO_SEARCH_ADAPTERS } from "./irs-eo-search-discovery.mjs"
import { normalizeIrsEoWebsiteCandidateSet } from "./irs-eo-website-resolution.mjs"
import { normalizeProviderNameForExactMatch } from "./provider-page-comparison.mjs"
import { stableJson } from "./irs-eo-research-control-plane.mjs"
import { normalizeAcquisitionUrl } from "./web-acquisition-policy.mjs"

const ADAPTER_IDS = new Set(
  IRS_EO_SEARCH_ADAPTERS.map(({ adapterId }) => adapterId)
)
const DIRECTORY_SOURCE_KINDS = new Set([
  "government_directory",
  "provider_directory",
  "211_directory",
  "food_bank_directory",
])

export function validateIrsEoSearchPlan(plan) {
  const { planHash, ...planBody } = plan ?? {}
  if (!planHash || sha256(stableJson(planBody)) !== planHash) {
    throw new Error("Provider search plan hash mismatch.")
  }
  return plan
}

function adapterResult(request, adapterId, status, results = []) {
  return {
    schemaVersion: 1,
    kind: "irs_eo_search_adapter_result",
    requestId: request.requestId,
    adapterId,
    status,
    results,
    telemetry: {
      queries: adapterId === "local_evidence_cache" ? 0 : 1,
      networkRequests: 0,
      paidQueries: 0,
    },
    publicDisplayEligible: false,
    publicationBlocked: true,
  }
}

export function runLocalEvidenceSearchAdapter(plan, candidateSets) {
  validateIrsEoSearchPlan(plan)
  const byEin = new Map(
    candidateSets
      .map(normalizeIrsEoWebsiteCandidateSet)
      .map((candidateSet) => [candidateSet.ein, candidateSet])
  )
  const foundEins = new Set()
  return plan.requests.map((request) => {
    const candidateSet = byEin.get(request.ein)
    if (!candidateSet || candidateSet.candidates.length === 0) {
      return adapterResult(request, "local_evidence_cache", "miss")
    }
    if (foundEins.has(request.ein)) {
      return adapterResult(request, "local_evidence_cache", "no_results")
    }
    foundEins.add(request.ein)
    return adapterResult(
      request,
      "local_evidence_cache",
      "completed",
      candidateSet.candidates.map((candidate) => ({
        url: candidate.url,
        title: candidate.title,
        snippet: candidate.snippet,
        discoveredAt: candidate.discoveredAt,
      }))
    )
  })
}

function normalizeDirectoryRow(row) {
  const websiteUrl = normalizeAcquisitionUrl(
    row?.websiteUrl ?? row?.website ?? row?.url
  )
  const sourceUrl = normalizeAcquisitionUrl(row?.sourceUrl)
  const organizationName = String(
    row?.organizationName ?? row?.providerName ?? row?.name ?? ""
  ).trim()
  const sourceKind = String(row?.sourceKind ?? "")
  if (
    !websiteUrl ||
    !sourceUrl ||
    !organizationName ||
    !DIRECTORY_SOURCE_KINDS.has(sourceKind)
  ) {
    return null
  }
  const ein = normalizeIrsEin(row?.ein)
  const state =
    String(row?.state ?? "")
      .trim()
      .toUpperCase() || null
  const normalized = {
    ein,
    organizationName,
    normalizedName: normalizeProviderNameForExactMatch(organizationName),
    state,
    websiteUrl,
    sourceUrl,
    sourceKind,
    observedAt: row?.observedAt ?? null,
  }
  return { ...normalized, rowHash: sha256(stableJson(normalized)) }
}

function buildDirectoryIndexes(rows) {
  const byEin = new Map()
  const byNameAndState = new Map()
  let rejectedRows = 0
  for (const row of rows) {
    const normalized = normalizeDirectoryRow(row)
    if (!normalized) {
      rejectedRows += 1
      continue
    }
    if (normalized.ein) {
      const entries = byEin.get(normalized.ein) ?? []
      entries.push(normalized)
      byEin.set(normalized.ein, entries)
    }
    if (normalized.state) {
      const key = `${normalized.normalizedName}:${normalized.state}`
      const entries = byNameAndState.get(key) ?? []
      entries.push(normalized)
      byNameAndState.set(key, entries)
    }
  }
  return { byEin, byNameAndState, rejectedRows }
}

export function runAuthoritativeDirectorySearchAdapter(plan, rows) {
  validateIrsEoSearchPlan(plan)
  const indexes = buildDirectoryIndexes(rows)
  const foundEins = new Set()
  const results = plan.requests.map((request) => {
    let matches = indexes.byEin.get(request.ein) ?? []
    let matchMethod = "ein_exact"
    if (matches.length === 0 && request.filingState) {
      const key = `${normalizeProviderNameForExactMatch(
        request.organizationName
      )}:${request.filingState}`
      matches = indexes.byNameAndState.get(key) ?? []
      matchMethod = "name_state_exact"
    }
    if (matches.length === 0) {
      return adapterResult(request, "authoritative_directory_index", "miss")
    }
    if (foundEins.has(request.ein)) {
      return adapterResult(
        request,
        "authoritative_directory_index",
        "no_results"
      )
    }
    foundEins.add(request.ein)
    return adapterResult(
      request,
      "authoritative_directory_index",
      "completed",
      matches.slice(0, 3).map((match) => ({
        url: match.websiteUrl,
        title: match.organizationName,
        snippet: null,
        discoveredAt: match.observedAt,
        sourceUrl: match.sourceUrl,
        sourceKind: match.sourceKind,
        sourceContentHash: match.rowHash,
        matchMethod,
      }))
    )
  })
  return { results, rejectedRows: indexes.rejectedRows }
}

export function runIrsEoOfflineSearchAdapter({ plan, adapterId, inputRows }) {
  if (!ADAPTER_IDS.has(adapterId)) {
    throw new Error(`Unsupported search adapter: ${adapterId}.`)
  }
  if (adapterId === "local_evidence_cache") {
    return {
      results: runLocalEvidenceSearchAdapter(plan, inputRows),
      rejectedRows: 0,
    }
  }
  if (adapterId === "authoritative_directory_index") {
    return runAuthoritativeDirectorySearchAdapter(plan, inputRows)
  }
  throw new Error(`Adapter ${adapterId} requires a separate network executor.`)
}
