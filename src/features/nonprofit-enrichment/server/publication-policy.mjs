import { isIP } from "node:net"
import { FIELDS, stable } from "./store.mjs"
import { identityName } from "./source-inventory.mjs"
import { assessAuditAddress } from "./audit-addresses.mjs"
import {
  assessRetained,
  pageRejection,
  phoneDigits,
  VERIFICATION_RULE,
} from "./verification.mjs"
import { normalizeAcquisitionUrl } from "../../../../scripts/resource-map/lib/web-acquisition-policy.mjs"

export const AUDIT_POLICY = "nonprofit-directory-retained-audit-v1"
const reportedFields = ["website", "phone", "description", "filing_address"]
const hold = (reason, state = "candidate") => ({
  eligible: false,
  state,
  basis: null,
  reason,
})
const parse = (value) => {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}
const host = (value) => {
  try {
    return new URL(value).hostname.replace(/^www\./, "")
  } catch {
    return null
  }
}
export function reportedWebsite(value) {
  if (typeof value !== "string") return null
  const url = normalizeAcquisitionUrl(
    /^https?:\/\//i.test(value.trim())
      ? value.trim()
      : `https://${value.trim()}`
  )
  if (!url) return null
  const u = new URL(url)
  if (
    url.length > 2048 ||
    !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(u.hostname) ||
    isIP(u.hostname) ||
    !u.hostname.includes(".") ||
    u.port ||
    /(?:^|\.)(?:localhost|local|internal|test|invalid|example|onion)$/.test(
      u.hostname
    ) ||
    /^(?:example\.(?:com|org|net))$/.test(u.hostname) ||
    u.hostname.startsWith("[")
  )
    return null
  return url
}

function latestFilings(filings, now) {
  const dated = filings.filter(
    (f) =>
      /^\d{4}-\d{2}-\d{2}$/.test(f.tax_period_end ?? "") &&
      Number.isFinite(Date.parse(f.tax_period_end)) &&
      Date.parse(f.tax_period_end) <= now
  )
  const period = dated
    .map((f) => f.tax_period_end)
    .sort()
    .at(-1)
  const latest = dated.filter((f) => f.tax_period_end === period)
  const amended = latest.filter((f) => /^(?:1|true|x)$/i.test(f.amended ?? ""))
  return amended.length ? amended : latest
}

function normalizeField(field, value) {
  if (field === "website") return reportedWebsite(value)
  if (field === "phone") {
    const digits = phoneDigits(value)
    return digits ? `+1${digits}` : null
  }
  if (field === "description")
    return typeof value === "string" && value.trim()
      ? value.trim().slice(0, 1000)
      : null
  return value && typeof value === "object" ? value : null
}

function supportedObservation(e, filing, field) {
  const body = parse(e.body),
    detail = parse(body?.evidence)
  return (
    e.field === field &&
    body?.method === "irs990_xml_exact_ein_v1" &&
    body.license === "irs_public_filing" &&
    body.source_type === "irs990" &&
    detail?.sourceSha256 === filing.source_sha256 &&
    e.source_url === filing.source_url &&
    stable(parse(e.value)) === stable(filing.fields[field]) &&
    stable(detail.value) === stable(filing.fields[field])
  )
}

function assessReported(field, latest, evidence, quarantines) {
  if (!latest.length)
    return hold(
      "no_proven_dated_filing",
      evidence.length ? "candidate" : "unknown"
    )
  if (latest.some((f) => f.fields[field] == null))
    return hold("latest_filing_missing_field")
  // Compare full values before excerpting descriptions so truncation cannot hide conflicts.
  const rawValues = latest.map((f) =>
    field === "description"
      ? f.fields[field]
      : normalizeField(field, f.fields[field])
  )
  if (new Set(rawValues.map(stable)).size !== 1)
    return hold("conflicting_latest_filings", "conflicting")
  const value = normalizeField(field, latest[0].fields[field])
  if (!value) return hold("invalid_field_format")
  if (
    field === "website" &&
    quarantines.some((q) => host(q.source_url) === host(value))
  )
    return hold("website_quarantined", "conflicting")
  const supported = latest.map((f) =>
    evidence.filter((e) => supportedObservation(e, f, field))
  )
  if (supported.some((observations) => !observations.length))
    return hold("missing_proven_retained_assertion")
  if (supported.flat().some((e) => e.state === "conflicting"))
    return hold("retained_conflict", "conflicting")
  if (
    supported.some(
      (observations) =>
        !observations.some((e) => ["candidate", "verified"].includes(e.state))
    )
  )
    return hold("retained_assertion_unavailable")
  return {
    eligible: true,
    state: "verified",
    basis: "source_reported",
    reason: "exact_ein_filing_value_reconciled",
    value,
    evidenceIds: supported
      .flat()
      .map((e) => e.id)
      .sort(),
    sourceIds: latest.map((f) => f.sourceId).sort(),
    sourceUrls: latest.map((f) => f.source_url).sort(),
    sourcePeriod: latest[0].tax_period_end,
    currentProviderConfirmed: false,
  }
}

// Existing public identities need only a field decision, not another BMF audit.
export function assessFilingFields({ filings, evidence, quarantines = [], now }) {
  const latest = latestFilings(filings, now)
  return Object.fromEntries(
    ["website", "phone", "description"].map((field) => [
      field,
      assessReported(
        field,
        latest,
        evidence.filter((e) => e.field === field),
        quarantines
      ),
    ])
  )
}

function applyExistingVerification(
  decisions,
  identity,
  evidence,
  filings,
  pages,
  quarantines,
  now
) {
  for (const receipt of pages) {
    if (quarantines.some((q) => host(q.source_url) === host(receipt.finalUrl)))
      continue
    const assessment = assessRetained(identity, receipt, filings, now)
    if (!assessment.verified) continue
    for (const field of ["website", "phone"]) {
      const decision = decisions[field]
      if (!decision.eligible || decision.value !== assessment[field]) continue
      const proof = evidence.find((e) => {
        const body = parse(e.body),
          detail = parse(body?.evidence)
        return (
          e.field === field &&
          e.state === "verified" &&
          body?.method === VERIFICATION_RULE &&
          detail?.pageSha256 === receipt.evidence?.contentSha256 &&
          detail?.filingSha256 === assessment.filing.source_sha256 &&
          detail.ein === identity.ein &&
          e.source_url === receipt.finalUrl &&
          parse(e.value) === assessment[field]
        )
      })
      if (!proof) continue
      decisions[field] = {
        ...decision,
        basis: "provider_confirmed",
        currentProviderConfirmed: true,
        reason: VERIFICATION_RULE,
        evidenceIds: [...decision.evidenceIds, proof.id],
        confirmedAt: receipt.finishedAt,
      }
    }
  }
}

export function assessOrganization({
  row,
  source,
  bmfRows = [],
  filings = [],
  evidence = [],
  pages = [],
  quarantines = [],
  now,
}) {
  quarantines = [
    ...quarantines,
    ...pages
      .filter((p) => pageRejection(p))
      .map((p) => ({ source_url: p.finalUrl })),
  ]
  const identity = parse(row.identity) ?? {},
    latest = latestFilings(filings, now)
  const reasons = []
  if (
    !/^\d{9}$/.test(row.ein) ||
    row.ein === "000000000" ||
    identity.ein !== row.ein ||
    !identityName(identity.organizationName)
  )
    reasons.push("invalid_identity")
  if (!source?.completed || source.integrity !== "matched")
    reasons.push("identity_source_integrity_or_completion")
  if (!bmfRows.length) reasons.push("identity_not_matched_to_BMF")
  else if (bmfRows.length > 50) reasons.push("BMF_identity_match_overflow")
  else if (
    bmfRows.some((b) => b.name !== identityName(identity.organizationName))
  )
    reasons.push("BMF_legal_name_conflict")
  if (identity.suppressed || identity.suppressedAt || identity.confidential)
    reasons.push("local_suppression_or_confidentiality")
  const directoryEligible = reasons.length === 0
  const decisions = Object.fromEntries(
    FIELDS.map((field) => [
      field,
      hold(
        evidence.some((e) => e.field === field)
          ? "field_policy_or_provider_evidence_pending"
          : "no_retained_evidence",
        evidence.some((e) => e.field === field) ? "candidate" : "unknown"
      ),
    ])
  )
  for (const field of reportedFields)
    decisions[field] = assessReported(
      field,
      latest,
      evidence.filter((e) => e.field === field),
      quarantines
    )
  applyExistingVerification(
    decisions,
    identity,
    evidence,
    latest,
    pages,
    quarantines,
    now
  )
  const rawAddresses = new Set(bmfRows.map((b) => stable(b.address)))
  if (
    !decisions.filing_address.eligible &&
    decisions.filing_address.state !== "conflicting" &&
    directoryEligible &&
    rawAddresses.size === 1
  ) {
    decisions.filing_address = {
      eligible: true,
      state: "verified",
      basis: "source_reported",
      reason: "BMF_address_exact_identity_join",
      value: bmfRows[0].address,
      sourceIds: [...new Set(bmfRows.map((b) => b.sourceId))],
      sourcePeriod: null,
      currentProviderConfirmed: false,
    }
  }
  let address = assessAuditAddress(
    decisions.filing_address.eligible ? decisions.filing_address.value : null,
    {
      ...identity,
      inCareOf: identity.inCareOf || bmfRows.find((b) => b.inCareOf)?.inCareOf,
    }
  )
  if (!directoryEligible)
    address = {
      ...address,
      geocodeCandidate: false,
      reason: "directory_identity_held",
    }
  if (!decisions.filing_address.eligible)
    address = {
      ...address,
      geocodeCandidate: false,
      reason: decisions.filing_address.reason,
    }
  return {
    ein: row.ein,
    policy: AUDIT_POLICY,
    directory: {
      eligible: directoryEligible,
      reasons,
      basis: "source_reported_registry_identity",
      name: identity.organizationName ?? null,
      sourceRows: bmfRows.map((b) => ({
        sourceId: b.sourceId,
        row: b.sourceRow,
        rowHash: b.rowHash,
      })),
      reportedStatusCodes: [...new Set(bmfRows.map((b) => b.statusCode))],
      operatingStatus: "unknown",
      liveSuppressionChecked: false,
      readyToPublish: false,
      remainingReleaseGates: [
        "directory_publisher_and_serving_path",
        "live_suppression_owner_and_duplicate_preflight",
        "release_validation",
      ],
    },
    organizationClassification: {
      nteeCodes: [...new Set(bmfRows.map((b) => b.nteeCode).filter(Boolean))],
      basis: "source_reported",
      provesServices: false,
    },
    fields: decisions,
    location: address,
    services: {
      eligible: false,
      reason:
        "provider_service_verification_and_approval_not_established_in_this_ledger",
    },
    candidateEnriched: evidence.some(
      (e) =>
        e.field !== "filing_address" &&
        ["candidate", "verified"].includes(e.state)
    ),
    publicWrites: 0,
  }
}
