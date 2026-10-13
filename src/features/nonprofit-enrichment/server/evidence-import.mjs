import { createReadStream } from "node:fs"
import { createInterface } from "node:readline"
import { resolve } from "node:path"
import { fileHash } from "./import.mjs"
import { transaction, event, hash, utc } from "./store.mjs"
import { addEvidence } from "./queue.mjs"

// Normalized offline adapter: {ein, assertions:[{field,value,...evidence}]}.
// Checkpoint each committed row; external evidence never grants verification.
export async function ingestEvidence(db, input, { limit = 1000 } = {}) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100000)
    throw new Error("Evidence batch limit must be 1..100000")
  const file = resolve(input),
    sha = await fileHash(file)
  const population = db.prepare("SELECT count(*) n FROM organizations").get().n
  const sourceId = hash({ kind: "offline_evidence_v1", sha, population })
  db.prepare("INSERT OR IGNORE INTO sources VALUES (?,?,?,?,0,0,?)").run(
    sourceId,
    file,
    sha,
    "offline_evidence",
    utc()
  )
  const source = db.prepare("SELECT * FROM sources WHERE id=?").get(sourceId)
  const counts = { rows: 0, matched: 0, unmatched: 0, assertions: 0 }
  if (source.completed)
    return { ...counts, replayed: true, publicationBlocked: true }
  let ordinal = 0,
    exhausted = true
  for await (const line of createInterface({
    input: createReadStream(file, { encoding: "utf8" }),
    crlfDelay: Infinity,
  })) {
    if (!line.trim()) continue
    ordinal++
    if (ordinal <= source.cursor) continue
    if (counts.rows >= limit) {
      exhausted = false
      break
    }
    if (Buffer.byteLength(line) > 1_000_000)
      throw new Error("Evidence row exceeds 1 MB")
    const row = JSON.parse(line)
    if (!Array.isArray(row.assertions) || row.assertions.length > 100)
      throw new Error("Expected bounded assertions")
    transaction(db, () => {
      if (
        db.prepare("SELECT ein FROM organizations WHERE ein=?").get(row.ein)
      ) {
        for (const assertion of row.assertions) {
          addEvidence(db, row.ein, assertion)
          counts.assertions++
        }
        event(db, row.ein, "offline_evidence_import", {
          sourceSha256: sha,
          ordinal,
        })
        counts.matched++
      } else counts.unmatched++
      db.prepare("UPDATE sources SET cursor=? WHERE id=?").run(
        ordinal,
        sourceId
      )
    })
    counts.rows++
  }
  if ((await fileHash(file)) !== sha)
    throw new Error(
      "Evidence source changed during import; restore immutable input"
    )
  if (exhausted)
    db.prepare("UPDATE sources SET completed=1 WHERE id=?").run(sourceId)
  return {
    ...counts,
    sourceSha256: sha,
    completed: exhausted,
    publicationBlocked: true,
  }
}
