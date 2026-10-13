import { DatabaseSync } from "node:sqlite"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { readIrsEoCsvRows } from "../../../../scripts/resource-map/lib/irs-eo-acquisition.mjs"
import {
  inspectSource,
  identityName,
  BMF_REFERENCE,
} from "./source-inventory.mjs"
import { fileHash } from "./import.mjs"
import { hash, utc } from "./store.mjs"

// Aggregate inventory only: never imports into or modifies the research ledger.
// Temporary disk-backed deduplication keeps national input size out of JS memory.
export async function inventoryCorpus(inputs) {
  if (!inputs?.length) throw new Error("Explicit local BMF inputs required")
  const temporary = mkdtempSync(join(tmpdir(), "nonprofit-corpus-"))
  const db = new DatabaseSync(join(temporary, "inventory.sqlite"))
  const sources = [],
    paths = new Set(),
    started = Date.now()
  try {
    db.exec(`PRAGMA journal_mode=OFF; PRAGMA synchronous=OFF; PRAGMA cache_size=-16000;
      CREATE TABLE identities(ein TEXT PRIMARY KEY,name TEXT NOT NULL,row_hash TEXT NOT NULL,
        occurrences INTEGER NOT NULL DEFAULT 1,name_conflict INTEGER NOT NULL DEFAULT 0,
        row_difference INTEGER NOT NULL DEFAULT 0) WITHOUT ROWID;`)
    const upsert =
      db.prepare(`INSERT INTO identities(ein,name,row_hash) VALUES (?,?,?)
      ON CONFLICT(ein) DO UPDATE SET occurrences=occurrences+1,
        name_conflict=max(name_conflict,identities.name<>excluded.name),
        row_difference=max(row_difference,identities.row_hash<>excluded.row_hash)`)
    for (const input of inputs) {
      const source = await inspectSource(input)
      if (source.integrity !== "matched")
        throw new Error(`Unavailable input: ${input}`)
      if (paths.has(source.resolvedPath))
        throw new Error("Duplicate BMF input path")
      paths.add(source.resolvedPath)
      Object.assign(source, {
        kind: "irs_eo_bmf",
        id: hash({ kind: "irs_eo_bmf", sha256: source.sha256 }),
        sourceUrl: BMF_REFERENCE,
        snapshotDate: null,
        origin:
          "operator_supplied_local_IRS_format_snapshot; download_receipt_not_asserted",
        reuseBasis: "IRS_published_registry_facts; excludes_third_party_assets",
        rows: 0,
        acceptedRows: 0,
        rejectedRows: 0,
        rejectedReasons: {},
        rejectedExamples: [],
      })
      db.exec("BEGIN")
      for await (const row of readIrsEoCsvRows(source.resolvedPath)) {
        source.rows++
        if (
          !["EIN", "NAME", "STREET", "CITY", "STATE", "ZIP", "STATUS"].every(
            (k) => k in row
          )
        )
          throw new Error("BMF source lacks required columns")
        source.columns ??= Object.keys(row)
        const ein = String(row.EIN ?? "").trim(),
          name = identityName(row.NAME)
        const reason =
          !/^\d{9}$/.test(ein) || ein === "000000000"
            ? "invalid_ein"
            : !name
              ? "missing_name"
              : null
        if (reason) {
          source.rejectedRows++
          source.rejectedReasons[reason] =
            (source.rejectedReasons[reason] ?? 0) + 1
          if (source.rejectedExamples.length < 20)
            source.rejectedExamples.push({ row: source.rows, reason })
        } else {
          upsert.run(ein, name, hash(row))
          source.acceptedRows++
        }
        if (source.rows % 1000 === 0) db.exec("COMMIT; BEGIN")
      }
      db.exec("COMMIT")
      if (!source.rows)
        throw new Error("Empty BMF input; no schema/data established")
      if ((await fileHash(source.resolvedPath)) !== source.sha256)
        throw new Error(
          "BMF source changed during inventory; discard incomplete result"
        )
      sources.push(source)
    }
    const counts = db
      .prepare(
        `SELECT count(*) uniqueEins,
      coalesce(sum(occurrences-1),0) duplicateRows,
      coalesce(sum(occurrences>1),0) repeatedEins,
      coalesce(sum(name_conflict),0) differingNameEins,
      coalesce(sum(row_difference),0) differingRowEins FROM identities`
      )
      .get()
    const totals = sources.reduce(
      (r, s) => ({
        inputRows: r.inputRows + s.rows,
        acceptedRows: r.acceptedRows + s.acceptedRows,
        rejectedRows: r.rejectedRows + s.rejectedRows,
        bytes: r.bytes + s.bytes,
      }),
      { inputRows: 0, acceptedRows: 0, rejectedRows: 0, bytes: 0 }
    )
    if (
      totals.inputRows !== totals.acceptedRows + totals.rejectedRows ||
      totals.acceptedRows !== counts.uniqueEins + counts.duplicateRows
    )
      throw new Error("Corpus reconciliation failed")
    return {
      version: 1,
      kind: "irs_bmf_corpus_inventory",
      completedAt: utc(),
      durationSeconds: (Date.now() - started) / 1000,
      corpusDigest: hash(sources.map((s) => s.sha256).sort()),
      totals: { ...totals, ...counts },
      sources,
      selectionPolicy:
        "none; differing rows/names require versioned reconciliation before import",
      sourceDatesKnown: false,
      researchLedgerWrites: 0,
      published: 0,
      networkRequests: 0,
    }
  } finally {
    db.close()
    rmSync(temporary, { recursive: true, force: true })
  }
}
