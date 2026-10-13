import { DatabaseSync } from "node:sqlite"
import { mkdtempSync, chmodSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { inventorySources, matchBmfSources } from "./source-inventory.mjs"
import { auditFilings } from "./audit-filings.mjs"
import { hash } from "./store.mjs"

// Contexts cannot be loaded from a stale checkpoint: they exist only inside one
// read transaction. Every new process revalidates sources. Completed audits persist.
const contexts = new WeakMap()
export const auditContext = (db) => contexts.get(db)

export async function withAuditContext(db, options, work) {
  if (contexts.has(db)) throw new Error("Audit context already active")
  const { inputs, now, onProgress = () => {} } = options
  const scratch = mkdtempSync(join(tmpdir(), "nonprofit-audit-index-"))
  let index,
    begun = false
  const started = Date.now()
  try {
    // Bound the read cache and map a small window; the default 2 MiB cache
    // caused excessive tiny reads during the national integrity scan.
    db.exec("PRAGMA cache_size=-65536; PRAGMA mmap_size=268435456")
    db.exec("BEGIN")
    begun = true
    // Check every table read by publication, not unrelated national import/job
    // history. Full-ledger health remains part of the backup/maintenance path.
    const checkedTables = [
      "organizations",
      "sources",
      "evidence",
      "pages",
      "runs",
      "events",
    ]
    for (const table of checkedTables) {
      onProgress({ phase: "ledger_integrity", table })
      if (
        Object.values(db.prepare(`PRAGMA quick_check('${table}')`).get())[0] !==
        "ok"
      )
        throw new Error(`Ledger integrity check failed: ${table}`)
    }
    onProgress({
      phase: "retained_source_hashes",
      elapsedSeconds: (Date.now() - started) / 1000,
    })
    const inventory = await inventorySources(db)
    index = new DatabaseSync(join(scratch, "bmf.sqlite"))
    chmodSync(join(scratch, "bmf.sqlite"), 0o600)
    index.exec(
      "PRAGMA journal_mode=OFF; PRAGMA synchronous=OFF; PRAGMA cache_size=-16384; CREATE TABLE matches(ein TEXT PRIMARY KEY, body TEXT NOT NULL); BEGIN"
    )
    const read = index.prepare("SELECT body FROM matches WHERE ein=?")
    const write = index.prepare(
      "INSERT INTO matches VALUES (?,?) ON CONFLICT(ein) DO UPDATE SET body=excluded.body"
    )
    const matches = {
      get(ein) {
        const row = read.get(ein)
        return row ? JSON.parse(row.body) : undefined
      },
      set(ein, rows) {
        write.run(ein, JSON.stringify(rows))
      },
    }
    onProgress({
      phase: "index_bmf",
      elapsedSeconds: (Date.now() - started) / 1000,
    })
    const bmf = await matchBmfSources(inputs, null, matches)
    index.exec("COMMIT; PRAGMA query_only=ON")
    onProgress({
      phase: "parse_filings",
      elapsedSeconds: (Date.now() - started) / 1000,
    })
    const filings = auditFilings(db, inventory)
    const id = hash({ retained: inventory.entries, bmf: bmf.snapshots, now })
    contexts.set(db, {
      id,
      checkedTables,
      inventory,
      bmf,
      filings,
      now,
      inputsHash: hash(inputs),
    })
    onProgress({
      phase: "context_ready",
      id,
      elapsedSeconds: (Date.now() - started) / 1000,
    })
    const result = await work({ id })
    db.exec("COMMIT")
    begun = false
    return result
  } finally {
    contexts.delete(db)
    if (begun) db.exec("ROLLBACK")
    index?.close()
    rmSync(scratch, { recursive: true, force: true })
  }
}
