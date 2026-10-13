import { execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { addEvidence } from "./queue.mjs"
import { event, hash, stable, transaction, utc } from "./store.mjs"
import { normalizeAcquisitionUrl } from "../../../../scripts/resource-map/lib/web-acquisition-policy.mjs"

export const VERIFICATION_RULE = "recent_irs_domain_name_phone_v1"
const normalizeName = (name) =>
  String(name ?? "")
    .toLowerCase()
    .replace(/\b(?:incorporated|inc|corporation|corp|llc|ltd)\.?\s*$/i, "")
    .replace(/[^a-z0-9]/g, "")
export const phoneDigits = (value) => {
  const digits = String(value ?? "")
    .replace(/\D/g, "")
    .replace(/^1(?=\d{10}$)/, "")
  return /^[2-9]\d{2}[2-9]\d{6}$/.test(digits) ? digits : null
}
const website = (value) =>
  normalizeAcquisitionUrl(
    /^[\w.-]+\.[a-z]{2,}(?:[/:?#].*)?$/i.test(value ?? "")
      ? `https://${value}`
      : value
  )
const host = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return null
  }
}
export function pageRejection(receipt) {
  const title = receipt.evidence?.pageTitle ?? ""
  const text = receipt.evidence?.textExcerpt ?? ""
  if (
    (/\b(?:domain|\.com|\.org|\.net)\b.*\bfor sale\b/i.test(title) ||
      /this domain is for sale/i.test(text)) &&
    /buy now|payment plan|domain (?:name|expert)|hugedomains/i.test(text)
  )
    return "domain_for_sale"
  return null
}
export function assessRetained(identity, receipt, filings, now = Date.now()) {
  const reject = pageRejection(receipt)
  if (reject) return { verified: false, reason: reject, quarantined: true }
  if (
    receipt.status !== "fetched" ||
    now - Date.parse(receipt.finishedAt) > 30 * 86400_000 ||
    Date.parse(receipt.finishedAt) > now ||
    !Number.isFinite(Date.parse(receipt.finishedAt))
  )
    return { verified: false, reason: "page_not_current" }
  const name = normalizeName(identity.organizationName)
  if (
    name.length < 8 ||
    !normalizeName(receipt.evidence?.textExcerpt).includes(name)
  )
    return { verified: false, reason: "legal_name_not_supported_on_page" }
  const fresh = filings
    .filter(
      (f) =>
        f.ein === identity.ein &&
        Number.isFinite(Date.parse(f.tax_period_end)) &&
        Date.parse(f.tax_period_end) <= now &&
        now - Date.parse(f.tax_period_end) <= 730 * 86400_000
    )
    .sort((a, b) => b.tax_period_end.localeCompare(a.tax_period_end))
  if (!fresh.length)
    return {
      verified: false,
      reason: "no_recent_filing_with_website_and_phone",
    }
  const latest = fresh.filter(
    (f) => f.tax_period_end === fresh[0].tax_period_end
  )
  if (latest.some((f) => !f.fields?.website || !f.fields?.phone))
    return { verified: false, reason: "latest_filing_missing_contact_fields" }
  const distinct = new Set(
    latest.map(
      (f) => `${website(f.fields.website)}|${phoneDigits(f.fields.phone)}`
    )
  )
  if (distinct.size !== 1)
    return { verified: false, reason: "conflicting_latest_filing_contacts" }
  const filing = latest[0],
    url = website(filing.fields.website),
    phone = phoneDigits(filing.fields.phone)
  if (
    !url ||
    !phone ||
    host(url) !== host(receipt.finalUrl) ||
    host(url) !== host(receipt.sourceUrl)
  )
    return { verified: false, reason: "filing_domain_or_phone_not_supported" }
  const observed = (receipt.signals?.contacts ?? [])
    .filter((c) => c.type === "phone")
    .map((c) => phoneDigits(c.value))
  if (!observed.includes(phone))
    return {
      verified: false,
      reason: "filing_phone_not_found_on_provider_page",
    }
  return {
    verified: true,
    reason: VERIFICATION_RULE,
    website: url,
    phone: `+1${phone}`,
    filing,
  }
}
function trustedFilings(db, ein) {
  const sources = db
    .prepare(
      `SELECT DISTINCT s.path,s.sha256 FROM sources s JOIN events e ON json_extract(e.body,'$.sourceId')=s.id
    WHERE e.ein=? AND e.kind='filing_imported' AND s.kind='irs990' AND s.completed=1 ORDER BY s.observed_at DESC LIMIT 6`
    )
    .all(ein)
  if (!sources.length || sources.length > 5) return []
  const parsed = execFileSync(
    "python3",
    [fileURLToPath(new URL("./parse-filings.py", import.meta.url))],
    {
      input: sources.map((s) => JSON.stringify(s.path)).join("\n") + "\n",
      encoding: "utf8",
      timeout: 30000,
      maxBuffer: 8_000_000,
    }
  )
    .trim()
    .split("\n")
    .filter(Boolean)
    .map(JSON.parse)
  const valid = parsed.filter(
    (f) =>
      !f.error &&
      f.ein === ein &&
      sources.some((s) => s.sha256 === f.source_sha256) &&
      f.source_url.startsWith("https://apps.irs.gov/pub/epostcard/990/xml/")
  )
  return valid.length === sources.length ? valid : []
}
export function quarantinePage(db, ein, receipt, reason) {
  const affected = db
    .prepare(
      "SELECT id,state FROM evidence WHERE ein=? AND source_url=? AND state IN ('candidate','verified')"
    )
    .all(ein, receipt.finalUrl)
  db.prepare(
    "UPDATE evidence SET state='conflicting' WHERE ein=? AND source_url=? AND state IN ('candidate','verified')"
  ).run(ein, receipt.finalUrl)
  const key = `quarantine:${hash({ ein, url: receipt.finalUrl, content: receipt.evidence?.contentSha256 })}`
  if (!db.prepare("SELECT id FROM runs WHERE id=?").get(key)) {
    const body = {
      ein,
      source_url: receipt.finalUrl,
      reason,
      affected,
      publicationBlocked: true,
    }
    db.prepare("INSERT INTO runs VALUES (?,?,?,?)").run(
      key,
      "source_quarantine",
      stable(body),
      utc()
    )
    event(db, ein, "source_quarantined", body)
  }
}
export function verifyRetained(db, ein) {
  const row = db
    .prepare("SELECT identity FROM organizations WHERE ein=?")
    .get(ein)
  if (!row) throw new Error("Unknown EIN")
  const identity = JSON.parse(row.identity)
  const pages = db
    .prepare(
      `SELECT DISTINCT p.body,p.fetched_at FROM pages p JOIN evidence e ON e.source_url=json_extract(p.body,'$.finalUrl')
    WHERE e.ein=? AND p.expires_at>? ORDER BY p.fetched_at DESC LIMIT 5`
    )
    .all(ein, Date.now())
    .map((r) => JSON.parse(r.body))
  const filings = trustedFilings(db, ein)
  const results = []
  for (const receipt of pages) {
    const assessment = assessRetained(identity, receipt, filings)
    const id = `verification:${hash({ rule: VERIFICATION_RULE, ein, page: receipt.evidence?.contentSha256, filings: filings.map((f) => f.source_sha256).sort(), decision: assessment.reason })}`
    const existing = db.prepare("SELECT body FROM runs WHERE id=?").get(id)
    const outcome = {
      ein,
      source_url: receipt.finalUrl,
      verified: assessment.verified,
      reason: assessment.reason,
      publicationBlocked: true,
    }
    transaction(db, () => {
      if (assessment.quarantined)
        quarantinePage(db, ein, receipt, assessment.reason)
      if (!assessment.verified) {
        const changed = db
          .prepare(
            "UPDATE evidence SET state='conflicting' WHERE ein=? AND source_url=? AND state='verified' AND json_extract(body,'$.method')=?"
          )
          .run(ein, receipt.finalUrl, VERIFICATION_RULE)
        if (changed.changes)
          event(db, ein, "verification_withdrawn", {
            source_url: receipt.finalUrl,
            reason: assessment.reason,
            assertions: changed.changes,
          })
      }
      if (assessment.verified) {
        const evidence = stable({
          rule: VERIFICATION_RULE,
          ein,
          organizationName: identity.organizationName,
          filingUrl: assessment.filing.source_url,
          filingSha256: assessment.filing.source_sha256,
          taxPeriodEnd: assessment.filing.tax_period_end,
          pageUrl: receipt.finalUrl,
          pageSha256: receipt.evidence.contentSha256,
          pageExcerpt: (receipt.evidence?.textExcerpt ?? "").slice(0, 8000),
          matchedPhone: assessment.phone,
        })
        for (const field of ["website", "phone"]) {
          const assertionId = addEvidence(
            db,
            ein,
            {
              field,
              value: assessment[field],
              source_url: receipt.finalUrl,
              observed_at: receipt.finishedAt,
              evidence,
              source_type: "irs_and_provider",
              method: VERIFICATION_RULE,
              license: "source_specific; factual_contact_assertion",
            },
            { trustedState: "verified" }
          )
          db.prepare("UPDATE evidence SET state='verified' WHERE id=?").run(
            assertionId
          )
          db.prepare("DELETE FROM unresolved WHERE ein=? AND field=?").run(
            ein,
            field
          )
        }
      }
      db.prepare("INSERT OR IGNORE INTO runs VALUES (?,?,?,?)").run(
        id,
        "field_verification",
        stable(outcome),
        utc()
      )
      if (!existing) event(db, ein, "fields_verified_or_held", outcome)
    })
    results.push({ ...outcome, replayed: Boolean(existing) })
  }
  return {
    ein,
    pagesChecked: pages.length,
    verified: results.some((r) => r.verified),
    results,
    publicationBlocked: true,
  }
}
