import { DatabaseSync } from "node:sqlite"
import { chmodSync, existsSync, mkdirSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { transaction, utc } from "./store.mjs"

// Additive, explicitly invoked migration. Old research assertions/jobs are never
// rewritten; the base ledger version remains independently compatible.
export function migrateCorpus(db, backupPath) {
  const version = db
    .prepare("SELECT value FROM meta WHERE key='corpus_schema'")
    .get()?.value
  if (version === "1") return { version: 1, migrated: false }
  if (version) throw new Error("Unsupported corpus schema")
  if (db.prepare("SELECT 1 FROM jobs WHERE status='running' LIMIT 1").get())
    throw new Error("Finish active research claims before migration")
  if (!backupPath || existsSync(backupPath))
    throw new Error("New backup path required")
  const backup = resolve(backupPath)
  mkdirSync(dirname(backup), { recursive: true, mode: 0o700 })
  db.prepare("VACUUM INTO ?").run(backup)
  chmodSync(backup, 0o600)
  const copy = new DatabaseSync(backup, { readOnly: true })
  try {
    if (copy.prepare("PRAGMA integrity_check").get().integrity_check !== "ok")
      throw new Error("Backup integrity failed")
    for (const table of [
      "organizations",
      "jobs",
      "evidence",
      "events",
      "sources",
      "pages",
    ]) {
      if (
        copy.prepare(`SELECT count(*) n FROM ${table}`).get().n !==
        db.prepare(`SELECT count(*) n FROM ${table}`).get().n
      )
        throw new Error("Ledger changed during backup; retry while idle")
    }
  } finally {
    copy.close()
  }
  transaction(db, () => {
    db.exec(`
      CREATE TABLE corpus_imports(id TEXT PRIMARY KEY, manifest TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'running', created_at TEXT NOT NULL, completed_at TEXT);
      CREATE TABLE source_snapshots(source_id TEXT PRIMARY KEY REFERENCES sources(id), metadata TEXT NOT NULL);
      CREATE TABLE corpus_sources(corpus_id TEXT NOT NULL REFERENCES corpus_imports(id),
        source_id TEXT NOT NULL REFERENCES source_snapshots(source_id), PRIMARY KEY(corpus_id,source_id));
      CREATE TABLE identity_observations(source_id TEXT NOT NULL REFERENCES source_snapshots(source_id),
        ordinal INTEGER NOT NULL, ein TEXT NOT NULL REFERENCES organizations(ein),
        row_hash TEXT NOT NULL, body TEXT NOT NULL, PRIMARY KEY(source_id,ordinal)) WITHOUT ROWID;
      CREATE INDEX identity_observations_ein ON identity_observations(ein,row_hash);
      CREATE TABLE identity_conflicts(ein TEXT NOT NULL REFERENCES organizations(ein),
        source_id TEXT NOT NULL, ordinal INTEGER NOT NULL, reason TEXT NOT NULL,
        PRIMARY KEY(source_id,ordinal), FOREIGN KEY(source_id,ordinal) REFERENCES identity_observations(source_id,ordinal));
      CREATE TABLE corpus_rejections(source_id TEXT NOT NULL REFERENCES source_snapshots(source_id),
        ordinal INTEGER NOT NULL, reason TEXT NOT NULL, row_hash TEXT NOT NULL,
        PRIMARY KEY(source_id,ordinal)) WITHOUT ROWID;
    `)
    db.prepare("INSERT INTO meta VALUES ('corpus_schema','1')").run()
    db.prepare("INSERT INTO meta VALUES ('corpus_migration_backup',?)").run(
      JSON.stringify({ backup, verifiedAt: utc() })
    )
  })
  return { version: 1, migrated: true, backup, backupVerified: true }
}

export function assertCorpusSchema(db) {
  if (
    db.prepare("SELECT value FROM meta WHERE key='corpus_schema'").get()
      ?.value !== "1"
  )
    throw new Error(
      "Run migrate-corpus with a new backup --output before import-corpus"
    )
}
