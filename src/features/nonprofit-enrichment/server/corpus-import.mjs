import {
  copyFileSync,
  chmodSync,
  constants,
  existsSync,
  mkdirSync,
  renameSync,
  rmSync,
} from "node:fs"
import { basename, join } from "node:path"
import {
  readIrsEoCsvRows,
  buildIrsEoDiscoveryCandidate,
} from "../../../../scripts/resource-map/lib/irs-eo-acquisition.mjs"
import { assertCorpusSchema } from "./corpus-migrations.mjs"
import { fileHash } from "./import.mjs"
import { identityName } from "./source-inventory.mjs"
import { event, hash, stable, transaction, utc } from "./store.mjs"

async function retainSource(source, home) {
  const folder = join(home, "sources", "bmf")
  mkdirSync(folder, { recursive: true, mode: 0o700 })
  const target = join(folder, `${source.sha256}.csv`)
  if (existsSync(target)) {
    if ((await fileHash(target)) !== source.sha256)
      throw new Error("Retained source hash mismatch")
    return target
  }
  const temporary = `${target}.${process.pid}.tmp`
  try {
    copyFileSync(source.resolvedPath, temporary, constants.COPYFILE_EXCL)
    chmodSync(temporary, 0o600)
    if ((await fileHash(temporary)) !== source.sha256)
      throw new Error("Source bytes differ from frozen inventory")
    renameSync(temporary, target)
  } finally {
    rmSync(temporary, { force: true })
  }
  return target
}

export function corpusProgress(db, id) {
  assertCorpusSchema(db)
  const run = db.prepare("SELECT * FROM corpus_imports WHERE id=?").get(id)
  if (!run) return null
  const sources = db
    .prepare(
      `SELECT s.id,s.cursor,s.completed FROM corpus_sources c
    JOIN sources s ON s.id=c.source_id WHERE c.corpus_id=? ORDER BY s.id`
    )
    .all(id)
  const accepted = db
    .prepare(
      `SELECT count(*) n,count(DISTINCT o.ein) uniqueEins FROM identity_observations o
    JOIN corpus_sources c ON c.source_id=o.source_id WHERE c.corpus_id=?`
    )
    .get(id)
  const rejected = db
    .prepare(
      `SELECT count(*) n FROM corpus_rejections r JOIN corpus_sources c
    ON c.source_id=r.source_id WHERE c.corpus_id=?`
    )
    .get(id).n
  const conflicts = db
    .prepare(
      `SELECT count(DISTINCT x.ein) n FROM identity_conflicts x JOIN corpus_sources c
    ON c.source_id=x.source_id WHERE c.corpus_id=?`
    )
    .get(id).n
  return {
    corpusId: id,
    status: run.status,
    inputRows: sources.reduce((n, s) => n + s.cursor, 0),
    acceptedRows: accepted.n,
    rejectedRows: rejected,
    uniqueEins: accepted.uniqueEins,
    duplicateRows: accepted.n - accepted.uniqueEins,
    identityConflictEins: conflicts,
    completedSources: sources.filter((s) => s.completed).length,
    sources,
    researchOrganizations: db
      .prepare("SELECT count(*) n FROM organizations")
      .get().n,
    networkRequests: 0,
    published: 0,
    publicationBlocked: true,
  }
}

export async function importCorpus(
  db,
  manifest,
  home,
  { limit = 10000, onProgress = () => {}, shouldStop = () => false } = {}
) {
  assertCorpusSchema(db)
  if (!(Number.isSafeInteger(limit) && limit > 0))
    throw new Error("Positive row limit required")
  if (
    manifest?.kind !== "irs_bmf_corpus_inventory" ||
    manifest.version !== 1 ||
    !manifest.sources?.length ||
    manifest.corpusDigest !== hash(manifest.sources.map((s) => s.sha256).sort())
  )
    throw new Error("Invalid corpus inventory/digest")
  const unique = new Set()
  for (const s of manifest.sources) {
    if (
      !/^[a-f0-9]{64}$/.test(s.sha256) ||
      unique.has(s.sha256) ||
      !Number.isSafeInteger(s.rows) ||
      s.rows < 1
    )
      throw new Error("Invalid or duplicate source inventory")
    unique.add(s.sha256)
  }
  // All inputs are retained and hash-verified before any organization writes.
  const files = []
  for (const source of manifest.sources)
    files.push({ source, file: await retainSource(source, home) })
  const id = manifest.corpusDigest,
    now = utc()
  transaction(db, () => {
    const old = db
      .prepare("SELECT manifest FROM corpus_imports WHERE id=?")
      .get(id)
    if (old && old.manifest !== stable(manifest))
      throw new Error("Corpus manifest changed; restore the saved inventory")
    db.prepare(
      "INSERT OR IGNORE INTO corpus_imports(id,manifest,created_at) VALUES (?,?,?)"
    ).run(id, stable(manifest), now)
    for (const { source, file } of files) {
      const sourceId = hash({ kind: "identity_bmf", sha256: source.sha256 })
      db.prepare(
        "INSERT OR IGNORE INTO sources VALUES (?,?,?,'identity_bmf',0,0,?)"
      ).run(sourceId, file, source.sha256, now)
      db.prepare("INSERT OR IGNORE INTO source_snapshots VALUES (?,?)").run(
        sourceId,
        stable({ ...source, retainedPath: file })
      )
      db.prepare("INSERT OR IGNORE INTO corpus_sources VALUES (?,?)").run(
        id,
        sourceId
      )
    }
  })
  let scanned = 0,
    added = 0
  const insertOrg = db.prepare(
    "INSERT OR IGNORE INTO organizations VALUES (?,?,?,?,?)"
  )
  const insertJob = db.prepare(
    "INSERT OR IGNORE INTO jobs(ein,updated_at) VALUES (?,?)"
  )
  const insertObservation = db.prepare(
    "INSERT INTO identity_observations VALUES (?,?,?,?,?)"
  )
  const existingOrg = db.prepare(
    "SELECT identity FROM organizations WHERE ein=?"
  )
  const insertConflict = db.prepare(
    "INSERT INTO identity_conflicts VALUES (?,?,?,?)"
  )
  const previous = db.prepare(
    "SELECT row_hash FROM identity_observations WHERE ein=? AND row_hash<>? LIMIT 1"
  )
  for (const { source, file } of files) {
    const sourceId = hash({ kind: "identity_bmf", sha256: source.sha256 })
    const saved = db.prepare("SELECT * FROM sources WHERE id=?").get(sourceId)
    if (saved.completed) continue
    let cursor = 0,
      expectedCursor = saved.cursor,
      batch = [],
      interrupted = false
    const flush = () => {
      transaction(db, () => {
        if (
          db.prepare("SELECT cursor FROM sources WHERE id=?").get(sourceId)
            .cursor !== expectedCursor
        )
          throw new Error(
            "Import cursor changed in another worker; resume after it finishes"
          )
        for (const { row, ordinal } of batch) {
          const ein = String(row.EIN ?? "").trim(),
            rowHash = hash(row)
          const reason =
            !/^\d{9}$/.test(ein) || ein === "000000000"
              ? "invalid_ein"
              : !identityName(row.NAME)
                ? "missing_name"
                : null
          if (reason) {
            db.prepare("INSERT INTO corpus_rejections VALUES (?,?,?,?)").run(
              sourceId,
              ordinal,
              reason,
              rowHash
            )
            continue
          }
          const identity = buildIrsEoDiscoveryCandidate(row, {
            sourceFile: basename(file),
          })
          if (!identity) throw new Error("Unsupported identity row")
          const old = existingOrg.get(ein)
          const changed = previous.get(ein, rowHash)
          const inserted = insertOrg.run(
            ein,
            stable(identity),
            sourceId,
            ordinal,
            now
          )
          added += Number(inserted.changes)
          insertJob.run(ein, now)
          insertObservation.run(sourceId, ordinal, ein, rowHash, stable(row))
          if (
            changed ||
            (old &&
              identityName(JSON.parse(old.identity).organizationName) !==
                identityName(identity.organizationName))
          )
            insertConflict.run(
              ein,
              sourceId,
              ordinal,
              changed
                ? "different_bmf_observation_requires_dated_resolution"
                : "existing_name_differs"
            )
        }
        db.prepare("UPDATE sources SET cursor=? WHERE id=?").run(
          cursor,
          sourceId
        )
      })
      expectedCursor = cursor
      batch = []
      onProgress({ corpusId: id, sourceId, cursor, added, scanned })
    }
    for await (const row of readIrsEoCsvRows(file)) {
      if (cursor >= expectedCursor && (scanned >= limit || shouldStop())) {
        interrupted = true
        break
      }
      cursor++
      if (cursor <= saved.cursor) continue
      if (
        !["EIN", "NAME", "STREET", "CITY", "STATE", "ZIP", "STATUS"].every(
          (k) => k in row
        )
      )
        throw new Error("BMF source lacks required columns")
      scanned++
      batch.push({ row, ordinal: cursor })
      if (batch.length === 1000) flush()
    }
    if (batch.length) flush()
    if (!interrupted && cursor === source.rows) {
      if ((await fileHash(file)) !== source.sha256)
        throw new Error(
          "Retained source changed; incomplete source remains held"
        )
      const count = db
        .prepare(
          "SELECT count(*) n FROM identity_observations WHERE source_id=?"
        )
        .get(sourceId).n
      const rejects = db
        .prepare("SELECT count(*) n FROM corpus_rejections WHERE source_id=?")
        .get(sourceId).n
      if (count !== source.acceptedRows || rejects !== source.rejectedRows)
        throw new Error("Source row reconciliation failed")
      transaction(db, () => {
        db.prepare(
          "UPDATE sources SET completed=1 WHERE id=? AND cursor=?"
        ).run(sourceId, cursor)
        event(db, null, "corpus_source_complete", {
          corpusId: id,
          sourceId,
          rows: cursor,
        })
      })
    } else if (cursor >= source.rows || !interrupted)
      throw new Error("Source row count differs from inventory")
    if (scanned >= limit || shouldStop()) break
  }
  const progress = corpusProgress(db, id)
  if (progress.completedSources === files.length) {
    for (const key of [
      "inputRows",
      "acceptedRows",
      "rejectedRows",
      "uniqueEins",
      "duplicateRows",
    ])
      if (progress[key] !== manifest.totals[key])
        throw new Error(`Corpus reconciliation failed: ${key}`)
    transaction(db, () => {
      db.prepare(
        "UPDATE corpus_imports SET status='completed',completed_at=? WHERE id=? AND status<>'completed'"
      ).run(utc(), id)
    })
    progress.status = "completed"
  }
  return { ...progress, scannedThisRun: scanned, addedThisRun: added }
}
