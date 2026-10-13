import { readFileSync, existsSync, mkdirSync } from "node:fs"
import { join, resolve } from "node:path"
import { hash, stable, utc } from "./store.mjs"
import { privateWrite } from "./artifacts.mjs"
import { AUDIT_POLICY } from "./publication-policy.mjs"
import { validateAuditAge } from "./publication-plan.mjs"

export function loadPublicationPlan(directory, target, confirmation) {
  const plan = JSON.parse(readFileSync(join(directory, "plan.json"), "utf8"))
  const { manifestHash, ...body } = plan
  if (
    plan.kind !== "nonprofit_publication_plan_v1" ||
    plan.policy !== AUDIT_POLICY ||
    plan.target !== target ||
    confirmation !== manifestHash ||
    hash(body) !== manifestHash
  )
    throw new Error("Publication plan/target/confirmation mismatch")
  validateAuditAge(plan.auditAsOf)
  let count = 0,
    lastEin = ""
  for (const [index, chunk] of plan.chunks.entries()) {
    if (chunk.number !== index || !/^chunk-\d{6}\.json$/.test(chunk.file))
      throw new Error("Invalid chunk sequence/path")
    const payload = readFileSync(join(directory, chunk.file), "utf8")
    if (
      hash(payload) !== chunk.hash ||
      Buffer.byteLength(payload) !== chunk.bytes ||
      chunk.bytes > 2_000_000
    )
      throw new Error("Publication chunk hash/size mismatch")
    const rows = JSON.parse(payload)
    if (
      !Array.isArray(rows) ||
      rows.length !== chunk.records ||
      rows.length < 1 ||
      rows.length > 1000
    )
      throw new Error("Invalid chunk population")
    for (const row of rows) {
      if (
        !/^\d{9}$/.test(row.ein) ||
        row.ein <= lastEin ||
        hash(row.recordText) !== row.recordDigest ||
        JSON.parse(row.recordText).ein !== row.ein
      )
        throw new Error("Invalid publication record/order/digest")
      lastEin = row.ein
    }
    count += rows.length
  }
  if (count !== plan.records)
    throw new Error("Publication manifest count mismatch")
  return plan
}

function verifyReceipt(receipt, chunk, rows) {
  if (
    !receipt ||
    receipt.payloadHash !== chunk.hash ||
    receipt.rolledBackAt ||
    receipt.outcomes?.length !== rows.length
  )
    throw new Error("Publication receipt inconsistent or rolled back")
  const ids = new Set(rows.map((r) => r.ein)),
    seen = new Set()
  for (const result of receipt.outcomes) {
    if (
      !ids.has(result.ein) ||
      seen.has(result.ein) ||
      !["inserted", "updated", "unchanged", "held"].includes(result.status)
    )
      throw new Error("Publication outcome mismatch")
    seen.add(result.ein)
  }
}

async function publishChunk(client, plan, chunk, payload, beforeWrite) {
  const args = { p_batch: plan.batchId, p_chunk: chunk.number }
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      const saved = await client.rpc("nonprofit_publication_receipt", args)
      if (saved) return { ...saved, replayed: true }
    }
    // A serving failure must escape write retries without another write attempt.
    await beforeWrite({ number: chunk.number, records: chunk.records, attempt })
    try {
      // The write RPC already checks its atomic receipt under the batch lock.
      // Read separately only after an uncertain response, avoiding a round trip
      // for every new chunk while retaining lost-ack recovery.
      return await client.rpc("publish_nonprofit_directory_chunk", {
        ...args,
        p_manifest_hash: plan.manifestHash,
        p_payload: payload,
        p_target: plan.target,
        p_policy: plan.policy,
        p_authorization: plan.authorization,
      })
    } catch (error) {
      if (attempt === 2) throw error
      await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt))
    }
  }
}

export async function publishDirectory(
  client,
  {
    input,
    target,
    confirmation,
    onChunk = async () => {},
    beforeWrite = async () => {},
    maxChunks = Infinity,
    shouldStop = () => false,
  }
) {
  if (
    maxChunks !== Infinity &&
    (!Number.isSafeInteger(maxChunks) || maxChunks < 1)
  )
    throw new Error("Publication maxChunks must be a positive integer")
  const directory = resolve(input),
    plan = loadPublicationPlan(directory, target, confirmation)
  // Prove anonymous reads work before the first write; no service-role-only canary.
  await client.publicRpc("search_nonprofit_directory", {
    p_query: "",
    p_limit: 1,
  })
  const receipts = join(directory, "receipts")
  mkdirSync(receipts, { recursive: true, mode: 0o700 })
  const report = {
    batchId: plan.batchId,
    target,
    manifestHash: plan.manifestHash,
    startedAt: utc(),
    receiptOutcomes: { inserted: 0, updated: 0, unchanged: 0, held: 0 },
    replayedChunks: 0,
    canaryEin: null,
    attemptedChunks: 0,
    completedChunks: 0,
  }
  for (const chunk of plan.chunks) {
    validateAuditAge(plan.auditAsOf)
    const payload = readFileSync(join(directory, chunk.file), "utf8"),
      rows = JSON.parse(payload)
    if (hash(payload) !== chunk.hash)
      throw new Error("Chunk changed after preflight")
    const local = join(receipts, `${chunk.number}.json`)
    let receipt
    if (existsSync(local)) {
      const saved = JSON.parse(readFileSync(local, "utf8"))
      verifyReceipt(saved, chunk, rows)
      const remote = await client.rpc("nonprofit_publication_receipt", {
        p_batch: plan.batchId,
        p_chunk: chunk.number,
      })
      verifyReceipt(remote, chunk, rows)
      if (stable(remote.outcomes) !== stable(saved.outcomes))
        throw new Error("Saved publication receipt changed remotely")
      receipt = { ...remote, replayed: true }
    } else {
      if (report.attemptedChunks >= maxChunks || shouldStop()) break
      report.attemptedChunks++
      receipt = await publishChunk(client, plan, chunk, payload, beforeWrite)
    }
    verifyReceipt(receipt, chunk, rows)
    if (receipt.replayed) report.replayedChunks++
    for (const r of receipt.outcomes) report.receiptOutcomes[r.status]++
    if (!existsSync(local)) privateWrite(local, receipt)
    // First successful chunk is the canary; then continue the entire eligible manifest.
    if (!report.canaryEin) {
      const candidate = receipt.outcomes.find((r) =>
        ["inserted", "updated", "unchanged"].includes(r.status)
      )
      if (candidate) {
        const expected = JSON.parse(
          rows.find((r) => r.ein === candidate.ein).recordText
        )
        const actual = await client.publicRpc("get_nonprofit_directory", {
          p_ein: candidate.ein,
        })
        if (
          !actual ||
          Object.entries(expected).some(([k, v]) => actual[k] !== v)
        )
          throw new Error(
            "Anonymous public canary differs; stop and inspect committed receipts"
          )
        report.canaryEin = candidate.ein
      }
    }
    // Operator health checks run after the committed receipt is durable. Failure
    // stops the batch here; it must not be swallowed by write retry handling.
    await onChunk({ number: chunk.number, records: rows.length, receipt })
    report.completedChunks++
  }
  report.complete = report.completedChunks === plan.chunks.length
  report[report.complete ? "completedAt" : "pausedAt"] = utc()
  const path = join(directory, `publication-${Date.now()}.json`)
  privateWrite(path, report)
  return { ...report, reportPath: path }
}
