import { spawn } from "node:child_process"
import { readdirSync, statSync, realpathSync } from "node:fs"
import { createInterface } from "node:readline"
import { once } from "node:events"
import { resolve, join } from "node:path"
import { fileURLToPath } from "node:url"
import { hash, stable, transaction, utc, event } from "./store.mjs"
import { addEvidence } from "./queue.mjs"
import { fileHash } from "./import.mjs"

function* xmlPaths(input) {
  const path = realpathSync(resolve(input))
  if (statSync(path).isDirectory()) {
    for (const entry of readdirSync(path, { withFileTypes: true }).sort(
      (a, b) => a.name.localeCompare(b.name)
    )) {
      if (entry.isDirectory()) yield* xmlPaths(join(path, entry.name))
      else if (entry.isFile() && entry.name.toLowerCase().endsWith(".xml"))
        yield join(path, entry.name)
    }
  } else if (path.toLowerCase().endsWith(".xml")) yield path
  else
    throw new Error("Provide local IRS XML files or a directory of XML files")
}
export async function ingestFilings(db, inputs, { limit = 1000 } = {}) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100000)
    throw new Error("Filing batch limit must be 1..100000")
  const child = spawn(
    "python3",
    [fileURLToPath(new URL("./parse-filings.py", import.meta.url))],
    { stdio: ["pipe", "pipe", "pipe"] }
  )
  let stderr = "",
    spawnError = null
  child.stderr.on("data", (d) => {
    stderr = (stderr + d).slice(-2000)
  })
  child.on("error", (e) => {
    spawnError = e
  })
  const ended = new Promise((resolve) =>
    child.on("close", (code) => resolve(code))
  )
  const counts = {
    files: 0,
    matched: 0,
    unmatched: 0,
    replayed: 0,
    errors: 0,
    assertions: 0,
    newlyCoveredFields: { website: 0, phone: 0, description: 0 },
    newlyEnrichedOrganizations: 0,
  }
  const population = db.prepare("SELECT count(*) n FROM organizations").get().n
  const pending = new Map()
  const feed = (async () => {
    let n = 0
    for (const input of inputs)
      for (const path of xmlPaths(input)) {
        if (n >= limit) return
        const sha = await fileHash(path)
        const sourceId = hash({ kind: "irs990", sha })
        const scanId = hash({ kind: "irs990_scan_v1", sha, population })
        if (
          db
            .prepare("SELECT id FROM sources WHERE id IN (?,?) AND completed=1")
            .get(sourceId, scanId)
        ) {
          counts.replayed++
          continue
        }
        pending.set(path, { sha, scanId })
        if (!child.stdin.write(JSON.stringify(path) + "\n"))
          await once(child.stdin, "drain")
        n++
      }
  })().finally(() => child.stdin.end())
  // Handle rejected feeder promises immediately; await below still propagates failure.
  feed.catch(() => {})
  const markScanned = (r) => {
    const scan = pending.get(r.source_path)
    db.prepare("INSERT OR IGNORE INTO sources VALUES (?,?,?,?,1,1,?)").run(
      scan.scanId,
      r.source_path,
      scan.sha,
      "irs990_scan",
      utc()
    )
  }
  try {
    for await (const line of createInterface({
      input: child.stdout,
      crlfDelay: Infinity,
    })) {
      const r = JSON.parse(line)
      counts.files++
      if (
        r.source_sha256 &&
        r.source_sha256 !== pending.get(r.source_path)?.sha
      )
        throw new Error(
          "XML source changed during parsing; restore immutable input"
        )
      if (r.error) {
        counts.errors++
        transaction(db, () => {
          event(db, null, "filing_parse_error", r)
          markScanned(r)
        })
        continue
      }
      const sourceId = hash({ kind: "irs990", sha: r.source_sha256 })
      if (
        db.prepare("SELECT completed FROM sources WHERE id=?").get(sourceId)
          ?.completed
      ) {
        counts.replayed++
        continue
      }
      if (!db.prepare("SELECT ein FROM organizations WHERE ein=?").get(r.ein)) {
        counts.unmatched++
        transaction(db, () => markScanned(r))
        continue
      }
      transaction(db, () => {
        const existing = new Set(
          db
            .prepare(
              "SELECT DISTINCT field FROM evidence WHERE ein=? AND field IN ('website','phone','description')"
            )
            .all(r.ein)
            .map((row) => row.field)
        )
        const useful = Object.keys(counts.newlyCoveredFields).filter(
          (field) => r.fields[field]
        )
        if (!existing.size && useful.length) counts.newlyEnrichedOrganizations++
        for (const field of useful)
          if (!existing.has(field)) counts.newlyCoveredFields[field]++
        db.prepare("INSERT OR IGNORE INTO sources VALUES (?,?,?,?,1,1,?)").run(
          sourceId,
          r.source_path,
          r.source_sha256,
          "irs990",
          utc()
        )
        for (const [field, value] of Object.entries(r.fields)) {
          // Filing values are dated candidates, not proof of present-day contacts/services.
          addEvidence(db, r.ein, {
            field,
            value,
            source_url: r.source_url,
            observed_at: utc(),
            evidence: stable({
              value,
              taxYear: r.tax_year,
              taxPeriodEnd: r.tax_period_end,
              returnTimestamp: r.return_timestamp,
              amended: r.amended,
              sourceSha256: r.source_sha256,
            }),
            method: "irs990_xml_exact_ein_v1",
            source_type: "irs990",
            license: "irs_public_filing",
          })
          counts.assertions++
        }
        markScanned(r)
        event(db, r.ein, "filing_imported", {
          sourceId,
          form: r.form,
          taxYear: r.tax_year,
        })
      })
      counts.matched++
    }
    await feed
    const code = await ended
    if (spawnError || code !== 0)
      throw new Error(`XML parser failed: ${spawnError?.message ?? stderr}`)
    return counts
  } catch (error) {
    child.kill()
    await feed.catch(() => {})
    throw error
  }
}
