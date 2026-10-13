import { readFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import { randomUUID } from "node:crypto"
import { readPrivateRows } from "./directory-projection.mjs"
import { privateWrite } from "./artifacts.mjs"
import { fileHash } from "./import.mjs"
import { hash, stable, utc } from "./store.mjs"
import { AUDIT_POLICY, reportedWebsite } from "./publication-policy.mjs"
import { validateAuditAge } from "./publication-plan.mjs"

export function fillMissingFilingFields(content, fields) {
  const record = { ...content }, added = []
  for (const field of ["website", "phone", "description"]) {
    const decision = fields[field]
    if (record[field] != null || !decision?.eligible) continue
    // Older immutable assessments may predate stricter URL admission. Reject
    // only that field; retain independently supported phone/description data.
    if (field === "website" && reportedWebsite(decision.value) !== decision.value) continue
    if (decision.basis !== "source_reported" || typeof decision.value !== "string" ||
        !decision.value || !/^\d{4}-\d{2}-\d{2}$/.test(decision.sourcePeriod ?? ""))
      throw new Error("Invalid filing field decision")
    record[field] = decision.value
    record[`${field}SourcePeriod`] = decision.sourcePeriod
    if (field !== "description") record[`${field}Basis`] = "source_reported"
    added.push(field)
  }
  return { record, added }
}

// Reuses the existing atomic publisher/rollback format. Exact previous digests
// bind the field merge to the canonical snapshot; a later edit is held by SQL.
export async function planFilingUpdates(client, {
  input, output, target, authorization, readCanonical, now = Date.now(), onlyEins = null,
}) {
  if (!/^[a-z0-9]{20}$/.test(target ?? "") || !authorization?.trim() || authorization.length > 500)
    throw new Error("Explicit target and authorization required")
  const report = JSON.parse(readFileSync(join(input, "report.json"), "utf8"))
  if (report.kind !== "nonprofit_filing_updates_v1" || report.policy !== AUDIT_POLICY || !report.completedAt)
    throw new Error("Completed field assessment required")
  validateAuditAge(report.asOf, now)
  const path = join(input, "updates.jsonl")
  if (await fileHash(path) !== report.recordsHash) throw new Error("Field assessment changed")
  mkdirSync(output, { mode: 0o700 })
  const manifest = { kind: "nonprofit_publication_plan_v1", batchId: randomUUID(),
    target, policy: AUDIT_POLICY, authorization, createdAt: utc(), auditAsOf: report.asOf,
    projectionHash: hash(report), records: 0, held: 0, holds: {}, chunks: [],
    fieldUpdate: { input, reportHash: hash(report), unchanged: 0, unselected: 0, added: { website: 0, phone: 0, description: 0 }, fieldsByEin: {} },
  }
  let pending = [], scanned = 0, previous = ""
  const save = (rows) => {
    if (!rows.length) return
    const payload = stable(rows)
    if (Buffer.byteLength(payload) > 2_000_000) {
      if (rows.length === 1) throw new Error("Field update exceeds byte limit")
      const middle = Math.floor(rows.length / 2); save(rows.slice(0, middle)); save(rows.slice(middle)); return
    }
    const number = manifest.chunks.length, file = `chunk-${String(number).padStart(6, "0")}.json`
    privateWrite(join(output, file), payload)
    manifest.chunks.push({ number, file, hash: hash(payload), records: rows.length, bytes: Buffer.byteLength(payload) })
    manifest.records += rows.length
  }
  const flush = async () => {
    if (!pending.length) return
    const eins = pending.map((r) => r.ein), existing = await readCanonical(eins)
    const byEin = new Map(existing.map((r) => [r.ein, r]))
    if (byEin.size !== existing.length || existing.some((r) => !eins.includes(r.ein)))
      throw new Error("Unexpected canonical population")
    const preflight = await client.rpc("nonprofit_directory_preflight", { p_eins: eins })
    if (preflight.settings?.target_ref !== target || preflight.settings?.policy_version !== AUDIT_POLICY ||
        preflight.rows?.length !== eins.length || new Set(preflight.rows.map((r) => r.ein)).size !== eins.length)
      throw new Error("Field preflight population/target mismatch")
    const states = new Map(preflight.rows.map((r) => [r.ein, r])), rows = [], holds = []
    for (const delta of pending) {
      const before = byEin.get(delta.ein), status = states.get(delta.ein)
      if (!status) throw new Error("Missing preflight EIN")
      const reason = status.hold || (!before ? "identity_not_published" :
        before.managed_by !== "import" || before.suppressed_at ? "identity_protected" :
        before.record_digest !== status.expectedDigest ? "previous_digest_changed" : null)
      if (reason) { manifest.held++; manifest.holds[reason] = (manifest.holds[reason] ?? 0) + 1; holds.push({ ein: delta.ein, reason }); continue }
      if (before.content.ein !== delta.ein || hash(before.content) !== before.record_digest)
        throw new Error("Canonical content/digest mismatch")
      const { record, added } = fillMissingFilingFields(before.content, delta.fields)
      if (!added.length) { manifest.fieldUpdate.unchanged++; continue }
      for (const field of added) manifest.fieldUpdate.added[field]++
      manifest.fieldUpdate.fieldsByEin[delta.ein] = added
      const recordText = stable(record)
      rows.push({ ein: delta.ein, recordText, recordDigest: hash(recordText), expectedDigest: before.record_digest })
    }
    if (holds.length) privateWrite(join(output, `holds-${scanned}.json`), holds)
    save(rows); pending = []
  }
  for await (const delta of readPrivateRows(path)) {
    if (!/^\d{9}$/.test(delta.ein) || delta.ein <= previous) throw new Error("Invalid delta EIN order")
    previous = delta.ein; scanned++
    if (onlyEins && !onlyEins.includes(delta.ein)) { manifest.fieldUpdate.unselected++; continue }
    pending.push(delta)
    if (pending.length === 250) await flush()
  }
  await flush()
  if (scanned !== report.records || scanned !== manifest.records + manifest.held + manifest.fieldUpdate.unchanged + manifest.fieldUpdate.unselected ||
      await fileHash(path) !== report.recordsHash) throw new Error("Field population/source changed")
  const plan = { ...manifest, manifestHash: hash(manifest) }
  privateWrite(join(output, "plan.json"), plan)
  return plan
}
