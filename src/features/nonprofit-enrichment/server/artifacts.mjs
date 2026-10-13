import {
  closeSync,
  openSync,
  writeSync,
  fsyncSync,
  linkSync,
  unlinkSync,
  mkdirSync,
  existsSync,
} from "node:fs"
import { dirname, resolve } from "node:path"
import { randomUUID } from "node:crypto"
import { stable, FIELDS } from "./store.mjs"

export function privateWrite(path, value) {
  const output = resolve(path)
  mkdirSync(dirname(output), { recursive: true, mode: 0o700 })
  if (existsSync(output))
    throw new Error("Output exists; choose a new immutable artifact path")
  const temporary = `${output}.${randomUUID()}.tmp`
  const fd = openSync(temporary, "wx", 0o600)
  try {
    writeSync(
      fd,
      typeof value === "string" ? value : JSON.stringify(value, null, 2) + "\n"
    )
    fsyncSync(fd)
  } catch (error) {
    unlinkSync(temporary)
    throw error
  } finally {
    closeSync(fd)
  }
  linkSync(temporary, output)
  unlinkSync(temporary)
  return output
}
export function exportRecords(db, output) {
  // Stream output so exporting the full corpus never loads the dataset in memory.
  const target = resolve(output)
  if (existsSync(target)) throw new Error("Export exists; choose a new path")
  mkdirSync(dirname(target), { recursive: true, mode: 0o700 })
  const temporary = `${target}.${randomUUID()}.tmp`,
    fd = openSync(temporary, "wx", 0o600)
  let n = 0
  const evidence = db.prepare(
    "SELECT field,value,state,source_url,observed_at,body FROM evidence WHERE ein=? ORDER BY field,id"
  )
  const missing = db.prepare(
    "SELECT field,reason,observed_at FROM unresolved WHERE ein=?"
  )
  try {
    // Node 22.13 SQLite can crash when an active iterate() cursor is mixed
    // with other prepared statements. Keyset pages bound memory without it.
    const page = db.prepare(
      "SELECT o.ein,o.identity,j.status FROM organizations o JOIN jobs j USING(ein) WHERE o.ein>? ORDER BY o.ein LIMIT 1000"
    )
    let after = ""
    while (true) {
      const records = page.all(after)
      if (!records.length) break
      for (const r of records) {
        const assertions = evidence.all(r.ein).map((e) => ({
          ...e,
          value: JSON.parse(e.value),
          body: JSON.parse(e.body),
        }))
        const values = Object.fromEntries(
          FIELDS.map((f) => [
            f,
            [
              ...new Set(
                assertions
                  .filter((a) => a.field === f)
                  .map((a) => stable(a.value))
              ),
            ],
          ])
        )
        const conflicts = Object.entries(values)
          .filter(
            ([f, v]) => ["website", "headquarters"].includes(f) && v.length > 1
          )
          .map(([f]) => f)
        writeSync(
          fd,
          stable({
            ein: r.ein,
            identity: JSON.parse(r.identity),
            jobStatus: r.status,
            assertions,
            unresolved: missing.all(r.ein),
            conflictingFields: conflicts,
            publicDisplayEligible: false,
            publicationBlocked: true,
          }) + "\n"
        )
        n++
      }
      after = records.at(-1).ein
    }
    fsyncSync(fd)
  } catch (error) {
    unlinkSync(temporary)
    throw error
  } finally {
    closeSync(fd)
  }
  linkSync(temporary, target)
  unlinkSync(temporary)
  return { records: n, path: target, publicationBlocked: true }
}
