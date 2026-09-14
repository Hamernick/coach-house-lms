import { createHash } from "node:crypto"

import { sha256 } from "./data-engine/shared.mjs"
import {
  createNodeCrawlerTransport,
  crawlerError,
  readCrawlerHeader as headerValue,
  validatePublicCrawlerTarget,
} from "./irs-eo-owned-crawler-network.mjs"
import { validateIrsEoSearchPlan } from "./irs-eo-search-adapters.mjs"
import { stableJson } from "./irs-eo-research-control-plane.mjs"
import { extractSourcePageEvidence } from "./source-evidence.mjs"
import { extractProviderPageSignals } from "./provider-page-signals.mjs"
import {
  evaluateRobotsResponse,
  normalizeAcquisitionUrl,
  robotsUrlFor,
} from "./web-acquisition-policy.mjs"

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308])
const PAGE_CONTENT_TYPES = ["text/html", "application/xhtml+xml", "text/plain"]

export function validateIrsEoOwnedFetchPlan(plan) {
  const { planHash, ...body } = plan ?? {}
  if (!planHash || sha256(stableJson(body)) !== planHash) {
    throw crawlerError("fetch_plan_hash_mismatch")
  }
  const policy = plan.executionPolicy
  if (
    plan.schemaVersion !== 2 ||
    plan.kind !== "irs_eo_shared_provider_fetch_plan" ||
    plan.publicationBlocked !== true ||
    !plan.packageId ||
    !/^[a-f0-9]{64}$/u.test(plan.parentPlanHash ?? "") ||
    !Number.isSafeInteger(policy?.networkRequestBudget) ||
    policy.networkRequestBudget < 1 ||
    policy.networkRequestBudget > 1_000 ||
    !Number.isSafeInteger(policy?.retainedByteBudget) ||
    policy.retainedByteBudget < 1 ||
    policy.retainedByteBudget > 1_000_000_000 ||
    !Number.isSafeInteger(policy?.maxRequestsPerHost) ||
    policy.maxRequestsPerHost < 1 ||
    policy.maxRequestsPerHost > 3 ||
    !Number.isSafeInteger(policy?.maxPageBytes) ||
    policy.maxPageBytes < 1 ||
    policy.maxPageBytes > 2_000_000 ||
    !Number.isSafeInteger(policy?.maxRobotsBytes) ||
    policy.maxRobotsBytes < 1 ||
    policy.maxRobotsBytes > 512_000 ||
    !Number.isSafeInteger(policy?.requestTimeoutMs) ||
    policy.requestTimeoutMs < 1_000 ||
    policy.requestTimeoutMs > 30_000 ||
    !Number.isSafeInteger(policy?.maxRedirects) ||
    policy.maxRedirects < 0 ||
    policy.maxRedirects > 3 ||
    policy.userAgent !==
      "CoachHouseResourceResearch/1.0 (+https://coachhouse.app)" ||
    stableJson(policy.allowedPorts) !== stableJson([80, 443]) ||
    policy.rawResponsesRetained !== false ||
    plan.counts?.plannedNetworkRequests > policy.networkRequestBudget ||
    !Array.isArray(plan.requests) ||
    new Set(plan.requests.map(({ requestId }) => requestId)).size !==
      plan.requests.length ||
    plan.requests.some(
      (request) =>
        !request.requestId ||
        normalizeAcquisitionUrl(request.url) !== request.url ||
        request.hostname !== new URL(request.url).hostname ||
        request.robotsUrl !== robotsUrlFor(request.url) ||
        request.publicationBlocked !== true
    )
  ) {
    throw crawlerError("unsupported_fetch_plan")
  }
  return plan
}

export function validateIrsEoOwnedExecutionContract(plan, parentPlan) {
  validateIrsEoOwnedFetchPlan(plan)
  validateIrsEoSearchPlan(parentPlan)
  if (
    plan.parentPlanHash !== parentPlan.planHash ||
    plan.packageId !== parentPlan.packageId ||
    plan.executionPolicy.networkRequestBudget >
      parentPlan.ownedDiscoveryPolicy.maxCrawlerRequests ||
    plan.executionPolicy.retainedByteBudget >
      parentPlan.ownedDiscoveryPolicy.maxRetainedBytes ||
    plan.executionPolicy.maxRequestsPerHost >
      parentPlan.ownedDiscoveryPolicy.maxRequestsPerHost ||
    parentPlan.ownedDiscoveryPolicy.robotsRequired !== true ||
    parentPlan.ownedDiscoveryPolicy.rawResponsesRetained !== false
  ) {
    throw crawlerError("parent_plan_mismatch")
  }
  return plan
}

function receiptHash(receipt) {
  const { receiptHash: ignored, ...body } = receipt
  void ignored
  return sha256(stableJson(body))
}

export function validateOwnedCrawlerReceiptChain(receipts, planHash) {
  let previousReceiptHash = null
  for (const [index, receipt] of receipts.entries()) {
    if (
      receipt.planHash !== planHash ||
      receipt.sequence !== index + 1 ||
      receipt.previousReceiptHash !== previousReceiptHash ||
      receipt.receiptHash !== receiptHash(receipt)
    ) {
      throw crawlerError("receipt_chain_invalid")
    }
    previousReceiptHash = receipt.receiptHash
  }
  return previousReceiptHash
}

function contentHash(body) {
  return createHash("sha256").update(body).digest("hex")
}

function outcome(error) {
  return error?.code ?? error?.message ?? "request_failed"
}

function isHtmlContentType(value) {
  return /(?:text\/html|application\/xhtml\+xml)/iu.test(value ?? "")
}

function isAllowedPageContentType(value) {
  const normalized = String(value ?? "").toLowerCase()
  return PAGE_CONTENT_TYPES.some((allowed) => normalized.includes(allowed))
}

function createReceipt(state, body) {
  const receipt = {
    schemaVersion: 1,
    kind: "irs_eo_owned_crawl_receipt",
    planHash: state.plan.planHash,
    packageId: state.plan.packageId,
    sequence: state.existingReceipts.length + state.receipts.length + 1,
    previousReceiptHash:
      state.receipts.at(-1)?.receiptHash ?? state.initialReceiptHash,
    ...body,
    publicDisplayEligible: false,
    publicationBlocked: true,
  }
  return { ...receipt, receiptHash: receiptHash(receipt) }
}

async function recordReceipt(state, body) {
  const receipt = createReceipt(state, body)
  state.receipts.push(receipt)
  state.retainedBytes += receipt.retainedBytes ?? 0
  try {
    await state.onReceipt?.(receipt, [
      ...state.existingReceipts,
      ...state.receipts,
    ])
  } catch (error) {
    throw crawlerError("receipt_persistence_failed", {
      cause: error,
      fatal: true,
    })
  }
  return receipt
}

function redirectTarget(response, currentUrl) {
  if (!REDIRECT_STATUSES.has(response.status)) return null
  const location = headerValue(response.headers, "location")
  if (!location) throw crawlerError("redirect_missing_location")
  return new URL(location, currentUrl).toString()
}

async function respectHostDelay(state, hostname, delayMs) {
  const lastRequestAt = state.lastHostRequestAt.get(hostname)
  const minimumDelay = Math.max(1_000, delayMs ?? 0)
  if (lastRequestAt !== undefined) {
    const remaining = minimumDelay - (state.clock() - lastRequestAt)
    if (remaining > 0) await state.sleep(remaining)
  }
  state.lastHostRequestAt.set(hostname, state.clock())
}

async function networkRequest(state, { url, maxBytes, phase, delayMs = 0 }) {
  if (state.networkRequests >= state.policy.networkRequestBudget) {
    throw crawlerError("network_budget_exhausted")
  }
  const target = await validatePublicCrawlerTarget(url, {
    resolveHostname: state.resolveHostname,
    allowedPorts: state.policy.allowedPorts,
  })
  await respectHostDelay(state, target.hostname, delayMs)
  state.networkRequests += 1
  let response
  try {
    response = await state.transport({
      ...target,
      maxBytes,
      timeoutMs: state.policy.requestTimeoutMs,
      headers: {
        Accept:
          phase === "robots"
            ? "text/plain"
            : "text/html,application/xhtml+xml,text/plain;q=0.8",
        "User-Agent": state.policy.userAgent,
      },
    })
  } catch (error) {
    const requestError =
      error instanceof Error ? error : crawlerError(String(error))
    requestError.networkEvent = {
      phase,
      url: target.url,
      hostname: target.hostname,
      status: null,
      receivedBytes: 0,
      contentSha256: null,
      error: outcome(requestError),
    }
    throw requestError
  }
  const body = Buffer.isBuffer(response.body)
    ? response.body
    : Buffer.from(response.body ?? "")
  if (body.byteLength > maxBytes) {
    const error = crawlerError("response_too_large")
    error.networkEvent = {
      phase,
      url: target.url,
      hostname: target.hostname,
      status: response.status,
      receivedBytes: body.byteLength,
      contentSha256: contentHash(body),
      error: error.code,
    }
    throw error
  }
  return {
    response: { ...response, body },
    event: {
      phase,
      url: target.url,
      hostname: target.hostname,
      status: response.status,
      receivedBytes: body.byteLength,
      contentSha256: contentHash(body),
    },
  }
}

async function fetchRobots(state, providerUrl) {
  const origin = new URL(providerUrl).origin
  if (state.robots.has(origin)) return state.robots.get(origin)
  let currentUrl = robotsUrlFor(providerUrl)
  const networkEvents = []
  let response = null
  let status = "robots_unreachable"
  let decision = { allowed: false, reason: status, crawlDelayMs: 0 }
  try {
    for (let redirectCount = 0; ; redirectCount += 1) {
      if (redirectCount > state.policy.maxRedirects) {
        throw crawlerError("redirect_limit")
      }
      const result = await networkRequest(state, {
        url: currentUrl,
        maxBytes: state.policy.maxRobotsBytes,
        phase: "robots",
        delayMs: 1_000,
      })
      response = result.response
      networkEvents.push(result.event)
      const target = redirectTarget(response, currentUrl)
      if (!target) break
      currentUrl = target
    }
    decision = evaluateRobotsResponse({
      status: response.status,
      body: response.body.toString("utf8"),
      url: providerUrl,
      userAgent: state.policy.userAgent,
    })
    status = decision.allowed ? "allowed" : "denied"
  } catch (error) {
    if (error.fatal) throw error
    if (error.networkEvent) networkEvents.push(error.networkEvent)
    status = outcome(error)
    decision = { allowed: false, reason: status, crawlDelayMs: 0 }
  }
  const result = { ...decision, status }
  state.robots.set(origin, result)
  await recordReceipt(state, {
    receiptType: "robots",
    requestId: `robots-${sha256(robotsUrlFor(providerUrl)).slice(0, 20)}`,
    sourceUrl: robotsUrlFor(providerUrl),
    finalUrl: currentUrl,
    status,
    robotsDecision: result,
    networkEvents,
    retainedBytes: 0,
    finishedAt: state.now(),
  })
  return result
}

async function fetchProvider(state, request) {
  let currentUrl = request.url
  const networkEvents = []
  let response = null
  try {
    for (let redirectCount = 0; ; redirectCount += 1) {
      if (redirectCount > state.policy.maxRedirects) {
        throw crawlerError("redirect_limit")
      }
      const robots = await fetchRobots(state, currentUrl)
      if (!robots.allowed) throw crawlerError("robots_denied")
      const hostname = new URL(currentUrl).hostname.toLowerCase()
      const hostRequests = state.hostRequests.get(hostname) ?? 0
      if (hostRequests >= state.policy.maxRequestsPerHost) {
        throw crawlerError("host_budget_exhausted")
      }
      const result = await networkRequest(state, {
        url: currentUrl,
        maxBytes: state.policy.maxPageBytes,
        phase: "provider",
        delayMs: robots.crawlDelayMs,
      })
      state.hostRequests.set(hostname, hostRequests + 1)
      response = result.response
      networkEvents.push(result.event)
      const target = redirectTarget(response, currentUrl)
      if (!target) break
      currentUrl = target
    }
    if (response.status < 200 || response.status >= 300) {
      throw crawlerError(`http_${response.status}`)
    }
    const contentType = headerValue(response.headers, "content-type")
    if (!isAllowedPageContentType(contentType)) {
      throw crawlerError("unsupported_content_type")
    }
    const html = response.body.toString("utf8")
    const evidence = extractSourcePageEvidence({
      body: html,
      contentType,
      url: currentUrl,
    })
    const signals = isHtmlContentType(contentType)
      ? extractProviderPageSignals({ html, url: currentUrl })
      : null
    const retainedBytes = Buffer.byteLength(
      JSON.stringify({ evidence, signals }),
      "utf8"
    )
    if (
      state.retainedBytes + retainedBytes >
      state.policy.retainedByteBudget
    ) {
      throw crawlerError("retained_byte_budget_exhausted")
    }
    return recordReceipt(state, {
      receiptType: "provider",
      requestId: request.requestId,
      consumers: request.consumers,
      sourceUrl: request.url,
      finalUrl: currentUrl,
      status: "fetched",
      httpStatus: response.status,
      contentType,
      evidence,
      signals,
      networkEvents,
      retainedBytes,
      finishedAt: state.now(),
    })
  } catch (error) {
    if (error.fatal) throw error
    if (error.networkEvent) networkEvents.push(error.networkEvent)
    return recordReceipt(state, {
      receiptType: "provider",
      requestId: request.requestId,
      consumers: request.consumers,
      sourceUrl: request.url,
      finalUrl: currentUrl,
      status: outcome(error),
      evidence: null,
      signals: null,
      networkEvents,
      retainedBytes: 0,
      finishedAt: state.now(),
    })
  }
}

export function buildOwnedCrawlerDryRun(plan) {
  validateIrsEoOwnedFetchPlan(plan)
  return {
    schemaVersion: 1,
    kind: "irs_eo_owned_crawler_report",
    dryRun: true,
    packageId: plan.packageId,
    planHash: plan.planHash,
    counts: {
      providerRequests: plan.requests.length,
      plannedNetworkRequests: plan.counts.plannedNetworkRequests,
      networkRequests: 0,
      retainedBytes: 0,
      paidQueries: 0,
      aiCalls: 0,
      databaseWrites: 0,
      reviewed: 0,
      published: 0,
    },
    publicDisplayEligible: false,
    publicationBlocked: true,
  }
}

export async function runIrsEoOwnedCrawler(
  plan,
  {
    parentPlan,
    existingReceipts = [],
    transport = createNodeCrawlerTransport(),
    resolveHostname,
    now = () => new Date().toISOString(),
    clock = () => Date.now(),
    sleep = (milliseconds) =>
      new Promise((resolve) => setTimeout(resolve, milliseconds)),
    onReceipt,
  } = {}
) {
  validateIrsEoOwnedExecutionContract(plan, parentPlan)
  const initialReceiptHash = validateOwnedCrawlerReceiptChain(
    existingReceipts,
    plan.planHash
  )
  const completed = new Set(
    existingReceipts
      .filter(({ receiptType }) => receiptType === "provider")
      .map(({ requestId }) => requestId)
  )
  const robots = new Map()
  const hostRequests = new Map()
  let existingNetworkRequests = 0
  let existingRetainedBytes = 0
  for (const receipt of existingReceipts) {
    existingNetworkRequests += receipt.networkEvents?.length ?? 0
    existingRetainedBytes += receipt.retainedBytes ?? 0
    if (receipt.receiptType === "robots") {
      robots.set(new URL(receipt.sourceUrl).origin, receipt.robotsDecision)
    }
    for (const event of receipt.networkEvents ?? []) {
      if (event.phase !== "provider") continue
      hostRequests.set(
        event.hostname,
        (hostRequests.get(event.hostname) ?? 0) + 1
      )
    }
  }
  const state = {
    plan,
    policy: plan.executionPolicy,
    existingReceipts,
    receipts: [],
    initialReceiptHash,
    networkRequests: existingNetworkRequests,
    retainedBytes: existingRetainedBytes,
    transport,
    resolveHostname,
    now,
    clock,
    sleep,
    onReceipt,
    robots,
    hostRequests,
    lastHostRequestAt: new Map(),
  }
  for (const request of plan.requests) {
    if (!completed.has(request.requestId)) await fetchProvider(state, request)
  }

  const allReceipts = [...existingReceipts, ...state.receipts]
  const manifestBody = {
    schemaVersion: 1,
    kind: "irs_eo_owned_crawl_manifest",
    packageId: plan.packageId,
    planHash: plan.planHash,
    receiptHashes: allReceipts.map(({ receiptHash: hash }) => hash),
    counts: {
      receipts: allReceipts.length,
      providerRequests: plan.requests.length,
      providerTerminal: allReceipts.filter(
        ({ receiptType }) => receiptType === "provider"
      ).length,
      fetched: allReceipts.filter(({ status }) => status === "fetched").length,
      networkRequests: state.networkRequests,
      retainedBytes: state.retainedBytes,
      paidQueries: 0,
      aiCalls: 0,
      databaseWrites: 0,
      reviewed: 0,
      published: 0,
    },
    publicDisplayEligible: false,
    publicationBlocked: true,
  }
  return {
    receipts: state.receipts,
    manifest: {
      ...manifestBody,
      manifestHash: sha256(stableJson(manifestBody)),
    },
  }
}
