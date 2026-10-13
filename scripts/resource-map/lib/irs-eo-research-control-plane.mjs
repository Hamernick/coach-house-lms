import { readString, sha256 } from "./data-engine/shared.mjs"
import { normalizeIrsEin } from "./irs-eo-acquisition.mjs"

export const IRS_EO_RESEARCH_EVENT_SCHEMA_VERSION = 1
export const IRS_EO_RESEARCH_POLICY_VERSION = "resource-map-enrichment-v1"

export const IRS_EO_RESEARCH_ACTIVE_STATES = Object.freeze([
  "unseen",
  "discovered",
  "identity_resolved",
  "sources_fetched",
  "evidence_extracted",
  "entity_resolved",
  "enriched",
  "independently_verified",
  "batch_ready",
  "curated_preview",
  "approved",
  "published",
])

export const IRS_EO_RESEARCH_EXCEPTION_STATES = Object.freeze([
  "duplicate",
  "no_public_presence",
  "inactive",
  "not_public_service",
  "blocked_by_robots",
  "unreachable",
  "conflict",
  "needs_human",
])

const ALL_STATES = new Set([
  ...IRS_EO_RESEARCH_ACTIVE_STATES,
  ...IRS_EO_RESEARCH_EXCEPTION_STATES,
])

const TRANSITIONS = Object.freeze({
  unseen: ["discovered"],
  discovered: [
    "identity_resolved",
    "duplicate",
    "inactive",
    "no_public_presence",
    "conflict",
    "needs_human",
  ],
  identity_resolved: [
    "sources_fetched",
    "no_public_presence",
    "inactive",
    "not_public_service",
    "blocked_by_robots",
    "unreachable",
    "conflict",
    "needs_human",
  ],
  sources_fetched: [
    "evidence_extracted",
    "not_public_service",
    "conflict",
    "needs_human",
  ],
  evidence_extracted: [
    "entity_resolved",
    "not_public_service",
    "conflict",
    "needs_human",
  ],
  entity_resolved: ["enriched", "duplicate", "conflict", "needs_human"],
  enriched: ["independently_verified", "conflict", "needs_human"],
  independently_verified: ["batch_ready", "conflict", "needs_human"],
  batch_ready: ["curated_preview", "conflict", "needs_human"],
  curated_preview: ["approved", "conflict", "needs_human"],
  approved: ["published", "conflict"],
  published: [],
  duplicate: [],
  no_public_presence: ["discovered"],
  inactive: ["discovered"],
  not_public_service: ["discovered"],
  blocked_by_robots: ["identity_resolved"],
  unreachable: ["identity_resolved"],
  conflict: ["discovered", "identity_resolved"],
  needs_human: ["discovered", "identity_resolved"],
})

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (!value || typeof value !== "object") return value
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonicalize(value[key])])
  )
}

export function stableJson(value) {
  return JSON.stringify(canonicalize(value))
}

export function isIrsEoResearchTransitionAllowed(fromState, toState) {
  return TRANSITIONS[fromState]?.includes(toState) ?? false
}

function normalizeEvidenceRef(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Research evidence references must be objects.")
  }
  const kind = readString(value.kind)
  const contentHash = readString(value.contentHash)?.toLowerCase()
  if (!kind) throw new Error("Research evidence requires a kind.")
  if (!/^[a-f0-9]{64}$/u.test(contentHash ?? "")) {
    throw new Error("Research evidence requires a SHA-256 content hash.")
  }
  return {
    kind,
    contentHash,
    sourceUrl: readString(value.sourceUrl),
    sourceRecordId: readString(value.sourceRecordId),
  }
}

export function buildIrsEoResearchEvent({
  ein,
  fromState,
  toState,
  evidenceRefs,
  inputHash,
  observedAt,
  reason = null,
  policyVersion = IRS_EO_RESEARCH_POLICY_VERSION,
  actor = "resource_map_enrichment",
}) {
  const normalizedEin = normalizeIrsEin(ein)
  if (!normalizedEin)
    throw new Error("Research events require a nine-digit EIN.")
  if (!ALL_STATES.has(fromState) || !ALL_STATES.has(toState)) {
    throw new Error(
      `Unsupported research transition: ${fromState} -> ${toState}.`
    )
  }
  if (!isIrsEoResearchTransitionAllowed(fromState, toState)) {
    throw new Error(
      `Research transition is not allowed: ${fromState} -> ${toState}.`
    )
  }
  const normalizedInputHash = readString(inputHash)?.toLowerCase()
  if (!/^[a-f0-9]{64}$/u.test(normalizedInputHash ?? "")) {
    throw new Error("Research events require a SHA-256 input hash.")
  }
  const timestamp = readString(observedAt)
  if (!timestamp || Number.isNaN(Date.parse(timestamp))) {
    throw new Error("Research events require a valid observedAt timestamp.")
  }
  const normalizedEvidence = Array.isArray(evidenceRefs)
    ? evidenceRefs.map(normalizeEvidenceRef)
    : []
  if (normalizedEvidence.length === 0) {
    throw new Error(
      "Research transitions require at least one evidence reference."
    )
  }

  const idempotencyKey = sha256(
    stableJson({
      ein: normalizedEin,
      fromState,
      inputHash: normalizedInputHash,
      policyVersion,
      toState,
    })
  )
  const eventBody = {
    schemaVersion: IRS_EO_RESEARCH_EVENT_SCHEMA_VERSION,
    kind: "irs_eo_research_event",
    ein: normalizedEin,
    fromState,
    toState,
    observedAt: new Date(timestamp).toISOString(),
    actor,
    policyVersion,
    inputHash: normalizedInputHash,
    idempotencyKey,
    evidenceRefs: normalizedEvidence,
    reason: readString(reason),
    publicDisplayEligible: false,
    publicationBlocked: true,
  }

  return {
    ...eventBody,
    eventHash: sha256(stableJson(eventBody)),
  }
}

export function replayIrsEoResearchEvents(events) {
  const projections = new Map()
  const seenIdempotencyKeys = new Map()

  for (const event of events) {
    const expected = buildIrsEoResearchEvent(event)
    if (event.eventHash !== expected.eventHash) {
      throw new Error(`Research event hash mismatch for EIN ${expected.ein}.`)
    }
    const priorHash = seenIdempotencyKeys.get(expected.idempotencyKey)
    if (priorHash) {
      if (priorHash !== expected.eventHash) {
        throw new Error(
          `Research idempotency collision for EIN ${expected.ein}.`
        )
      }
      continue
    }

    const current = projections.get(expected.ein) ?? {
      ein: expected.ein,
      state: "unseen",
      eventCount: 0,
      evidenceHashes: [],
    }
    if (current.state !== expected.fromState) {
      throw new Error(
        `Research event sequence mismatch for EIN ${expected.ein}: expected ${current.state}, received ${expected.fromState}.`
      )
    }

    seenIdempotencyKeys.set(expected.idempotencyKey, expected.eventHash)
    projections.set(expected.ein, {
      ein: expected.ein,
      state: expected.toState,
      eventCount: current.eventCount + 1,
      lastEventHash: expected.eventHash,
      lastObservedAt: expected.observedAt,
      evidenceHashes: [
        ...new Set([
          ...current.evidenceHashes,
          ...expected.evidenceRefs.map((evidence) => evidence.contentHash),
        ]),
      ],
      publicDisplayEligible: false,
      publicationBlocked: true,
    })
  }

  return projections
}

export function buildIrsEoIdentityEvents(candidate, observedAt) {
  const inputHash = sha256(stableJson(candidate))
  const evidenceRefs = [
    {
      kind: "irs_eo_bmf_identity",
      contentHash: inputHash,
      sourceRecordId: candidate.discoveryId ?? `irs-eo:${candidate.ein}`,
    },
  ]
  const discovered = buildIrsEoResearchEvent({
    ein: candidate.ein,
    fromState: "unseen",
    toState: "discovered",
    evidenceRefs,
    inputHash,
    observedAt,
    reason: "IRS EO identity row admitted to the private research cohort.",
  })
  const identityResolved = buildIrsEoResearchEvent({
    ein: candidate.ein,
    fromState: "discovered",
    toState: "identity_resolved",
    evidenceRefs,
    inputHash,
    observedAt,
    reason: "Nine-digit EIN and IRS identity fields normalized.",
  })
  return [discovered, identityResolved]
}
