import { mkdirSync, openSync, closeSync, writeSync, fsyncSync } from "node:fs"
import { resolve, join } from "node:path"
import { createHash } from "node:crypto"
import { inventorySources, matchBmfSources } from "./source-inventory.mjs"
import { auditFilings } from "./audit-filings.mjs"
import { assessOrganization, AUDIT_POLICY } from "./publication-policy.mjs"
import { privateWrite } from "./artifacts.mjs"
import { hash, stable, utc } from "./store.mjs"
import { fileHash } from "./import.mjs"
import { auditContext } from "./audit-context.mjs"

const increment = (map, key) => {
  map[key] = (map[key] ?? 0) + 1
}

function countDecision(report, result) {
  report.organizations++
  if (result.candidateEnriched) report.candidateEnriched++
  if (result.directory.eligible) {
    report.directoryEligible++
    if (result.candidateEnriched) report.candidateEnrichedDirectoryEligible++
  } else
    for (const reason of result.directory.reasons)
      increment(report.directoryHolds, reason)
  if (result.location.geocodeCandidate) report.geocodeCandidates++
  increment(report.locationOutcomes, result.location.reason)
  let added = false,
    provider = false
  for (const [field, decision] of Object.entries(result.fields)) {
    const counts = (report.fields[field] ??= {
      sourceReported: 0,
      providerConfirmed: 0,
      held: 0,
      unknown: 0,
      reasons: {},
    })
    if (decision.eligible && result.directory.eligible) {
      increment(
        counts,
        decision.basis === "provider_confirmed"
          ? "providerConfirmed"
          : "sourceReported"
      )
      if (field !== "filing_address") added = true
      if (decision.basis === "provider_confirmed") provider = true
    } else {
      increment(counts, decision.state === "unknown" ? "unknown" : "held")
      increment(
        counts.reasons,
        result.directory.eligible ? decision.reason : "directory_identity_held"
      )
    }
  }
  if (added) report.organizationsWithEligibleNonAddressFields++
  if (provider) report.organizationsWithProviderConfirmedFields++
}

function markdownReport(report) {
  const lines = [
    "# Retained nonprofit publication audit",
    "",
    `Completed: ${report.completedAt}`,
    `Policy: ${report.policy}`,
    "",
    "All counts refer to this saved ledger snapshot. This audit made no network requests or public writes.",
    "",
    "| Outcome | Organizations |",
    "| --- | ---: |",
    `| Audited | ${report.organizations} |`,
    `| Directory identity eligible under the proposed registry policy | ${report.directoryEligible} |`,
    `| Previously candidate-enriched | ${report.candidateEnriched} |`,
    `| Candidate-enriched and directory identity eligible | ${report.candidateEnrichedDirectoryEligible} |`,
    `| Eligible non-address fields | ${report.organizationsWithEligibleNonAddressFields} |`,
    `| Provider-confirmed fields | ${report.organizationsWithProviderConfirmedFields} |`,
    `| Address candidates for geocoding and location review | ${report.geocodeCandidates} |`,
    "| Map pins established by this audit | 0 |",
    "| Approved actionable services established by this audit | 0 |",
    "| Published by this audit | 0 |",
    "",
    "Directory identity eligibility is not completed publication. The directory publisher/search path, live suppression/owner/duplicate checks and release validation remain required. These are not new evidence requirements for each IRS identity.",
    "",
    "Source-reported values are verified against their dated IRS filing, not confirmed current by a provider. Missing fields do not block registry identity eligibility. IRS classification is not a claim of current services. Address candidates still need geocoding and confidentiality/residential review; none is automatically a pin.",
    "",
    "| Field | Source reported | Provider confirmed | Held | Unknown |",
    "| --- | ---: | ---: | ---: | ---: |",
  ]
  for (const [field, c] of Object.entries(report.fields))
    lines.push(
      `| ${field} | ${c.sourceReported} | ${c.providerConfirmed} | ${c.held} | ${c.unknown} |`
    )
  lines.push("", "## Address outcomes", "")
  for (const [reason, count] of Object.entries(report.locationOutcomes))
    lines.push(`- ${reason}: ${count}`)
  lines.push(
    "",
    "## Evidence and reproduction",
    "",
    "- `eligibility.jsonl`: one decision per organization, evidence/source IDs and holds.",
    "- `sources.json`: retained-file integrity plus BMF source hashes and row accounting.",
    "- `filings.json`: exact-EIN XML reparse/provenance outcomes.",
    "- `report.json`: complete counts, reasons, input/output hashes and code revision.",
    "",
    "Local BMF origin is operator-supplied IRS-format data; no download receipt or release date was invented. File modification dates are not IRS snapshot dates. Raw evidence and these reports remain private.",
    ""
  )
  return lines.join("\n")
}

export async function auditPublication(
  db,
  {
    inputs,
    output,
    now = Date.now(),
    codeRevision = null,
    limit = 50000,
    after = "",
    onProgress = () => {},
  }
) {
  if (!output) throw new Error("A new private output directory is required")
  if (!inputs?.length) throw new Error("Local BMF --input paths required")
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 50000)
    throw new Error("Audit limit must be 1..50000")
  if (after !== "" && !/^\d{9}$/.test(after))
    throw new Error("Audit after must be a nine-digit EIN")
  const directory = resolve(output)
  // Never overwrite a finished or interrupted audit. The completion report is written last.
  mkdirSync(directory, { mode: 0o700 })
  const started = Date.now(),
    digest = createHash("sha256")
  let fd
  const shared = auditContext(db)
  if (shared && (shared.now !== now || hash(inputs) !== shared.inputsHash))
    throw new Error("Audit context inputs/time mismatch")
  if (!shared) db.exec("BEGIN")
  try {
    if (!shared) {
      const health = db.prepare("PRAGMA quick_check").get()
      if (Object.values(health)[0] !== "ok")
        throw new Error("Ledger integrity check failed")
    }
    const population = db
      .prepare("SELECT count(*) n FROM organizations")
      .get().n
    const wanted = new Set(
      db
        .prepare(
          "SELECT ein FROM organizations WHERE ein>? ORDER BY ein LIMIT ?"
        )
        .all(after, limit)
        .map((r) => r.ein)
    )
    const expected = wanted.size
    if (!expected) throw new Error("No organizations after audit cursor")
    const lastEin = [...wanted].at(-1)
    const hasMore = Boolean(
      db.prepare("SELECT 1 FROM organizations WHERE ein>? LIMIT 1").get(lastEin)
    )
    const inventory = shared?.inventory ?? (await inventorySources(db))
    const bmf = shared?.bmf ?? (await matchBmfSources(inputs, wanted))
    const filings = shared?.filings ?? auditFilings(db, inventory)
    privateWrite(join(directory, "sources.json"), {
      ledgerSources: inventory.entries,
      uniqueLedgerFiles: inventory.uniqueFiles,
      bmfSnapshots: bmf.snapshots,
    })
    privateWrite(join(directory, "filings.json"), filings.results)
    const report = {
      policy: AUDIT_POLICY,
      codeRevision,
      sharedContext: shared?.id ?? null,
      integrityScope: shared?.checkedTables ?? "whole_ledger",
      bmfMatchedRowsScope: shared
        ? "whole_source_context"
        : "selected_partition",
      asOf: new Date(now).toISOString(),
      startedAt: new Date(started).toISOString(),
      selection: {
        after,
        lastEin,
        limit,
        population,
        hasMore,
        nextAfter: hasMore ? lastEin : null,
      },
      organizations: 0,
      candidateEnriched: 0,
      directoryEligible: 0,
      candidateEnrichedDirectoryEligible: 0,
      organizationsWithEligibleNonAddressFields: 0,
      organizationsWithProviderConfirmedFields: 0,
      geocodeCandidates: 0,
      pinEligible: 0,
      serviceEligible: 0,
      readyToPublish: 0,
      publishedByAudit: 0,
      productionStateChecked: false,
      networkRequests: 0,
      modelCallsInAudit: 0,
      ledgerWrites: 0,
      directoryHolds: {},
      locationOutcomes: {},
      fields: {},
      sourceIntegrity: {},
      latestEventSequence: db.prepare("SELECT max(seq) n FROM events").get().n,
      artifactDirectory: directory,
    }
    for (const s of inventory.entries)
      increment(report.sourceIntegrity, s.integrity)
    const page = db.prepare(
      "SELECT * FROM organizations WHERE ein>? AND ein<=? ORDER BY ein LIMIT 500"
    )
    const evidence = db.prepare(
      "SELECT * FROM evidence WHERE ein=? ORDER BY field,id"
    )
    const pages = db.prepare(
      `SELECT DISTINCT p.body FROM pages p JOIN evidence e ON e.source_url=json_extract(p.body,'$.finalUrl') WHERE e.ein=?`
    )
    const quarantines = new Map()
    for (const { body } of db
      .prepare("SELECT body FROM runs WHERE kind='source_quarantine'")
      .iterate()) {
      const hold = JSON.parse(body)
      const list = quarantines.get(hold.ein) ?? []
      list.push(hold)
      quarantines.set(hold.ein, list)
    }
    fd = openSync(join(directory, "eligibility.jsonl"), "wx", 0o600)
    let cursor = after
    while (true) {
      const rows = page.all(cursor, lastEin)
      if (!rows.length) break
      for (const row of rows) {
        const assertions = evidence.all(row.ein),
          retainedPages = assertions.length
            ? pages.all(row.ein).map((p) => JSON.parse(p.body))
            : []
        const holds = quarantines.get(row.ein) ?? []
        digest.update(stable({ row, assertions, retainedPages, holds }) + "\n")
        const result = assessOrganization({
          row,
          source: inventory.byId.get(row.source_id),
          bmfRows: bmf.matches.get(row.ein),
          filings: filings.byEin.get(row.ein),
          evidence: assertions,
          pages: retainedPages,
          quarantines: holds,
          now,
        })
        countDecision(report, result)
        writeSync(fd, stable(result) + "\n")
      }
      cursor = rows.at(-1).ein
      if (report.organizations % 5000 === 0)
        onProgress({ audited: report.organizations, expected, cursor })
    }
    fsyncSync(fd)
    closeSync(fd)
    fd = undefined
    if (report.organizations !== expected)
      throw new Error("Audit population failed reconciliation")
    report.ledgerInputDigest = digest.digest("hex")
    report.sourceDigest = hash({
      retained: inventory.entries,
      bmf: bmf.snapshots,
    })
    report.outputHashes = {}
    for (const name of ["eligibility.jsonl", "sources.json", "filings.json"])
      report.outputHashes[name] = await fileHash(join(directory, name))
    report.completedAt = utc()
    report.elapsedSeconds = (Date.now() - started) / 1000
    report.maxRssBytes = process.resourceUsage().maxRSS * 1024
    privateWrite(join(directory, "REPORT.md"), markdownReport(report))
    privateWrite(join(directory, "report.json"), report)
    if (!shared) db.exec("COMMIT")
    return report
  } catch (error) {
    if (fd !== undefined) closeSync(fd)
    if (!shared) db.exec("ROLLBACK")
    throw error
  }
}
