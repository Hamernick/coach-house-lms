import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { DatabaseSync } from "node:sqlite"
import {
  planCategoryPublication,
  loadCategoryPlan,
} from "../server/category-publication-plan.mjs"
import { publishCategoryPlan } from "../server/category-publisher.mjs"
import { hash } from "../server/store.mjs"

const target = "abcdefghijklmnopqrst"
function fixture(fn) {
  return async () => {
    const root = mkdtempSync(join(tmpdir(), "category-publish-")),
      input = join(root, "mapping"),
      output = join(root, "plan")
    mkdirSync(input)
    const db = new DatabaseSync(join(input, "classifications.sqlite"))
    db.exec(
      "CREATE TABLE classifications(ein TEXT PRIMARY KEY, raw_codes TEXT, categories TEXT, state TEXT)"
    )
    const put = db.prepare("INSERT INTO classifications VALUES(?,?,?,?)")
    put.run("012345678", '["K31"]', '["food"]', "mapped")
    put.run("012345679", '["X20"]', '["faith"]', "mapped")
    put.run("012345680", '[""]', "[]", "unclassified")
    db.close()
    writeFileSync(
      join(input, "report.json"),
      JSON.stringify({
        complete: true,
        mappingVersion: "irs-organization-topics-v1",
      })
    )
    try {
      await fn({ root, input, output })
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  }
}
function fake() {
  const receipts = new Map(),
    payloads = []
  let loseAck = true
  const client = {
    publicRpc: async () => [],
    rpc: async (name, args) => {
      if (name === "nonprofit_category_preflight")
        return args.p_eins.map((ein) => ({ ein, expectedDigest: null }))
      const key = `${args.p_batch}:${args.p_chunk}`
      if (name === "nonprofit_category_receipt") return receipts.get(key)
      assert.equal(name, "publish_nonprofit_category_chunk")
      payloads.push(args.p_payload)
      if (receipts.has(key))
        return { outcomes: receipts.get(key).outcomes, replayed: true }
      const result = {
        manifestHash: args.p_manifest_hash,
        payloadHash: hash(args.p_payload),
        outcomes: JSON.parse(args.p_payload).map((r, i) => ({
          ein: r.ein,
          status: i ? "pending" : "inserted",
        })),
      }
      receipts.set(key, result)
      if (loseAck) {
        loseAck = false
        throw new Error("Acknowledgment lost after commit")
      }
      return result
    },
  }
  return { client, receipts, payloads }
}
test(
  "immutable category plan checks source decisions, payloads and EIN boundaries",
  fixture(async ({ input, output }) => {
    const plan = planCategoryPublication({
      input,
      output,
      target,
      authorization: "existing authorization",
      limit: 1,
    })
    assert.equal(plan.records, 1)
    assert.equal(plan.lastEin, "012345678")
    assert.equal(loadCategoryPlan(output).manifestHash, plan.manifestHash)
    const chunk = join(output, plan.chunks[0].file)
    writeFileSync(chunk, "[]")
    assert.throws(() => loadCategoryPlan(output), /chunk changed/)
  })
)
test(
  "lost acknowledgments replay identical prepared data; pending identities are retryable",
  fixture(async ({ root, input, output }) => {
    const plan = planCategoryPublication({
      input,
      output,
      target,
      authorization: "existing authorization",
    })
    const { client, receipts, payloads } = fake()
    const args = { input: output, target, confirmation: plan.manifestHash }
    await assert.rejects(
      publishCategoryPlan(client, { ...args, target: "wrong" }),
      /target/
    )
    await assert.rejects(
      publishCategoryPlan(client, args),
      /Acknowledgment lost/
    )
    const result = await publishCategoryPlan(client, args)
    assert.equal(payloads[0], payloads[1])
    assert.equal(result.processed, true)
    assert.equal(result.fullyApplied, false)
    assert.deepEqual(result.pending, ["012345679"])
    const replay = await publishCategoryPlan(client, args)
    assert.deepEqual(replay.counts, result.counts)
    assert.equal(payloads.length, 2)
    const retry = planCategoryPublication({
      input,
      output: join(root, "retry"),
      target,
      authorization: "existing authorization",
      retryFrom: output,
    })
    assert.equal(retry.records, 1)
    assert.equal(retry.lastEin, "012345679")
    receipts.get(`${plan.batchId}:0`).rolledBackAt = "2026-10-07"
    await assert.rejects(publishCategoryPlan(client, args), /rolled back/)
  })
)
test(
  "a changed stored classification cannot become a publication plan",
  fixture(async ({ input, output }) => {
    const db = new DatabaseSync(join(input, "classifications.sqlite"))
    db.exec(
      `UPDATE classifications SET categories='["housing"]' WHERE ein='012345678'`
    )
    db.close()
    await assert.rejects(
      async () =>
        planCategoryPublication({
          input,
          output,
          target,
          authorization: "existing authorization",
        }),
      /differs/
    )
  })
)

test(
  "category guards block writes, recheck lost acknowledgments and skip saved receipts",
  fixture(async ({ input, output }) => {
    const plan = planCategoryPublication({ input, output, target, authorization: "existing authorization" })
    const { client, payloads } = fake()
    const args = { input: output, target, confirmation: plan.manifestHash }
    let checks = 0
    const beforeWrite = async () => { checks++; throw new Error("Serving unhealthy") }
    await assert.rejects(publishCategoryPlan(client, { ...args, beforeWrite }), /Serving unhealthy/)
    assert.equal(payloads.length, 0)
    const allowed = async () => { checks++ }
    await assert.rejects(publishCategoryPlan(client, { ...args, beforeWrite: allowed }), /Acknowledgment lost/)
    await assert.rejects(publishCategoryPlan(client, { ...args, beforeWrite }), /Serving unhealthy/)
    assert.equal(payloads.length, 1)
    await publishCategoryPlan(client, { ...args, beforeWrite: allowed })
    assert.equal(payloads.length, 2)
    assert.equal(checks, 4)
    await publishCategoryPlan(client, { ...args, beforeWrite })
    assert.equal(checks, 4)
    assert.equal(payloads.length, 2)
  })
)
test(
  "category publication honors a stop arriving during the pre-write check",
  fixture(async ({ input, output }) => {
    const plan = planCategoryPublication({ input, output, target, authorization: "existing authorization" })
    const { client, payloads } = fake()
    let stopped = false
    const result = await publishCategoryPlan(client, {
      input: output, target, confirmation: plan.manifestHash,
      beforeWrite: async () => { stopped = true }, shouldStop: () => stopped,
    })
    assert.equal(result.processed, false)
    assert.equal(result.completedChunks, 0)
    assert.equal(payloads.length, 0)
  })
)
