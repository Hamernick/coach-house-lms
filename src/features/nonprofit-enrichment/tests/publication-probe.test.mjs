import { test } from "node:test"
import assert from "node:assert/strict"
import { publicationProbe } from "../server/publication-probe.mjs"
import { publicationLoadGuard } from "../server/publication-load-guard.mjs"

test("the failed query and chunk are retained before stopping the guard", async () => {
  let clock = 0
  const events = [], calls = []
  const guard = publicationLoadGuard({ publicRpc: async (name, args) => {
    calls.push(args)
    clock += args.p_state === "IN" ? 2100 : 10
    return []
  } }, { now: () => clock, onProgress: (e) => events.push(e) })
  await assert.rejects(guard({ number: 10, attempt: 0 }), /IN.*2100ms/)
  assert.equal(calls.length, 3)
  assert.deepEqual(events.map(e => e.outcome), ["passed", "passed", "slow"])
  assert.equal(events.at(-1).number, 10)
  assert.equal(events.at(-1).args.p_state, "IN")
  assert.equal(events.at(-1).elapsedMs, 2100)
  assert(!events.some(e => e.phase === "publication_before_write"))
})

test("RPC errors retain safe codes and timing, release monitoring, and propagate", async () => {
  let clock = 0, stopped = 0
  const events = [], failure = new Error("Anonymous directory RPC failed (57014) secret-value")
  await assert.rejects(publicationProbe({ publicRpc: async () => {
    clock = 3001
    throw failure
  } }, "search", { p_query: "food" }, {
    now: () => clock, wallNow: () => clock,
    monitorLoop: () => () => { stopped++; return 24 },
    onProgress: e => events.push(e),
  }), e => e === failure)
  assert.equal(stopped, 1)
  assert.equal(events[0].outcome, "rpc_error")
  assert.equal(events[0].errorCode, "57014")
  assert.equal(events[0].elapsedMs, 3001)
  assert.equal(events[0].eventLoopDelayMaxMs, 24)
  assert(!JSON.stringify(events).includes("secret-value"))
})

test("clock and loop delays are evidence, never grounds to waive a slow request", async () => {
  let clock = 0, wall = 1000
  const events = []
  await assert.rejects(publicationProbe({ publicRpc: async () => {
    clock = 4000; wall += 124000
    return [{ privateValue: "not-logged" }]
  } }, "search", {}, {
    now: () => clock, wallNow: () => wall, monitorLoop: () => () => 3990,
    onProgress: e => events.push(e),
  }), /unhealthy/)
  assert.equal(events[0].wallElapsedMs, 124000)
  assert.equal(events[0].eventLoopDelayMaxMs, 3990)
  assert.equal(events[0].rows, 1)
  assert(!JSON.stringify(events).includes("not-logged"))
})

test("invalid responses and clocks fail closed with a recorded reason", async () => {
  for (const [response, duration, outcome] of [[{}, 1, "invalid_response"], [[], NaN, "invalid_timing"], [[], -1, "invalid_timing"]]) {
    let clock = 0
    const events = []
    await assert.rejects(publicationProbe({ publicRpc: async () => {
      clock = duration; return response
    } }, "search", {}, {
      now: () => clock, monitorLoop: () => () => 0, onProgress: e => events.push(e),
    }), /unhealthy/)
    assert.equal(events[0].outcome, outcome)
  }
})

test("successful measurements exclude logging time and preserve the response", async () => {
  let clock = 0
  const rows = []
  const result = await publicationProbe({ publicRpc: async () => { clock = 75; return rows } }, "search", {}, {
    now: () => clock, monitorLoop: () => () => 0,
    onProgress: () => { clock += 300 },
  })
  assert.equal(result.rows, rows)
  assert.equal(result.elapsedMs, 75)
})
