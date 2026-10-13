import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { privateWrite } from "./artifacts.mjs"
import { hash, stable } from "./store.mjs"
import { loadCategoryPlan } from "./category-publication-plan.mjs"

export function verifyCategoryOutcomes(outcomes, rows) {
  if (!Array.isArray(outcomes) || outcomes.length !== rows.length)
    throw new Error("Category receipt population mismatch")
  const wanted = new Set(rows.map((r) => r.ein)),
    seen = new Set()
  for (const row of outcomes) {
    if (
      !wanted.has(row.ein) ||
      seen.has(row.ein) ||
      !["inserted", "updated", "unchanged", "held", "pending"].includes(
        row.status
      )
    )
      throw new Error("Invalid category receipt")
    seen.add(row.ein)
  }
}

export async function publishCategoryPlan(
  client,
  { input, target, confirmation, maxChunks = 1, shouldStop = () => false, beforeWrite = async () => {} }
) {
  const plan = loadCategoryPlan(input)
  if (
    plan.target !== target ||
    confirmation !== plan.manifestHash ||
    !Number.isSafeInteger(maxChunks) ||
    maxChunks < 1 ||
    maxChunks > 200
  )
    throw new Error(
      "Explicit category plan target/hash and bounded chunk count required"
    )
  const counts = {},
    pending = [],
    held = []
  let completedChunks = 0,
    attempted = 0
  // Anonymous canaries establish availability before and after each bounded chunk.
  await client.publicRpc("search_nonprofit_directory_v2", {
    p_category: "food",
    p_limit: 1,
  })
  for (const chunk of plan.chunks) {
    const rows = JSON.parse(readFileSync(join(input, chunk.file), "utf8"))
    const receiptPath = join(input, "receipts", `${chunk.number}.json`)
    let receipt
    if (existsSync(receiptPath)) {
      receipt = JSON.parse(readFileSync(receiptPath, "utf8"))
      if (
        receipt.manifestHash !== plan.manifestHash ||
        receipt.chunkHash !== chunk.hash
      )
        throw new Error("Saved category receipt mismatch")
      const remote = await client.rpc("nonprofit_category_receipt", {
        p_batch: plan.batchId,
        p_chunk: chunk.number,
      })
      if (
        !remote ||
        remote.rolledBackAt ||
        remote.manifestHash !== plan.manifestHash ||
        remote.payloadHash !== receipt.payloadHash ||
        stable(remote.outcomes) !== stable(receipt.outcomes)
      )
        throw new Error(
          "Remote category receipt missing, changed or rolled back"
        )
      verifyCategoryOutcomes(receipt.outcomes, rows)
    } else {
      if (attempted >= maxChunks || shouldStop()) break
      attempted++
      const preparedPath = join(input, "prepared", `${chunk.number}.json`)
      let prepared
      if (existsSync(preparedPath))
        prepared = JSON.parse(readFileSync(preparedPath, "utf8"))
      else {
        const preflight = await client.rpc("nonprofit_category_preflight", {
          p_eins: rows.map((r) => r.ein),
        })
        if (
          !Array.isArray(preflight) ||
          preflight.length !== rows.length ||
          new Set(preflight.map((r) => r.ein)).size !== rows.length
        )
          throw new Error("Invalid category preflight")
        const byEin = new Map(preflight.map((r) => [r.ein, r]))
        const payload = stable(
          rows.map((r) => {
            const before = byEin.get(r.ein)
            if (
              !before ||
              (before.expectedDigest !== null &&
                !/^[0-9a-f]{64}$/.test(before.expectedDigest))
            )
              throw new Error("Invalid preflight digest")
            return { ...r, expectedDigest: before.expectedDigest }
          })
        )
        prepared = {
          manifestHash: plan.manifestHash,
          chunkHash: chunk.hash,
          payload,
          payloadHash: hash(payload),
        }
        privateWrite(preparedPath, prepared)
      }
      if (
        prepared.manifestHash !== plan.manifestHash ||
        prepared.chunkHash !== chunk.hash ||
        hash(prepared.payload) !== prepared.payloadHash
      )
        throw new Error("Prepared category payload changed")
      const preparedRows = JSON.parse(prepared.payload)
      if (
        stable(preparedRows.map(({ expectedDigest: _digest, ...r }) => r)) !==
        stable(rows)
      )
        throw new Error("Prepared category rows differ")
      // This hook must pass for every possible write, including lost-ack resumes.
      // Saved receipts above remain read-only and never consume the write budget.
      await beforeWrite({ batchId: plan.batchId, number: chunk.number })
      if (shouldStop()) break
      // Unknown acknowledgments resume this exact saved payload; RPC atomically replays its receipt.
      const result = await client.rpc("publish_nonprofit_category_chunk", {
        p_batch: plan.batchId,
        p_manifest_hash: plan.manifestHash,
        p_chunk: chunk.number,
        p_payload: prepared.payload,
        p_target: target,
        p_authorization: plan.authorization,
      })
      verifyCategoryOutcomes(result.outcomes, rows)
      receipt = {
        ...result,
        manifestHash: plan.manifestHash,
        chunkHash: chunk.hash,
        payloadHash: prepared.payloadHash,
      }
      privateWrite(receiptPath, receipt)
      await client.publicRpc("search_nonprofit_directory_v2", {
        p_category: "food",
        p_limit: 1,
      })
    }
    completedChunks++
    for (const row of receipt.outcomes) {
      counts[row.status] = (counts[row.status] ?? 0) + 1
      if (row.status === "pending") pending.push(row.ein)
      if (row.status === "held") held.push(row)
    }
  }
  return {
    batchId: plan.batchId,
    completedChunks,
    totalChunks: plan.chunks.length,
    counts,
    pending,
    held,
    processed: completedChunks === plan.chunks.length,
    fullyApplied:
      completedChunks === plan.chunks.length &&
      pending.length === 0 &&
      held.length === 0,
  }
}
