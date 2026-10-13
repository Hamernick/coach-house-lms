import { execFileSync } from "node:child_process"
import { mkdirSync, openSync, writeSync, fsyncSync, closeSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { assessFilingFields, AUDIT_POLICY } from "./publication-policy.mjs"
import { privateWrite } from "./artifacts.mjs"
import { fileHash } from "./import.mjs"
import { hash, stable, utc } from "./store.mjs"
import { pageRejection } from "./verification.mjs"

// Read-only, affected-EIN pass. Each XML is parsed/hashed once per selected page.
// Existing directory identities, addresses and publication receipts are untouched.
export async function prepareFilingUpdates(db, {
  output, after = "", limit = 5000, now = Date.now(), excludeEins = [], onProgress = () => {},
}) {
  if (!output || (after && !/^\d{9}$/.test(after)) ||
      !Number.isSafeInteger(limit) || limit < 1 || limit > 50000)
    throw new Error("New output and bounded EIN selection required")
  mkdirSync(output, { mode: 0o700 })
  db.exec("BEGIN")
  let fd
  try {
    const selected = db.prepare(
      "SELECT DISTINCT ein FROM events WHERE kind='filing_imported' AND ein>? ORDER BY ein LIMIT ?"
    ).all(after, limit).map((r) => r.ein)
    const report = {
      kind: "nonprofit_filing_updates_v1", policy: AUDIT_POLICY,
      asOf: new Date(now).toISOString(), startedAt: utc(), after,
      lastEin: selected.at(-1) ?? after, selected: selected.length,
      eventSequence: db.prepare("SELECT max(seq) n FROM events").get().n,
      sourceQuarantineEins: [...new Set(excludeEins)].sort(),
      records: 0, parsedFiles: 0, sourceFailures: 0,
      fields: { website: 0, phone: 0, description: 0 }, holds: {},
      networkRequests: 0, publicWrites: 0,
    }
    const evidence = db.prepare("SELECT * FROM evidence WHERE ein=? ORDER BY field,id")
    const pages = db.prepare(
      "SELECT DISTINCT p.body FROM pages p JOIN evidence e ON e.source_url=json_extract(p.body,'$.finalUrl') WHERE e.ein=?"
    )
    const quarantines = new Map()
    for (const r of db.prepare("SELECT body FROM runs WHERE kind='source_quarantine'").iterate()) {
      const q = JSON.parse(r.body), rows = quarantines.get(q.ein) ?? []
      rows.push(q); quarantines.set(q.ein, rows)
    }
    fd = openSync(join(output, "updates.jsonl"), "wx", 0o600)
    for (let start = 0; start < selected.length; start += 100) {
      const eins = selected.slice(start, start + 100)
      const sources = db.prepare(`SELECT DISTINCT e.ein,s.id,s.path,s.sha256,s.completed
        FROM events e JOIN sources s ON s.id=json_extract(e.body,'$.sourceId')
        WHERE e.kind='filing_imported' AND s.kind='irs990' AND e.ein IN (${eins.map(() => "?").join(",")})
        ORDER BY e.ein,s.id`).all(...eins)
      const parsed = sources.length ? execFileSync("python3", [
        fileURLToPath(new URL("./parse-filings.py", import.meta.url)),
      ], { input: sources.map((s) => JSON.stringify(s.path)).join("\n") + "\n",
        encoding: "utf8", timeout: 60000, maxBuffer: 32_000_000,
      }).trim().split("\n").map(JSON.parse) : []
      if (parsed.length !== sources.length) throw new Error("Parser population mismatch")
      const filings = new Map(), invalid = new Set()
      for (const [i, source] of sources.entries()) {
        const f = parsed[i]
        report.parsedFiles++
        if (!source.completed || f.error || f.ein !== source.ein ||
            f.source_sha256 !== source.sha256 ||
            !/^https:\/\/apps\.irs\.gov\/pub\/epostcard\/990\/xml\//.test(f.source_url)) {
          invalid.add(source.ein); report.sourceFailures++; continue
        }
        const rows = filings.get(f.ein) ?? []
        rows.push({ ...f, sourceId: source.id }); filings.set(f.ein, rows)
      }
      for (const ein of eins) {
        if (excludeEins.includes(ein) || invalid.has(ein) || !filings.has(ein)) {
          report.holds.source_integrity = (report.holds.source_integrity ?? 0) + 1
          continue
        }
        const assertions = evidence.all(ein)
        const holds = [...(quarantines.get(ein) ?? []), ...pages.all(ein)
          .map((p) => JSON.parse(p.body)).filter(pageRejection)
          .map((p) => ({ source_url: p.finalUrl }))]
        const fields = assessFilingFields({ filings: filings.get(ein), evidence: assertions, quarantines: holds, now })
        for (const [field, decision] of Object.entries(fields)) {
          if (decision.eligible) report.fields[field]++
          else report.holds[decision.reason] = (report.holds[decision.reason] ?? 0) + 1
        }
        if (!Object.values(fields).some((f) => f.eligible)) continue
        writeSync(fd, stable({ ein, fields, evidenceHash: hash(assertions),
          sourceHashes: filings.get(ein).map((f) => f.source_sha256).sort() }) + "\n")
        report.records++
      }
      onProgress({ selected: Math.min(start + 100, selected.length), records: report.records })
    }
    fsyncSync(fd); closeSync(fd); fd = undefined
    report.recordsHash = await fileHash(join(output, "updates.jsonl"))
    report.completedAt = utc()
    privateWrite(join(output, "report.json"), report)
    db.exec("COMMIT")
    return report
  } catch (error) {
    if (fd !== undefined) closeSync(fd)
    db.exec("ROLLBACK")
    throw error
  }
}
