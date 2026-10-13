import { test } from "node:test"
import assert from "node:assert/strict"
import { publicationLoadGuard } from "../server/publication-load-guard.mjs"
import { publicationResourceCheck } from "../server/publication-resource-check.mjs"

test("pacing slows after costly reads and every write attempt checks indexed-state and stop-word-state search paths", async () => {
  let clock = 0,
    calls = 0,
    resources = 0
  const waits = [],
    progress = []
  const guard = publicationLoadGuard(
    {
      publicRpc: async () => {
        calls++
        clock += calls === 1 ? 600 : 10
        return []
      },
    },
    {
      now: () => clock,
      wait: async (ms) => {
        waits.push(ms)
        clock += ms
      },
      checkResources: async () => resources++,
      onProgress: (event) => progress.push(event),
    }
  )
  await guard({ number: 0, attempt: 0 })
  await guard({ number: 1, attempt: 0 })
  assert.deepEqual(waits, [10000])
  assert.equal(calls, 14)
  assert.equal(resources, 2)
  assert.deepEqual(
    progress.filter((event) => event.phase === "publication_before_write").map((event) => event.gapMs),
    [10000, 10000]
  )
})

test("slow or failed reads and exhausted run deadlines stop the next write", async () => {
  let clock = 0
  const options = { now: () => clock }
  await assert.rejects(
    publicationLoadGuard(
      {
        publicRpc: async () => {
          clock += 2001
          return []
        },
      },
      options
    )({ number: 0 }),
    /unhealthy/
  )
  await assert.rejects(
    publicationLoadGuard(
      {
        publicRpc: async () => {
          throw new Error("503")
        },
      },
      options
    )({ number: 0 }),
    /503/
  )
  const deadline = publicationLoadGuard(
    { publicRpc: async () => [] },
    { ...options, maxDurationMs: 1000 }
  )
  clock += 1000
  await assert.rejects(deadline({ number: 0 }), /stopped before write/)
})

test("stop during pacing and unavailable telemetry prevent further probes", async () => {
  let clock = 0,
    stopped = false,
    probes = 0
  const client = {
    publicRpc: async () => {
      probes++
      return []
    },
  }
  const guard = publicationLoadGuard(client, {
    now: () => clock,
    shouldStop: () => stopped,
    wait: async (ms) => {
      clock += ms
      stopped = true
    },
  })
  await guard({ number: 0 })
  await assert.rejects(guard({ number: 1 }), /stopped before write/)
  assert.equal(probes, 7)
  await assert.rejects(
    publicationLoadGuard(client, {
      checkResources: async () => {
        throw new Error("metrics unavailable")
      },
    })({ number: 0 }),
    /metrics unavailable/
  )
  assert.equal(probes, 7)
})

const target = "abcdefghijklmnopqrst"
function resourceFixture() {
  let clock = 0,
    available = 200 * 1024 * 1024,
    healthy = true,
    fail = false,
    calls = 0
  const check = publicationResourceCheck({
    target,
    token: "test",
    now: () => clock,
    fetchImpl: async (url) => {
      calls++
      if (fail) return { ok: false, status: 500 }
      return {
        ok: true,
        json: async () =>
          ["db", "rest", "auth"].map((name) => ({ name, healthy })),
        text: async () =>
          [
            `node_memory_MemTotal_bytes{supabase_project_ref="${target}"} ${400 * 1024 * 1024}`,
            `node_memory_MemAvailable_bytes{supabase_project_ref="${target}"} ${available}`,
          ].join("\n"),
      }
    },
  })
  return {
    check,
    calls: () => calls,
    advance: () => {
      clock += 30000
    },
    lowMemory: () => {
      available = 32 * 1024 * 1024
    },
    unhealthy: () => {
      healthy = false
    },
    fail: () => {
      fail = true
    },
  }
}

test("resources cache briefly, reject low memory and never cache a failed sample", async () => {
  const f = resourceFixture()
  await f.check()
  await f.check()
  assert.equal(f.calls(), 2)
  f.advance()
  f.lowMemory()
  await assert.rejects(f.check(), /headroom/)
  await assert.rejects(f.check(), /headroom/)
  assert.equal(f.calls(), 6)
})

test("unhealthy services or missing telemetry block publication", async () => {
  const unhealthy = resourceFixture()
  unhealthy.unhealthy()
  await assert.rejects(unhealthy.check(), /service unhealthy/)
  assert.equal(unhealthy.calls(), 1)
  const failed = resourceFixture()
  failed.fail()
  await assert.rejects(failed.check(), /HTTP 500/)
  const missing = publicationResourceCheck({
    target,
    token: "test",
    fetchImpl: async () => ({
      ok: true,
      json: async () =>
        ["db", "rest", "auth"].map((name) => ({ name, healthy: true })),
      text: async () => "",
    }),
  })
  await assert.rejects(missing(), /Missing or ambiguous metric/)
})

test("slow state-filtered search blocks writes even when broad search passes", async () => {
  let clock = 0
  const guard = publicationLoadGuard(
    {
      publicRpc: async (_name, args) => {
        clock += args.p_state ? 2100 : 10
        return []
      },
    },
    { now: () => clock }
  )
  await assert.rejects(guard({ number: 0 }), /unhealthy/)
})


test("slow stop-word-state fallback blocks publication even when indexed-state search passes", async () => {
  let clock = 0
  const guard = publicationLoadGuard(
    { publicRpc: async (_name, args) => {
      clock += args.p_state === "IN" ? 2100 : 10
      return []
    } },
    { now: () => clock }
  )
  await assert.rejects(guard({ number: 0 }), /unhealthy/)
})

for (const failedPath of ["OR", "text_category"]) {
  test(`${failedPath} latency blocks writes while other searches pass`, async () => {
    let clock = 0
    const guard = publicationLoadGuard(
      { publicRpc: async (_name, args) => {
        const fails = failedPath === "OR" ? args.p_state === "OR" : args.p_query && args.p_category
        clock += fails ? 2100 : 10
        return []
      } },
      { now: () => clock }
    )
    await assert.rejects(guard({ number: 0 }), /unhealthy/)
  })
}

test("sparse category fallback latency blocks writes while dense category search passes", async () => {
  let clock = 0
  const guard = publicationLoadGuard(
    { publicRpc: async (_name, args) => {
      clock += args.p_query === "housing" && args.p_category === "food" ? 2100 : 10
      return []
    } },
    { now: () => clock }
  )
  await assert.rejects(guard({ number: 0 }), /unhealthy/)
})

test("paging telemetry reports deltas, handles counter resets, and allows missing optional metrics", async () => {
  let clock = 0, pages = 100
  const events = []
  const check = publicationResourceCheck({
    target, token: "test", now: () => clock, onProgress: e => events.push(e),
    fetchImpl: async () => ({
      ok: true,
      json: async () => ["db", "rest", "auth"].map(name => ({ name, healthy: true })),
      text: async () => [
        `node_memory_MemTotal_bytes{supabase_project_ref="${target}"} ${400 * 1024 * 1024}`,
        `node_memory_MemAvailable_bytes{supabase_project_ref="${target}"} ${200 * 1024 * 1024}`,
        ...(pages === null ? [] : [
          `node_vmstat_pswpin{supabase_project_ref="${target}"} ${pages}`,
          `node_vmstat_pswpout{supabase_project_ref="${target}"} ${pages * 2}`,
        ]),
      ].join("\n"),
    }),
  })
  await check()
  clock += 30000; pages = 120; await check()
  clock += 30000; pages = 1; await check()
  clock += 30000; pages = null; await check()
  assert.deepEqual(events.map(e => e.swapInPagesDelta), [null, 20, null, null])
  assert.deepEqual(events.map(e => e.swapOutPagesDelta), [null, 40, null, null])
  assert.deepEqual(events.map(e => e.sampleMs), [null, 30000, 30000, 30000])
  assert.equal(events.at(-1).swapTotalBytes, null)
})
