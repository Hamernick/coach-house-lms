import { test } from "node:test"
import assert from "node:assert/strict"
import http from "node:http"
import { once } from "node:events"
import {
  deadlineResolver,
  createDeadlineTransport,
} from "../server/crawl-network.mjs"
import { validatePublicCrawlerTarget } from "../../../../scripts/resource-map/lib/irs-eo-owned-crawler-network.mjs"

test("DNS deadline stops a stalled lookup and late results cannot validate a request", async () => {
  const timings = []
  let lateResolve
  const resolve = deadlineResolver({
    timeoutMs: 20,
    resolveHostname: () =>
      new Promise((done) => {
        lateResolve = done
      }),
    onTiming: (row) => timings.push(row),
  })
  await assert.rejects(
    validatePublicCrawlerTarget("https://example.org/", {
      resolveHostname: resolve,
    }),
    { code: "dns_timeout" }
  )
  lateResolve([{ address: "127.0.0.1", family: 4 }])
  await new Promise((done) => setImmediate(done))
  assert.equal(timings.length, 1)
  assert.equal(timings[0].outcome, "dns_timeout")
})

test("bounded resolver preserves private-address rejection", async () => {
  await assert.rejects(
    validatePublicCrawlerTarget("https://example.org/", {
      resolveHostname: deadlineResolver({
        resolveHostname: async () => [{ address: "127.0.0.1", family: 4 }],
      }),
    }),
    { code: "unsafe_dns_resolution" }
  )
})

async function localServer(t, handler) {
  const server = http.createServer(handler)
  server.listen(0, "127.0.0.1")
  await once(server, "listening")
  t.after(async () => {
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
  })
  // Test only the transport with pinned loopback. Production caller validates
  // public DNS/ports before invoking this transport.
  return {
    url: `http://provider.invalid:${server.address().port}/`,
    addresses: [{ address: "127.0.0.1", family: 4 }],
    headers: {},
    maxBytes: 1000,
    timeoutMs: 150,
  }
}

test("absolute request deadline cancels a continuously dripping response", async (t) => {
  let closed = false
  const request = await localServer(t, (_req, res) => {
    res.writeHead(200, { "content-type": "text/plain" })
    res.write("start")
    const interval = setInterval(() => res.write("x"), 10)
    res.on("close", () => {
      closed = true
      clearInterval(interval)
    })
  })
  const timings = []
  await assert.rejects(
    createDeadlineTransport({ onTiming: (r) => timings.push(r) })(request),
    { code: "request_timeout" }
  )
  await new Promise((done) => setTimeout(done, 25))
  assert.ok(closed)
  assert.equal(timings[0].outcome, "request_timeout")
  assert.ok(timings[0].receivedBytes > 0)
  assert.ok(timings[0].elapsedMs < 1500)
})

test("absolute deadline also bounds the wait for response headers", async (t) => {
  const request = await localServer(t, () => {})
  await assert.rejects(createDeadlineTransport()(request), {
    code: "request_timeout",
  })
})

test("transport rejects oversized responses and preserves success bytes", async (t) => {
  const request = await localServer(t, (_req, res) => {
    res.end("hello")
  })
  const transport = createDeadlineTransport()
  assert.equal((await transport(request)).body.toString(), "hello")
  await assert.rejects(transport({ ...request, maxBytes: 2 }), {
    code: "response_too_large",
  })
})
