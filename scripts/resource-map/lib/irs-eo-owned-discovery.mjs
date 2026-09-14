import { sha256 } from "./data-engine/shared.mjs"
import { normalizeIrsEin } from "./irs-eo-acquisition.mjs"
import { validateIrsEoSearchPlan } from "./irs-eo-search-adapters.mjs"
import { normalizeProviderNameForExactMatch } from "./provider-page-comparison.mjs"
import { stableJson } from "./irs-eo-research-control-plane.mjs"
import { normalizeAcquisitionUrl } from "./web-acquisition-policy.mjs"

const OWNED_INDEX_SOURCE_KINDS = new Set([
  "211_directory",
  "food_bank_directory",
  "government_directory",
  "provider_directory",
  "provider_link_page",
])
const DOMAIN_STOP_WORDS = new Set(["and", "for", "of", "the"])
const LEGAL_SUFFIXES = new Set([
  "co",
  "company",
  "corp",
  "corporation",
  "inc",
  "incorporated",
  "limited",
  "llc",
  "ltd",
])
const GENERIC_IDENTITY_WORDS = new Set([
  "association",
  "center",
  "centre",
  "church",
  "club",
  "coalition",
  "community",
  "council",
  "foundation",
  "fund",
  "ministry",
  "network",
  "organization",
  "program",
  "project",
  "service",
  "services",
  "society",
  "trust",
])

function text(value) {
  return String(value ?? "")
    .replace(/\s+/gu, " ")
    .trim()
}

function stateCode(value) {
  const normalized = text(value).toUpperCase()
  return /^[A-Z]{2}$/u.test(normalized) ? normalized : null
}

function adapterResult(request, adapterId, status, results = []) {
  return {
    schemaVersion: 1,
    kind: "irs_eo_search_adapter_result",
    requestId: request.requestId,
    adapterId,
    status,
    results,
    telemetry: { queries: 0, networkRequests: 0, paidQueries: 0 },
    publicDisplayEligible: false,
    publicationBlocked: true,
  }
}

function normalizeEvidenceDocument(row) {
  const providerWebsiteUrl = normalizeAcquisitionUrl(
    row?.providerWebsiteUrl ?? row?.websiteUrl ?? row?.website
  )
  const sourceUrl = normalizeAcquisitionUrl(
    row?.sourceUrl ?? row?.documentUrl ?? row?.pageUrl
  )
  const organizationName = text(
    row?.organizationName ?? row?.providerName ?? row?.name
  )
  const sourceKind = text(row?.sourceKind)
  const state = stateCode(row?.state)
  const ein = normalizeIrsEin(row?.ein)
  if (
    !providerWebsiteUrl ||
    !sourceUrl ||
    !organizationName ||
    !OWNED_INDEX_SOURCE_KINDS.has(sourceKind) ||
    (!ein && !state)
  ) {
    return null
  }
  const body = {
    schemaVersion: 1,
    kind: "irs_eo_owned_evidence_index_entry",
    ein,
    organizationName,
    normalizedName: normalizeProviderNameForExactMatch(organizationName),
    state,
    providerWebsiteUrl,
    sourceUrl,
    sourceKind,
    observedAt: text(row?.observedAt ?? row?.fetchedAt) || null,
    publicDisplayEligible: false,
    publicationBlocked: true,
  }
  const entryHash = sha256(stableJson(body))
  return {
    ...body,
    entryHash,
    shardKey: entryHash.slice(0, 2),
  }
}

export function buildIrsEoOwnedEvidenceIndex(rows) {
  const entries = []
  const seen = new Set()
  let rejectedRows = 0
  let duplicateRows = 0
  for (const row of rows) {
    const entry = normalizeEvidenceDocument(row)
    if (!entry) {
      rejectedRows += 1
      continue
    }
    if (seen.has(entry.entryHash)) {
      duplicateRows += 1
      continue
    }
    seen.add(entry.entryHash)
    entries.push(entry)
  }
  entries.sort(
    (left, right) =>
      left.shardKey.localeCompare(right.shardKey) ||
      left.entryHash.localeCompare(right.entryHash)
  )
  const manifestBody = {
    schemaVersion: 1,
    kind: "irs_eo_owned_evidence_index_manifest",
    entryHashes: entries.map(({ entryHash }) => entryHash),
    counts: {
      inputRows: rows.length,
      entries: entries.length,
      rejectedRows,
      duplicateRows,
      shards: new Set(entries.map(({ shardKey }) => shardKey)).size,
    },
    publicDisplayEligible: false,
    publicationBlocked: true,
  }
  return {
    manifest: {
      ...manifestBody,
      manifestHash: sha256(stableJson(manifestBody)),
    },
    entries,
  }
}

function indexEntries(entries) {
  const byEin = new Map()
  const byNameAndState = new Map()
  for (const entry of entries) {
    if (entry.ein) {
      const bucket = byEin.get(entry.ein) ?? []
      bucket.push(entry)
      byEin.set(entry.ein, bucket)
    }
    if (entry.state) {
      const key = `${entry.normalizedName}:${entry.state}`
      const bucket = byNameAndState.get(key) ?? []
      bucket.push(entry)
      byNameAndState.set(key, bucket)
    }
  }
  return { byEin, byNameAndState }
}

export function runSelfHostedEvidenceIndexAdapter(plan, index) {
  validateIrsEoSearchPlan(plan)
  const indexes = indexEntries(index.entries ?? [])
  const foundEins = new Set()
  return plan.requests.map((request) => {
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
      return adapterResult(request, "self_hosted_evidence_index", "miss")
    }
    if (foundEins.has(request.ein)) {
      return adapterResult(request, "self_hosted_evidence_index", "no_results")
    }
    foundEins.add(request.ein)
    return adapterResult(
      request,
      "self_hosted_evidence_index",
      "completed",
      matches.slice(0, 3).map((match) => ({
        url: match.providerWebsiteUrl,
        title: match.organizationName,
        snippet: null,
        sourceUrl: match.sourceUrl,
        sourceKind: match.sourceKind,
        sourceContentHash: match.entryHash,
        matchMethod,
        discoveredAt: match.observedAt,
      }))
    )
  })
}

function domainTokens(organizationName) {
  return normalizeProviderNameForExactMatch(organizationName)
    .split(" ")
    .map((token) => token.replace(/[^a-z0-9]/gu, ""))
    .filter(Boolean)
    .filter((token) => !LEGAL_SUFFIXES.has(token))
}

export function buildDeterministicDomainHypotheses(
  organizationName,
  { maxCandidates = 2 } = {}
) {
  const tokens = domainTokens(organizationName)
  const identityTokens = tokens.filter(
    (token) =>
      token.length >= 4 &&
      !DOMAIN_STOP_WORDS.has(token) &&
      !GENERIC_IDENTITY_WORDS.has(token) &&
      !/^\d+$/u.test(token)
  )
  if (identityTokens.length === 0) return []
  const slugs = []
  const fullSlug = tokens
    .filter((token) => !DOMAIN_STOP_WORDS.has(token))
    .join("")
  if (fullSlug.length >= 7 && fullSlug.length <= 48) slugs.push(fullSlug)
  const acronym = tokens
    .filter((token) => !DOMAIN_STOP_WORDS.has(token))
    .map((token) => token[0])
    .join("")
  if (tokens.length >= 3 && acronym.length >= 3 && acronym.length <= 10) {
    slugs.push(acronym)
  }
  return [...new Set(slugs)]
    .slice(0, Math.max(0, Math.min(2, maxCandidates)))
    .map((slug) => `https://${slug}.org/`)
}

export function runDeterministicDomainCandidateAdapter(plan) {
  validateIrsEoSearchPlan(plan)
  const handledEins = new Set()
  return plan.requests.map((request) => {
    if (handledEins.has(request.ein)) {
      return adapterResult(request, "deterministic_domain_candidates", "miss")
    }
    handledEins.add(request.ein)
    const urls = buildDeterministicDomainHypotheses(request.organizationName, {
      maxCandidates:
        plan.ownedDiscoveryPolicy?.maxDomainHypothesesPerOrganization ?? 2,
    })
    if (urls.length === 0) {
      return adapterResult(request, "deterministic_domain_candidates", "miss")
    }
    return adapterResult(
      request,
      "deterministic_domain_candidates",
      "completed",
      urls.map((url) => ({
        url,
        title: request.organizationName,
        snippet: null,
        sourceUrl: null,
        sourceKind: "deterministic_domain_hypothesis",
        sourceContentHash: null,
        matchMethod: "unverified_domain_hypothesis",
        discoveredAt: null,
      }))
    )
  })
}
