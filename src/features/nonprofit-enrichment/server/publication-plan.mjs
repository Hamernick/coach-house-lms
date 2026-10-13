import { readFileSync, mkdirSync } from "node:fs"
import { join, resolve } from "node:path"
import { randomUUID } from "node:crypto"
import { readPrivateRows } from "./directory-projection.mjs"
import { fileHash } from "./import.mjs"
import { privateWrite } from "./artifacts.mjs"
import { hash, stable, utc } from "./store.mjs"
import { AUDIT_POLICY } from "./publication-policy.mjs"

export function validateAuditAge(asOf, now = Date.now()) {
  const date = Date.parse(asOf)
  if (!Number.isFinite(date) || date > now || now - date > 7 * 86400_000)
    throw new Error(
      "Audit is invalid or older than seven days; re-audit retained evidence before publication"
    )
}

export async function planPublication(
  client,
  { input, output, target, authorization, now = Date.now(), chunkSize = 1000 }
) {
  if (
    !/^[a-z0-9]{20}$/.test(target ?? "") ||
    !authorization?.trim() ||
    authorization.length > 500
  )
    throw new Error("Explicit target and authorization reference required")
  if (!Number.isSafeInteger(chunkSize) || chunkSize < 1 || chunkSize > 1000)
    throw new Error("Publication chunk size must be 1..1000")
  const directory = resolve(input),
    out = resolve(output)
  const projection = JSON.parse(
    readFileSync(join(directory, "projection.json"), "utf8")
  )
  if (
    projection.kind !== "nonprofit_directory_projection_v1" ||
    projection.policy !== AUDIT_POLICY
  )
    throw new Error("Unsupported projection")
  validateAuditAge(projection.auditAsOf, now)
  const recordsFile = join(directory, "records.jsonl")
  if ((await fileHash(recordsFile)) !== projection.recordsHash)
    throw new Error("Projection changed")
  mkdirSync(out, { mode: 0o700 })
  const manifest = {
    kind: "nonprofit_publication_plan_v1",
    batchId: randomUUID(),
    target,
    policy: AUDIT_POLICY,
    authorization,
    createdAt: utc(),
    auditAsOf: projection.auditAsOf,
    projectionHash: hash(projection),
    records: 0,
    held: 0,
    holds: {},
    chunks: [],
  }
  let pending = [],
    scanned = 0,
    previous = ""
  const saveChunk = (rows) => {
    if (!rows.length) return
    const payload = stable(rows)
    if (Buffer.byteLength(payload) > 2_000_000) {
      if (rows.length === 1)
        throw new Error("Record exceeds publication byte limit")
      const middle = Math.floor(rows.length / 2)
      saveChunk(rows.slice(0, middle))
      saveChunk(rows.slice(middle))
      return
    }
    const number = manifest.chunks.length,
      file = `chunk-${String(number).padStart(6, "0")}.json`
    privateWrite(join(out, file), payload)
    manifest.chunks.push({
      number,
      file,
      hash: hash(payload),
      records: rows.length,
      bytes: Buffer.byteLength(payload),
    })
    manifest.records += rows.length
  }
  const flush = async () => {
    if (!pending.length) return
    const response = await client.rpc("nonprofit_directory_preflight", {
      p_eins: pending.map((r) => r.ein),
    })
    if (
      response.settings?.target_ref !== target ||
      response.settings?.policy_version !== AUDIT_POLICY
    )
      throw new Error("Database target/policy is not configured")
    const statuses = new Map(response.rows?.map((r) => [r.ein, r]))
    if (
      statuses.size !== pending.length ||
      response.rows.length !== pending.length
    )
      throw new Error("Preflight population mismatch")
    const rows = [],
      held = []
    for (const r of pending) {
      const status = statuses.get(r.ein)
      if (!status) throw new Error("Preflight omitted EIN")
      if (status.hold) {
        manifest.held++
        manifest.holds[status.hold] = (manifest.holds[status.hold] ?? 0) + 1
        held.push({ ein: r.ein, reason: status.hold })
      } else rows.push({ ...r, expectedDigest: status.expectedDigest ?? null })
    }
    if (held.length) privateWrite(join(out, `holds-${scanned}.json`), held)
    saveChunk(rows)
    pending = []
  }
  for await (const row of readPrivateRows(recordsFile)) {
    if (
      !/^\d{9}$/.test(row.ein) ||
      row.ein <= previous ||
      hash(row.recordText) !== row.recordDigest ||
      JSON.parse(row.recordText).ein !== row.ein
    )
      throw new Error("Projection record/order/digest invalid")
    previous = row.ein
    scanned++
    pending.push(row)
    if (pending.length === chunkSize) await flush()
  }
  await flush()
  if (
    scanned !== projection.records ||
    manifest.records + manifest.held !== scanned ||
    (await fileHash(recordsFile)) !== projection.recordsHash
  )
    throw new Error("Publication plan population/input mismatch")
  const plan = { ...manifest, manifestHash: hash(manifest) }
  privateWrite(join(out, "plan.json"), plan)
  return { ...plan, directory: out, publicWrites: 0 }
}
