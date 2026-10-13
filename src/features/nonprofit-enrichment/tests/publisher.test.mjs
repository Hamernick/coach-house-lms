import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { stable, hash } from "../server/store.mjs"
import { AUDIT_POLICY } from "../server/publication-policy.mjs"
import {
  prepareDirectory,
  directoryRecord,
} from "../server/directory-projection.mjs"
import { planPublication } from "../server/publication-plan.mjs"
import { publishDirectory, loadPublicationPlan } from "../server/publisher.mjs"

import { publicationHealth } from "../server/publication-health.mjs"

test("pre-write failure is not retried and bounded resume reads saved receipts", async (t) => {
  const f = await fixture(t, 5),
    input = join(f.dir, "bounded")
  const plan = await planPublication(f.client, {
    input: f.projection,
    output: input,
    target,
    authorization: "publish",
    chunkSize: 2,
  })
  const args = { input, target, confirmation: plan.manifestHash, maxChunks: 1 }
  let guards = 0
  await assert.rejects(
    publishDirectory(f.client, {
      ...args,
      beforeWrite: async () => {
        guards++
        throw new Error("serving unhealthy")
      },
    }),
    /serving unhealthy/
  )
  assert.equal(guards, 1)
  assert.equal(f.getWrites(), 0)
  const first = await publishDirectory(f.client, args)
  assert.equal(first.complete, false)
  assert.equal(first.completedChunks, 1)
  const calls = [],
    rpc = f.client.rpc
  f.client.rpc = async (name, payload) => {
    calls.push([name, payload.p_chunk])
    return rpc(name, payload)
  }
  const second = await publishDirectory(f.client, args)
  assert.equal(second.complete, false)
  assert.equal(second.attemptedChunks, 1)
  assert.equal(second.replayedChunks, 1)
  assert.ok(
    calls.some(
      ([name, n]) => name === "nonprofit_publication_receipt" && n === 0
    )
  )
  assert.ok(
    !calls.some(
      ([name, n]) => name === "publish_nonprofit_directory_chunk" && n === 0
    )
  )
  const third = await publishDirectory(f.client, args)
  assert.equal(third.complete, true)
  assert.equal(f.records.size, 5)
  assert.equal(f.getWrites(), 3)
})

test("resume rejects changed or rolled-back receipts before any new write", async (t) => {
  const f = await fixture(t, 3),
    input = join(f.dir, "receipt-change")
  const plan = await planPublication(f.client, {
    input: f.projection,
    output: input,
    target,
    authorization: "publish",
    chunkSize: 2,
  })
  const args = { input, target, confirmation: plan.manifestHash, maxChunks: 1 }
  await publishDirectory(f.client, args)
  const receipt = f.receipts.get(`${plan.batchId}:0`)
  receipt.outcomes[0].status = "updated"
  await assert.rejects(publishDirectory(f.client, args), /changed remotely/)
  receipt.rolledBackAt = new Date().toISOString()
  await assert.rejects(publishDirectory(f.client, args), /rolled back/)
  assert.equal(f.getWrites(), 1)
})

const target = "abcdefghijklmnopqrst"
const decision = (ein) => ({
  ein,
  policy: AUDIT_POLICY,
  directory: { eligible: true, name: `Community ${ein}` },
  fields: {},
  location: { address: null },
  rawSecret: "never export",
})
async function fixture(t, count = 3) {
  const dir = mkdtempSync(join(tmpdir(), "nonprofit-publish-"))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const rows = Array.from({ length: count }, (_, i) =>
    decision(String(100000000 + i))
  )
  const body = rows.map(stable).join("\n") + "\n"
  writeFileSync(join(dir, "eligibility.jsonl"), body)
  writeFileSync(
    join(dir, "report.json"),
    stable({
      policy: AUDIT_POLICY,
      completedAt: new Date().toISOString(),
      asOf: new Date().toISOString(),
      organizations: count,
      directoryEligible: count,
      outputHashes: { "eligibility.jsonl": hash(body) },
    })
  )
  const projection = join(dir, "projection")
  await prepareDirectory(dir, projection)
  const records = new Map(),
    receipts = new Map()
  let writes = 0,
    lostAck = false
  const client = {
    async rpc(name, args) {
      if (name === "nonprofit_directory_preflight")
        return {
          settings: { target_ref: target, policy_version: AUDIT_POLICY },
          rows: args.p_eins.map((ein) => ({
            ein,
            hold: null,
            expectedDigest: records.get(ein)?.digest ?? null,
          })),
        }
      if (name === "nonprofit_publication_receipt")
        return receipts.get(`${args.p_batch}:${args.p_chunk}`) ?? null
      if (name === "publish_nonprofit_directory_chunk") {
        // Match the deployed SQL's idempotent, locked receipt check.
        const saved = receipts.get(`${args.p_batch}:${args.p_chunk}`)
        if (saved) {
          assert.equal(saved.payloadHash, hash(args.p_payload))
          return { ...saved, replayed: true }
        }
        writes++
        const rows = JSON.parse(args.p_payload)
        for (const row of rows)
          records.set(row.ein, {
            record: JSON.parse(row.recordText),
            digest: row.recordDigest,
          })
        const receipt = {
          payloadHash: hash(args.p_payload),
          outcomes: rows.map((r) => ({ ein: r.ein, status: "inserted" })),
        }
        receipts.set(`${args.p_batch}:${args.p_chunk}`, receipt)
        if (!lostAck) {
          lostAck = true
          throw new Error("Connection lost after commit")
        }
        return receipt
      }
      throw new Error("Unexpected RPC")
    },
    async publicRpc(name, args) {
      return name === "search_nonprofit_directory"
        ? []
        : (records.get(args.p_ein)?.record ?? null)
    },
  }
  return { dir, projection, client, records, receipts, getWrites: () => writes }
}

test("projection excludes exact street, raw source evidence, unknown contacts and inferred services", () => {
  const d = decision("012345678")
  d.fields = {
    phone: { eligible: false, value: "personal phone" },
    filing_address: { eligible: true, value: { street: "PRIVATE" } },
    services: { eligible: false, value: ["unproven"] },
  }
  d.location.address = {
    street: "PRIVATE",
    city: "Chicago",
    state: "IL",
    postalCode: "60601",
  }
  const record = directoryRecord(d)
  assert.equal(record.phone, null)
  assert.equal(record.city, "Chicago")
  assert.ok(!stable(record).includes("PRIVATE"))
  assert.ok(!stable(record).includes("unproven"))
  assert.ok(!stable(record).includes("never export"))
})

test("publisher resumes a committed chunk after lost acknowledgment, without duplicate writes", async (t) => {
  const f = await fixture(t, 1001),
    out = join(f.dir, "plan")
  const plan = await planPublication(f.client, {
    input: f.projection,
    output: out,
    target,
    authorization: "User requested publish",
  })
  assert.equal(plan.chunks.length, 2)
  assert.equal(plan.records, 1001)
  const report = await publishDirectory(f.client, {
    input: out,
    target,
    confirmation: plan.manifestHash,
  })
  assert.equal(f.getWrites(), 2)
  assert.equal(f.records.size, 1001)
  assert.equal(report.canaryEin, "100000000")
  const replay = await publishDirectory(f.client, {
    input: out,
    target,
    confirmation: plan.manifestHash,
  })
  assert.equal(replay.replayedChunks, 2)
  assert.equal(f.getWrites(), 2)
})

test("changed manifest, wrong target and corrupted later chunk stop before any public writes", async (t) => {
  const f = await fixture(t, 1001),
    out = join(f.dir, "plan")
  const plan = await planPublication(f.client, {
    input: f.projection,
    output: out,
    target,
    authorization: "User requested publish",
  })
  assert.throws(
    () => loadPublicationPlan(out, "wrong", plan.manifestHash),
    /mismatch/
  )
  assert.throws(() => loadPublicationPlan(out, target, "wrong"), /mismatch/)
  writeFileSync(join(out, plan.chunks[1].file), "[]")
  await assert.rejects(
    publishDirectory(f.client, {
      input: out,
      target,
      confirmation: plan.manifestHash,
    }),
    /mismatch/
  )
  assert.equal(f.getWrites(), 0)
})

test("preflight holds are counted and excluded; no arbitrary publication ceiling", async (t) => {
  const f = await fixture(t),
    rpc = f.client.rpc
  f.client.rpc = async (name, args) => {
    const response = await rpc(name, args)
    if (name === "nonprofit_directory_preflight")
      response.rows[1].hold = "existing_platform_organization"
    return response
  }
  const out = join(f.dir, "plan"),
    plan = await planPublication(f.client, {
      input: f.projection,
      output: out,
      target,
      authorization: "User requested publish",
    })
  assert.equal(plan.records, 2)
  assert.equal(plan.held, 1)
  const payload = readFileSync(join(out, plan.chunks[0].file), "utf8")
  assert.ok(!payload.includes("100000001"))
})

test("successful new chunks need no separate receipt request", async (t) => {
  const f = await fixture(t),
    out = join(f.dir, "fast-plan")
  const plan = await planPublication(f.client, {
    input: f.projection,
    output: out,
    target,
    authorization: "User requested publish",
  })
  let receiptReads = 0
  const rpc = f.client.rpc
  f.client.rpc = async (name, args) => {
    if (name === "nonprofit_publication_receipt") receiptReads++
    try {
      return await rpc(name, args)
    } catch (error) {
      // This test models a successful acknowledgment; fixture already committed.
      if (error.message === "Connection lost after commit")
        return rpc("nonprofit_publication_receipt", {
          p_batch: args.p_batch,
          p_chunk: args.p_chunk,
        })
      throw error
    }
  }
  await publishDirectory(f.client, {
    input: out,
    target,
    confirmation: plan.manifestHash,
  })
  assert.equal(receiptReads, 0)
  assert.equal(f.getWrites(), 1)
})

test("smaller publication transactions retain every record and reject unsafe bounds", async (t) => {
  const f = await fixture(t, 1001)
  const plan = await planPublication(f.client, {
    input: f.projection,
    output: join(f.dir, "small-plan"),
    target,
    authorization: "User requested publish",
    chunkSize: 500,
  })
  assert.deepEqual(
    plan.chunks.map((c) => c.records),
    [500, 500, 1]
  )
  const result = await publishDirectory(f.client, {
    input: join(f.dir, "small-plan"),
    target,
    confirmation: plan.manifestHash,
  })
  assert.equal(result.receiptOutcomes.inserted, 1001)
  assert.equal(f.records.size, 1001)
  for (const chunkSize of [0, 1001, 1.5])
    await assert.rejects(
      planPublication(f.client, {
        input: f.projection,
        output: join(f.dir, "invalid"),
        target,
        authorization: "User requested publish",
        chunkSize,
      }),
      /chunk size/
    )
})

test("operator health failure stops after a durable chunk and safely resumes", async (t) => {
  const f = await fixture(t, 1001),
    out = join(f.dir, "health-plan")
  const plan = await planPublication(f.client, {
    input: f.projection,
    output: out,
    target,
    authorization: "User requested publish",
    chunkSize: 500,
  })
  await assert.rejects(
    publishDirectory(f.client, {
      input: out,
      target,
      confirmation: plan.manifestHash,
      onChunk: async () => {
        throw new Error("Search health failed")
      },
    }),
    /Search health/
  )
  assert.equal(f.records.size, 500)
  assert.equal(
    JSON.parse(readFileSync(join(out, "receipts", "0.json"))).outcomes.length,
    500
  )
  const resumed = await publishDirectory(f.client, {
    input: out,
    target,
    confirmation: plan.manifestHash,
  })
  assert.equal(resumed.replayedChunks, 1)
  assert.equal(f.records.size, 1001)
  assert.equal(f.getWrites(), 3)
})

test("CLI health policy probes periodically, paces writes and rejects slow or failed reads", async () => {
  const probes = [],
    waits = [],
    progress = []
  const client = {
    publicRpc: async (...args) => {
      probes.push(args)
      return []
    },
  }
  const check = publicationHealth(client, {
    now: () => 0,
    wait: async (ms) => waits.push(ms),
    onProgress: (p) => progress.push(p),
  })
  for (const number of [0, 1, 10]) await check({ number })
  assert.equal(probes.length, 2)
  assert.deepEqual(waits, [50, 50, 50])
  assert.deepEqual(probes[0], [
    "search_nonprofit_directory",
    { p_query: "food", p_limit: 21 },
  ])
  assert.equal(progress.length, 2)
  let tick = 0
  const cooldowns = []
  await assert.rejects(
    publicationHealth(client, {
      now: () => (tick += 2001),
      wait: async (ms) => cooldowns.push(ms),
    })({ number: 0 }),
    /writes stopped/
  )
  assert.deepEqual(cooldowns, [10000, 30000])
  await assert.rejects(
    publicationHealth(
      {
        publicRpc: async () => {
          throw new Error("57014")
        },
      },
      { wait: async () => {} }
    )({ number: 0 }),
    /57014/
  )
})

test("transient search failure pauses writes and requires two healthy recovery probes", async () => {
  let calls = 0
  const waits = [],
    progress = []
  const check = publicationHealth(
    {
      publicRpc: async () => {
        if (++calls === 1) throw new Error("57014")
        return []
      },
    },
    {
      now: () => 0,
      wait: async (ms) => waits.push(ms),
      onProgress: (p) => progress.push(p),
    }
  )
  await check({ number: 0 })
  assert.equal(calls, 3)
  assert.deepEqual(waits, [10000, 500, 50])
  assert.equal(progress[0].phase, "search_health_wait")
  assert.equal(progress.filter((p) => p.phase === "search_health").length, 2)
})
