import { DatabaseSync } from "node:sqlite"
import { chmodSync, existsSync, lstatSync, mkdirSync } from "node:fs"
import { join, resolve } from "node:path"
import { createHash } from "node:crypto"

export const POLICY = "nonprofit-enrichment-v1"
export const SCHEMA = 1
export const FIELDS = [
  "website",
  "phone",
  "alternate_names",
  "filing_address",
  "headquarters",
  "service_locations",
  "coordinates",
  "social_profiles",
  "services",
  "description",
  "categories",
  "logo",
  "relationships",
]
export const stable = (value) =>
  JSON.stringify(value, (_, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v).sort(([a], [b]) => a.localeCompare(b))
        )
      : v
  )
export const hash = (value) =>
  createHash("sha256")
    .update(
      typeof value === "string" || Buffer.isBuffer(value)
        ? value
        : stable(value)
    )
    .digest("hex")
export const utc = () => new Date().toISOString()
export function transaction(db, fn) {
  db.exec("BEGIN IMMEDIATE")
  try {
    const result = fn()
    db.exec("COMMIT")
    return result
  } catch (error) {
    db.exec("ROLLBACK")
    throw error
  }
}

export function openStore(directory, { write = false } = {}) {
  const home = resolve(directory)
  const file = join(home, "research.sqlite")
  if (existsSync(home) && lstatSync(home).isSymbolicLink())
    throw new Error("State directory must not be a symlink")
  if (existsSync(file) && lstatSync(file).isSymbolicLink())
    throw new Error("Ledger must not be a symlink")
  if (!write && !existsSync(file))
    throw new Error(
      "Ledger missing. Run init --write first; see docs/agent/nonprofit-enrichment-runbook.md"
    )
  if (write) {
    mkdirSync(home, { recursive: true, mode: 0o700 })
    chmodSync(home, 0o700)
  }
  const db = new DatabaseSync(file, { readOnly: !write })
  db.exec("PRAGMA busy_timeout=10000; PRAGMA foreign_keys=ON")
  if (write) {
    chmodSync(file, 0o600)
    db.exec("PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL")
    db.exec(`
      CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS sources(id TEXT PRIMARY KEY, path TEXT NOT NULL, sha256 TEXT NOT NULL, kind TEXT NOT NULL, cursor INTEGER NOT NULL DEFAULT 0, completed INTEGER NOT NULL DEFAULT 0, observed_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS organizations(ein TEXT PRIMARY KEY, identity TEXT NOT NULL, source_id TEXT NOT NULL REFERENCES sources(id), ordinal INTEGER NOT NULL, imported_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS jobs(ein TEXT PRIMARY KEY REFERENCES organizations(ein), status TEXT NOT NULL DEFAULT 'pending', attempts INTEGER NOT NULL DEFAULT 0, worker TEXT, token TEXT, expires_at INTEGER, next_at INTEGER NOT NULL DEFAULT 0, reason TEXT, updated_at TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS jobs_claim ON jobs(status,next_at,ein);
      CREATE TABLE IF NOT EXISTS events(seq INTEGER PRIMARY KEY AUTOINCREMENT, ein TEXT, kind TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS events_ein_kind ON events(ein,kind);
      CREATE TABLE IF NOT EXISTS submissions(id TEXT PRIMARY KEY, ein TEXT NOT NULL, token TEXT NOT NULL, digest TEXT NOT NULL, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS evidence(id TEXT PRIMARY KEY, ein TEXT NOT NULL REFERENCES organizations(ein), field TEXT NOT NULL, value TEXT NOT NULL, state TEXT NOT NULL, source_url TEXT NOT NULL, observed_at TEXT NOT NULL, body TEXT NOT NULL, policy TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS evidence_ein_field ON evidence(ein,field);
      CREATE TABLE IF NOT EXISTS unresolved(ein TEXT NOT NULL REFERENCES organizations(ein), field TEXT NOT NULL, reason TEXT NOT NULL, observed_at TEXT NOT NULL, PRIMARY KEY(ein,field));
      CREATE TABLE IF NOT EXISTS pages(cache_key TEXT PRIMARY KEY, url TEXT NOT NULL, content_hash TEXT NOT NULL, fetched_at TEXT NOT NULL, expires_at INTEGER NOT NULL, body TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS pages_final_url ON pages(json_extract(body,'$.finalUrl'));
      CREATE TABLE IF NOT EXISTS runs(id TEXT PRIMARY KEY, kind TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL);
    `)
    db.prepare("INSERT OR IGNORE INTO meta VALUES ('schema', ?)").run(
      String(SCHEMA)
    )
    db.prepare("INSERT OR IGNORE INTO meta VALUES ('policy', ?)").run(POLICY)
  }
  if (
    db.prepare("SELECT value FROM meta WHERE key='schema'").get()?.value !==
    String(SCHEMA)
  )
    throw new Error("Unsupported ledger schema")
  if (
    db.prepare("SELECT value FROM meta WHERE key='policy'").get()?.value !==
    POLICY
  )
    throw new Error("Ledger policy differs; explicit migration required")
  return db
}

export function event(db, ein, kind, body) {
  db.prepare(
    "INSERT INTO events(ein,kind,body,created_at) VALUES (?,?,?,?)"
  ).run(ein, kind, stable(body), utc())
}

export function overview(db) {
  const total = db.prepare("SELECT count(*) n FROM organizations").get().n
  const jobs = db
    .prepare("SELECT status,count(*) n FROM jobs GROUP BY status")
    .all()
  const fields = db
    .prepare(
      "SELECT field,state,count(DISTINCT ein) organizations FROM evidence GROUP BY field,state"
    )
    .all()
  return {
    schemaVersion: SCHEMA,
    corpusSchemaVersion: Number(
      db.prepare("SELECT value FROM meta WHERE key='corpus_schema'").get()
        ?.value ?? 0
    ),
    corpusImports: db
      .prepare("SELECT value FROM meta WHERE key='corpus_schema'")
      .get()
      ? db
          .prepare(
            `SELECT i.id,i.status,i.created_at,i.completed_at,sum(s.cursor) importedRows,
        sum(s.completed) completedSources,count(*) sources FROM corpus_imports i
        JOIN corpus_sources c ON c.corpus_id=i.id JOIN sources s ON s.id=c.source_id GROUP BY i.id`
          )
          .all()
      : [],
    policy: POLICY,
    organizations: total,
    jobs: Object.fromEntries(jobs.map((r) => [r.status, r.n])),
    expiredLeases: db
      .prepare(
        "SELECT count(*) n FROM jobs WHERE status='running' AND expires_at<=?"
      )
      .get(Date.now()).n,
    enrichedOrganizations: db
      .prepare(
        "SELECT count(DISTINCT ein) n FROM evidence WHERE field!='filing_address' AND state IN ('candidate','verified')"
      )
      .get().n,
    fields,
    unresolved: db
      .prepare(
        "SELECT field,reason,count(*) n FROM unresolved GROUP BY field,reason ORDER BY n DESC,field,reason LIMIT 50"
      )
      .all(),
    sources: db
      .prepare(
        "SELECT kind,completed,count(*) sources,sum(cursor) rows FROM sources GROUP BY kind,completed"
      )
      .all(),
    recentSources: db
      .prepare(
        "SELECT kind,sha256,cursor,completed,observed_at FROM sources ORDER BY observed_at DESC LIMIT 10"
      )
      .all(),
    processedOrganizations: db
      .prepare(
        "SELECT count(*) n FROM jobs WHERE status IN ('succeeded','partially_succeeded')"
      )
      .get().n,
    verifiedOrganizations: db
      .prepare(
        "SELECT count(DISTINCT ein) n FROM evidence WHERE state='verified' AND observed_at>=?"
      )
      .get(new Date(Date.now() - 30 * 86400_000).toISOString()).n,
    searchableOrganizations: 0,
    network: db
      .prepare(
        "SELECT count(*) receipts,coalesce(sum(json_array_length(body,'$.networkEvents')),0) requests,coalesce(sum(json_extract(body,'$.retainedBytes')),0) retainedBytes FROM runs WHERE kind LIKE 'receipt:%'"
      )
      .get(),
    runs: db
      .prepare(
        "SELECT kind,body,created_at FROM runs WHERE kind NOT LIKE 'receipt:%' ORDER BY created_at DESC LIMIT 5"
      )
      .all()
      .map((r) => ({ ...r, body: JSON.parse(r.body) })),
    reviewed: 0,
    published: 0,
    publicDisplayEligible: false,
    publicationBlocked: true,
  }
}
