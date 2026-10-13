import { DatabaseSync } from "node:sqlite"
import { mkdirSync, chmodSync, existsSync, readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { readIrsEoCsvRows } from "../../../../scripts/resource-map/lib/irs-eo-acquisition.mjs"
import { fileHash } from "./import.mjs"
import { privateWrite } from "./artifacts.mjs"
import { hash, stable, utc } from "./store.mjs"
import {
  CATEGORY_MAPPING_VERSION,
  CATEGORY_REFERENCE,
  CATEGORY_NAVIGATION_ADDITIONS,
  mapOrganizationCategories,
} from "./ntee-category-mapping.mjs"

function summarize(db) {
  const totals = db
    .prepare(
      `SELECT count(*) organizations,
    coalesce(sum(state='mapped'),0) mapped,
    coalesce(sum(state='unclassified'),0) unclassified FROM classifications`
    )
    .get()
  const rows = db
    .prepare("SELECT coalesce(sum(cursor),0) inputRows FROM source_progress")
    .get()
  const categoryCounts = Object.fromEntries(
    db
      .prepare(
        `SELECT j.value category,count(*) n
    FROM classifications c,json_each(c.categories) j GROUP BY j.value ORDER BY j.value`
      )
      .all()
      .map((r) => [r.category, r.n])
  )
  const reasonCounts = Object.fromEntries(
    db
      .prepare(
        "SELECT reason,count(*) n FROM classifications GROUP BY reason ORDER BY reason"
      )
      .all()
      .map((r) => [r.reason, r.n])
  )
  const examples = {}
  const sample = db.prepare(
    "SELECT ein,raw_codes,categories FROM classifications WHERE reason=? ORDER BY ein LIMIT 3"
  )
  for (const reason of Object.keys(reasonCounts))
    examples[reason] = sample.all(reason)
  return {
    ...totals,
    ...rows,
    duplicateRows: rows.inputRows - totals.organizations,
    categoryCounts,
    reasonCounts,
    examples,
  }
}

export async function mapCategoryCorpus({
  inputs,
  output,
  all = false,
  limit = 50000,
  shouldStop = () => false,
  onProgress = () => {},
}) {
  if (!inputs?.length || !output)
    throw new Error("Explicit retained BMF inputs and output required")
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100000)
    throw new Error("Limit must be 1..100000, or use all")
  const paths = inputs.map((p) => resolve(p)).sort()
  if (new Set(paths).size !== paths.length)
    throw new Error("Duplicate input path")
  const sources = []
  for (const path of paths) sources.push({ path, sha256: await fileHash(path) })
  if (new Set(sources.map((s) => s.sha256)).size !== sources.length)
    throw new Error("Duplicate source content")
  const binding = {
    version: CATEGORY_MAPPING_VERSION,
    referenceHash: CATEGORY_REFERENCE.sourceSha256,
    mappingDigest: hash([
      await fileHash(new URL("./ntee-category-mapping.mjs", import.meta.url)),
      await fileHash(new URL("./ntee-core-codes.json", import.meta.url)),
    ]),
    sources,
    corpusHash: hash(sources.map((s) => s.sha256).sort()),
  }
  const target = resolve(output)
  mkdirSync(target, { recursive: true, mode: 0o700 })
  const manifest = join(target, "source-manifest.json"),
    reportPath = join(target, "report.json")
  if (existsSync(manifest)) {
    if (stable(JSON.parse(readFileSync(manifest, "utf8"))) !== stable(binding))
      throw new Error(
        "Category source/mapping changed; preserve this output and use a new run"
      )
  } else privateWrite(manifest, binding)
  if (existsSync(reportPath))
    return { ...JSON.parse(readFileSync(reportPath, "utf8")), replayed: true }
  const dbPath = join(target, "classifications.sqlite")
  const db = new DatabaseSync(dbPath)
  chmodSync(dbPath, 0o600)
  let transactionOpen = false,
    processed = 0
  const started = Date.now()
  try {
    db.exec(`PRAGMA busy_timeout=10000; PRAGMA synchronous=FULL; PRAGMA cache_size=-32768;
      CREATE TABLE IF NOT EXISTS classifications(ein TEXT PRIMARY KEY,raw_codes TEXT NOT NULL,
        categories TEXT NOT NULL,state TEXT NOT NULL,reason TEXT NOT NULL,source_refs TEXT NOT NULL) WITHOUT ROWID;
      CREATE TABLE IF NOT EXISTS source_progress(id TEXT PRIMARY KEY,path TEXT NOT NULL,
        cursor INTEGER NOT NULL DEFAULT 0,complete INTEGER NOT NULL DEFAULT 0) WITHOUT ROWID;
      CREATE INDEX IF NOT EXISTS classification_reason ON classifications(reason,ein);`)
    const get = db.prepare(
      "SELECT raw_codes,source_refs FROM classifications WHERE ein=?"
    )
    const put =
      db.prepare(`INSERT INTO classifications VALUES (?,?,?,?,?,?) ON CONFLICT(ein) DO UPDATE SET
      raw_codes=excluded.raw_codes,categories=excluded.categories,state=excluded.state,
      reason=excluded.reason,source_refs=excluded.source_refs`)
    const update = db.prepare(
      "UPDATE source_progress SET cursor=? WHERE id=? AND cursor=?"
    )
    for (const source of sources) {
      db.prepare(
        "INSERT OR IGNORE INTO source_progress(id,path) VALUES (?,?)"
      ).run(source.sha256, source.path)
      let checkpoint = db
        .prepare("SELECT cursor,complete FROM source_progress WHERE id=?")
        .get(source.sha256)
      if (checkpoint.complete) continue
      let ordinal = 0,
        batch = 0,
        interrupted = false
      db.exec("BEGIN IMMEDIATE")
      transactionOpen = true
      for await (const row of readIrsEoCsvRows(source.path)) {
        ordinal++
        if (ordinal <= checkpoint.cursor) continue
        if (shouldStop() || (!all && processed >= limit)) {
          interrupted = true
          break
        }
        if (
          !Object.hasOwn(row, "NTEE_CD") ||
          !/^\d{9}$/.test(row.EIN ?? "") ||
          row.EIN === "000000000"
        )
          throw new Error("BMF row lacks valid EIN/NTEE columns")
        const existing = get.get(row.EIN)
        const codes = existing ? JSON.parse(existing.raw_codes) : []
        const rawCode = row.NTEE_CD ?? null
        if (!codes.includes(rawCode)) codes.push(rawCode)
        const decision = mapOrganizationCategories(codes)
        const refs = existing ? JSON.parse(existing.source_refs) : []
        refs.push({ sourceHash: source.sha256, ordinal })
        put.run(
          row.EIN,
          stable(codes),
          stable(decision.categories),
          decision.state,
          decision.reason,
          stable(refs)
        )
        processed++
        batch++
        if (update.run(ordinal, source.sha256, checkpoint.cursor).changes !== 1)
          throw new Error("Concurrent category cursor changed")
        checkpoint.cursor = ordinal
        if (batch === 1000) {
          db.exec("COMMIT")
          transactionOpen = false
          if (processed % 50000 === 0)
            onProgress({
              phase: "mapped",
              processed,
              seconds: (Date.now() - started) / 1000,
            })
          db.exec("BEGIN IMMEDIATE")
          transactionOpen = true
          batch = 0
        }
      }
      if (!interrupted) {
        if (!ordinal) throw new Error("Empty BMF input")
        if (ordinal < checkpoint.cursor)
          throw new Error("Source shortened before saved cursor")
        if ((await fileHash(source.path)) !== source.sha256)
          throw new Error("Source changed during mapping")
        db.prepare("UPDATE source_progress SET complete=1 WHERE id=?").run(
          source.sha256
        )
      }
      db.exec("COMMIT")
      transactionOpen = false
      if (interrupted) break
    }
    const complete =
      db
        .prepare("SELECT count(*) n FROM source_progress WHERE complete=1")
        .get().n === sources.length
    const result = {
      kind: "nonprofit_category_coverage_v1",
      mappingVersion: CATEGORY_MAPPING_VERSION,
      completedAt: complete ? utc() : null,
      complete,
      processedThisRun: processed,
      durationSeconds: (Date.now() - started) / 1000,
      ...summarize(db),
      corpusHash: binding.corpusHash,
      reference: CATEGORY_REFERENCE.sourceUrl,
      navigationAdditions: CATEGORY_NAVIGATION_ADDITIONS,
      database: dbPath,
      researchLedgerWrites: 0,
      published: 0,
      note: "Organization topics only. Proposed navigation keys are not yet public category filters.",
    }
    if (complete) privateWrite(reportPath, result)
    else privateWrite(join(target, `progress-${Date.now()}.json`), result)
    return result
  } catch (error) {
    if (transactionOpen) db.exec("ROLLBACK")
    throw error
  } finally {
    db.close()
  }
}
