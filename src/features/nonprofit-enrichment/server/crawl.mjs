import { buildIrsEoWorkPackagePlan } from "../../../../scripts/resource-map/lib/irs-eo-work-packages.mjs"
import {
  buildIrsEoSearchPlan,
  buildSharedProviderFetchPlan,
} from "../../../../scripts/resource-map/lib/irs-eo-search-discovery.mjs"
import {
  runIrsEoOwnedCrawler,
  validateIrsEoOwnedExecutionContract,
} from "../../../../scripts/resource-map/lib/irs-eo-owned-crawler.mjs"
import { extractIrsEoServiceFieldEvidence } from "../../../../scripts/resource-map/lib/irs-eo-service-evidence.mjs"
import { normalizeAcquisitionUrl } from "../../../../scripts/resource-map/lib/web-acquisition-policy.mjs"
import { createDeadlineTransport, deadlineResolver } from "./crawl-network.mjs"
import { retainedFollowups } from "./crawl-links.mjs"
import { findCachedPage, plannedCachedPage } from "./crawl-cache.mjs"
import {
  structuredPolicy,
  createStructuredCollector,
  applyStructuredEvidence,
} from "./structured-evidence.mjs"
import { pageRejection, quarantinePage } from "./verification.mjs"
import { assertLease, addEvidence } from "./queue.mjs"
import { event, hash, stable, transaction, utc } from "./store.mjs"

export function websiteCandidateUrl(value) {
  if (typeof value !== "string") return null
  const candidate = value.trim()
  if (
    /^[a-z0-9.-]+\.[a-z]{2,}(?:[/:?#].*)?$/i.test(candidate) &&
    !candidate.includes("://")
  )
    return normalizeAcquisitionUrl(`https://${candidate}`)
  return normalizeAcquisitionUrl(candidate)
}
export function planCrawl(db, claims, { followLinks = false } = {}) {
  if (!Array.isArray(claims) || !claims.length || claims.length > 25)
    throw new Error("Provide 1..25 claims")
  const identities = claims.map((c) => {
    assertLease(db, c.ein, c.token)
    return JSON.parse(
      db.prepare("SELECT identity FROM organizations WHERE ein=?").get(c.ein)
        .identity
    )
  })
  const work = buildIrsEoWorkPackagePlan(identities, { packageSize: 25 })
    .packages[0]
  const parent = buildIrsEoSearchPlan(work)
  const sets = claims.map((c) => ({
    ein: c.ein,
    searchCompleted: true,
    candidates: db
      .prepare(
        "SELECT value FROM evidence WHERE ein=? AND field='website' AND state IN ('candidate','verified') ORDER BY observed_at DESC LIMIT 3"
      )
      .all(c.ein)
      .map((r, i) => ({
        url: websiteCandidateUrl(JSON.parse(r.value)),
        rank: i + 1,
        title: "Source-backed website candidate",
      }))
      .filter((c) => c.url),
  }))
  const followups = []
  if (followLinks) {
    for (const set of sets) {
      const seen = new Set(set.candidates.map((c) => c.url))
      const available = set.candidates
        .flatMap((c) => retainedFollowups(db, set.ein, c.url))
        .sort((a, b) => a.score - b.score || a.url.localeCompare(b.url))
        .filter((link) => {
          if (seen.has(link.url)) return false
          seen.add(link.url)
          return true
        })
      // Prefer one contact/location page and one program/service page.
      const links = available.slice(0, 1)
      const complementary = available.find(
        (link) => link.score !== links[0]?.score
      )
      const second = complementary ?? available[1]
      if (second) links.push(second)
      for (const link of links) {
        followups.push(link)
        set.candidates.push({
          url: link.url,
          rank: 4 + link.score,
          title: link.label ?? "Provider evidence page",
        })
      }
    }
  }
  const full = buildSharedProviderFetchPlan(sets, {
    packageId: parent.packageId,
    parentPlanHash: parent.planHash,
    maxNetworkRequests: claims.length * 6,
    maxRetainedBytes: claims.length * 1_000_000,
  })
  const cached = full.requests.flatMap((r) => {
    const page = findCachedPage(db, r)
    return page
      ? [{ ...r, cacheKey: page.cache_key, cacheBodyHash: hash(page.body) }]
      : []
  })
  const cachedUrls = new Set(cached.map((r) => r.url))
  const selectedUrls = new Set(full.requests.map((r) => r.url))
  const fetch = buildSharedProviderFetchPlan(
    sets.map((s) => ({
      ...s,
      candidates: s.candidates.filter(
        (c) => selectedUrls.has(c.url) && !cachedUrls.has(c.url)
      ),
    })),
    {
      packageId: parent.packageId,
      parentPlanHash: parent.planHash,
      maxNetworkRequests: claims.length * 6,
      maxRetainedBytes: claims.length * 1_000_000,
    }
  )
  const body = {
    version: 2,
    structuredMetadata: structuredPolicy(claims),
    parent,
    fetch,
    cached,
    followups: followups.filter((link) =>
      full.requests.some((r) => r.url === link.url)
    ),
    claims: claims.map(({ ein, token }) => ({ ein, token })),
    publicationBlocked: true,
  }
  return { ...body, hash: hash(body) }
}
function retainPage(
  db,
  receipt,
  consumers,
  followups = [],
  requestUrl = receipt.sourceUrl
) {
  const text = receipt.evidence?.textExcerpt ?? ""
  if (receipt.status !== "fetched" || !text) return
  for (const { ein } of consumers) {
    const rejection = pageRejection(receipt)
    if (rejection) {
      quarantinePage(db, ein, receipt, rejection)
      continue
    }
    const identity = JSON.parse(
      db.prepare("SELECT identity FROM organizations WHERE ein=?").get(ein)
        .identity
    )
    const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "")
    const name = normalize(identity.organizationName)
    const einPattern = new RegExp(`\\b${ein.slice(0, 2)}-?${ein.slice(2)}\\b`)
    const supported =
      name.length >= 8 &&
      normalize(text).includes(name) &&
      einPattern.test(text)
    const base = {
      source_url: receipt.finalUrl,
      observed_at: receipt.finishedAt,
      evidence: text.slice(0, 20000),
      source_type: "provider_page",
      method: supported
        ? "official_page_exact_ein_and_name_v1"
        : "provider_page_candidate_v1",
      license: "unknown",
    }
    // Contact/program pages are evidence, never replacement homepage URLs.
    if (!followups.some((link) => link.ein === ein && link.url === requestUrl))
      addEvidence(
        db,
        ein,
        { ...base, field: "website", value: receipt.finalUrl },
        { trustedState: supported ? "verified" : "candidate" }
      )
    // Related attributes stay candidates until field-specific verification; no public writes.
    for (const phone of receipt.signals?.contacts?.filter(
      (c) => c.type === "phone"
    ) ?? [])
      addEvidence(db, ein, { ...base, field: "phone", value: phone.value })
    if (receipt.signals?.socialAccounts?.length)
      addEvidence(db, ein, {
        ...base,
        field: "social_profiles",
        value: receipt.signals.socialAccounts,
      })
    if (receipt.evidence?.metaDescription)
      addEvidence(db, ein, {
        ...base,
        field: "description",
        value: receipt.evidence.metaDescription,
      })
    const services = extractIrsEoServiceFieldEvidence({
      fetchStatus: "fetched",
      finalUrl: receipt.finalUrl,
      pageEvidence: receipt.evidence,
      checkedAt: receipt.finishedAt,
    }).filter((f) => f.field === "service")
    if (services.length)
      addEvidence(db, ein, { ...base, field: "services", value: services })
    if (receipt.signals?.imageCandidates?.length)
      addEvidence(db, ein, {
        ...base,
        field: "logo",
        value: receipt.signals.imageCandidates.map((a) => ({
          ...a,
          rightsStatus: "rights_unknown",
        })),
      })
  }
}
export async function crawl(db, bundle, confirmation, overrides = {}) {
  const { hash: expected, ...body } = bundle
  if (hash(body) !== expected || expected !== confirmation)
    throw new Error("Exact bundle hash confirmation required")
  validateIrsEoOwnedExecutionContract(bundle.fetch, bundle.parent)
  for (const c of bundle.claims) assertLease(db, c.ein, c.token)
  const allowed = new Set(bundle.claims.map((c) => c.ein))
  const metadata = createStructuredCollector(db, bundle)
  for (const r of [...bundle.fetch.requests, ...bundle.cached])
    for (const c of r.consumers)
      if (!allowed.has(c.ein)) throw new Error("Crawl consumer outside claims")
  // Fail before fetching if retained parent evidence changed after planning.
  for (const link of bundle.followups ?? []) {
    const page = db
      .prepare("SELECT body FROM pages WHERE cache_key=? AND expires_at>?")
      .get(link.parentCacheKey, Date.now())
    if (
      !page ||
      JSON.parse(page.body).evidence.contentSha256 !== link.parentHash
    )
      throw new Error(
        "Follow-up parent evidence changed; regenerate crawl plan"
      )
  }
  // Check pinned cache evidence before any network work, including redirects.
  for (const request of bundle.cached) plannedCachedPage(db, request)
  // One local network executor at a time. Hold the lock through all network work.
  // SIGKILL leaves a lease; a later run may reclaim after the bounded deadline.
  const lockId = hash({ expected, now: utc(), pid: process.pid })
  transaction(db, () => {
    const lock = db
      .prepare("SELECT value FROM meta WHERE key='crawler_lock'")
      .get()
    if (lock && JSON.parse(lock.value).expires > Date.now())
      throw new Error("Another crawler owns the local network lease")
    db.prepare(
      "INSERT INTO meta VALUES ('crawler_lock',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value"
    ).run(stable({ id: lockId, expires: Date.now() + 120_000 }))
  })
  const renew = () =>
    transaction(db, () => {
      const lock = JSON.parse(
        db.prepare("SELECT value FROM meta WHERE key='crawler_lock'").get()
          .value
      )
      if (lock.id !== lockId) throw new Error("Crawler lease lost")
      for (const c of bundle.claims) {
        assertLease(db, c.ein, c.token)
        db.prepare("UPDATE jobs SET expires_at=? WHERE ein=?").run(
          Date.now() + 900_000,
          c.ein
        )
      }
      db.prepare("UPDATE meta SET value=? WHERE key='crawler_lock'").run(
        stable({ id: lockId, expires: Date.now() + 120_000 })
      )
    })
  const timer = setInterval(() => {
    try {
      renew()
    } catch {
      /* next request or receipt fails closed */
    }
  }, 30_000)
  try {
    renew()
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const receipts = db
      .prepare("SELECT body FROM runs WHERE kind=? ORDER BY created_at,id")
      .all(`receipt:${expected}`)
      .map((r) => JSON.parse(r.body))
      .sort((a, b) => a.sequence - b.sequence)
    const onTiming = (timing) => {
      renew()
      const at = utc()
      db.prepare("INSERT INTO runs VALUES (?,?,?,?)").run(
        hash({ lockId, timing, at, sequence: timingSequence++ }),
        `crawl_timing:${expected}`,
        stable(timing),
        at
      )
    }
    let timingSequence = 0
    const transport =
      overrides.transport ?? createDeadlineTransport({ onTiming })
    const resolveHostname = deadlineResolver({
      resolveHostname: overrides.resolveHostname,
      onTiming,
    })
    const result = await runIrsEoOwnedCrawler(bundle.fetch, {
      ...overrides,
      resolveHostname: async (hostname) => {
        renew()
        return resolveHostname(hostname)
      },
      transport: async (request) => {
        renew()
        const response = await transport(request)
        metadata.capture(request, response)
        return response
      },
      parentPlan: bundle.parent,
      existingReceipts: receipts,
      onReceipt: (receipt) => {
        renew()
        transaction(db, () => {
          for (const c of bundle.claims) assertLease(db, c.ein, c.token)
          db.prepare("INSERT OR IGNORE INTO runs VALUES (?,?,?,?)").run(
            `${expected}:${receipt.sequence}`,
            `receipt:${expected}`,
            stable(receipt),
            receipt.finishedAt
          )
          if (
            receipt.status === "fetched" &&
            receipt.receiptType === "provider"
          ) {
            db.prepare(
              "INSERT INTO pages VALUES (?,?,?,?,?,?) ON CONFLICT(cache_key) DO UPDATE SET content_hash=excluded.content_hash,fetched_at=excluded.fetched_at,expires_at=excluded.expires_at,body=excluded.body"
            ).run(
              hash(receipt.sourceUrl),
              receipt.sourceUrl,
              receipt.evidence.contentSha256,
              receipt.finishedAt,
              Date.parse(receipt.finishedAt) + 30 * 86400_000,
              stable(receipt)
            )
            retainPage(db, receipt, receipt.consumers, bundle.followups)
            metadata.retain(receipt)
          }
        })
      },
    })
    transaction(db, () => {
      for (const c of bundle.claims) assertLease(db, c.ein, c.token)
      for (const r of bundle.cached) {
        const page = plannedCachedPage(db, r)
        retainPage(
          db,
          JSON.parse(page.body),
          r.consumers,
          bundle.followups,
          r.url
        )
        applyStructuredEvidence(db, JSON.parse(page.body), r.consumers)
      }
      const report = {
        ...result.manifest.counts,
        cacheHits: bundle.cached.length,
        structuredRetainedBytes: metadata.retainedBytes,
      }
      db.prepare(
        "INSERT INTO runs VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body"
      ).run(expected, "crawl", stable(report), utc())
      event(db, null, "crawl_completed", { hash: expected, ...report })
    })
    return {
      ...result.manifest.counts,
      cacheHits: bundle.cached.length,
      structuredRetainedBytes: metadata.retainedBytes,
      publicationBlocked: true,
    }
  } finally {
    clearInterval(timer)
    transaction(db, () => {
      const lock = db
        .prepare("SELECT value FROM meta WHERE key='crawler_lock'")
        .get()
      if (lock && JSON.parse(lock.value).id === lockId)
        db.prepare("DELETE FROM meta WHERE key='crawler_lock'").run()
    })
  }
}
