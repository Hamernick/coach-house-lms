import { createReadStream, statSync } from "node:fs"
import { createInterface } from "node:readline"
import { resolve } from "node:path"
import { createHash } from "node:crypto"
import {
  readIrsEoCsvRows,
  buildIrsEoDiscoveryCandidate,
} from "../../../../scripts/resource-map/lib/irs-eo-acquisition.mjs"
import { hash, stable, transaction, utc, event } from "./store.mjs"

export async function fileHash(file) {
  const digest = createHash("sha256")
  for await (const chunk of createReadStream(file)) digest.update(chunk)
  return digest.digest("hex")
}
async function* rows(file) {
  if (file.toLowerCase().endsWith(".csv")) {
    for await (const row of readIrsEoCsvRows(file)) {
      const candidate = buildIrsEoDiscoveryCandidate(row, {
        sourceFile: file.split("/").at(-1),
      })
      if (!candidate) throw new Error("Invalid IRS row; import held")
      yield candidate
    }
  } else {
    const lines = createInterface({
      input: createReadStream(file, { encoding: "utf8" }),
      crlfDelay: Infinity,
    })
    for await (const line of lines) {
      if (Buffer.byteLength(line) > 1_000_000)
        throw new Error("Identity row exceeds byte limit")
      if (line.trim()) yield JSON.parse(line)
    }
  }
}
export async function importIdentities(
  db,
  inputs,
  { limit = 10000, all = false } = {}
) {
  if (!all && (!Number.isInteger(limit) || limit < 1 || limit > 30000))
    throw new Error("Sample must be 1..30000, or explicitly use --all")
  let added = 0,
    scanned = 0
  for (const input of inputs) {
    const file = resolve(input)
    if (!statSync(file).isFile()) throw new Error("Input must be a file")
    const sha = await fileHash(file),
      selection = all ? "all" : String(limit)
    if (
      db
        .prepare(
          "SELECT id FROM sources WHERE path=? AND kind='identity' AND completed=0 AND sha256<>?"
        )
        .get(file, sha)
    )
      throw new Error(
        "An interrupted import uses different source bytes; restore its immutable input first"
      )
    const sourceId = hash({ sha, selection, kind: "identity" })
    db.prepare("INSERT OR IGNORE INTO sources VALUES (?,?,?,?,0,0,?)").run(
      sourceId,
      file,
      sha,
      "identity",
      utc()
    )
    const source = db.prepare("SELECT * FROM sources WHERE id=?").get(sourceId)
    if (source.completed) continue
    let cursor = 0,
      batch = []
    const flush = () =>
      transaction(db, () => {
        for (const { identity, ordinal } of batch) {
          const ein = String(identity.ein ?? "")
          if (
            !/^\d{9}$/.test(ein) ||
            typeof identity.organizationName !== "string" ||
            !identity.organizationName.trim()
          )
            throw new Error(
              "Identity requires a nine-digit EIN and organizationName"
            )
          const result = db
            .prepare("INSERT OR IGNORE INTO organizations VALUES (?,?,?,?,?)")
            .run(ein, stable(identity), sourceId, ordinal, utc())
          added += Number(result.changes)
          db.prepare(
            "INSERT OR IGNORE INTO jobs(ein,updated_at) VALUES (?,?)"
          ).run(ein, utc())
        }
        db.prepare("UPDATE sources SET cursor=? WHERE id=?").run(
          cursor,
          sourceId
        )
        batch = []
      })
    for await (const identity of rows(file)) {
      if (!all && cursor >= limit) break
      cursor++
      scanned++
      if (cursor <= source.cursor) continue
      batch.push({ identity, ordinal: cursor })
      if (batch.length >= 1000) flush()
    }
    if (batch.length) flush()
    if ((await fileHash(file)) !== sha)
      throw new Error(
        "Source changed during import; incomplete source held from claims"
      )
    transaction(db, () => {
      db.prepare("UPDATE sources SET completed=1 WHERE id=?").run(sourceId)
      event(db, null, "identity_import_complete", {
        sourceId,
        sha,
        rows: cursor,
        selection,
      })
    })
  }
  return { added, scanned, publicationBlocked: true }
}
