import { lookup } from "node:dns/promises"
import http from "node:http"
import https from "node:https"
import { performance } from "node:perf_hooks"
import { crawlerError } from "../../../../scripts/resource-map/lib/irs-eo-owned-crawler-network.mjs"

// The shared crawler still validates every resolved address and redirect.
// Bound DNS separately: a slow lookup must not hold a worker indefinitely.
export function deadlineResolver({
  resolveHostname = (hostname) =>
    lookup(hostname, { all: true, verbatim: true }),
  timeoutMs = 5000,
  onTiming = () => {},
} = {}) {
  return async (hostname) => {
    const started = performance.now()
    let timer,
      outcome = "resolved"
    try {
      return await Promise.race([
        Promise.resolve().then(() => resolveHostname(hostname)),
        new Promise((_, reject) => {
          timer = setTimeout(
            () => reject(crawlerError("dns_timeout")),
            timeoutMs
          )
        }),
      ])
    } catch (error) {
      outcome = error.code ?? "dns_error"
      throw error
    } finally {
      clearTimeout(timer)
      onTiming({
        phase: "dns",
        hostname,
        elapsedMs: Math.round(performance.now() - started),
        outcome,
      })
    }
  }
}

// Pinned DNS and byte limits match the shared transport, with an absolute
// connect/headers/body deadline. Socket inactivity timeouts alone allow drips.
export function createDeadlineTransport({ onTiming = () => {} } = {}) {
  return async ({ url, addresses, headers, maxBytes, timeoutMs }) => {
    const started = performance.now()
    let firstByteMs = null,
      receivedBytes = 0,
      outcome = "fetched"
    try {
      return await new Promise((resolve, reject) => {
        let settled = false,
          request,
          response,
          timer
        const finish = (error, result) => {
          if (settled) return
          settled = true
          clearTimeout(timer)
          if (error) {
            response?.destroy()
            request?.destroy()
            reject(error)
          } else resolve(result)
        }
        timer = setTimeout(
          () => finish(crawlerError("request_timeout")),
          timeoutMs
        )
        const parsed = new URL(url)
        const client = parsed.protocol === "https:" ? https : http
        try {
          request = client.request(
            parsed,
            {
              agent: false,
              headers,
              lookup(_hostname, options, callback) {
                const pinned = addresses.map(({ address, family }) => ({
                  address,
                  family: Number(family),
                }))
                if (options?.all) callback(null, pinned)
                else callback(null, pinned[0].address, pinned[0].family)
              },
            },
            (incoming) => {
              response = incoming
              firstByteMs = Math.round(performance.now() - started)
              response.on("error", (error) => finish(error))
              response.on("aborted", () =>
                finish(crawlerError("response_aborted"))
              )
              const declared = Number(response.headers["content-length"])
              if (Number.isFinite(declared) && declared > maxBytes) {
                finish(crawlerError("response_too_large"))
                return
              }
              const chunks = []
              response.on("data", (chunk) => {
                if (settled) return
                receivedBytes += chunk.length
                if (receivedBytes > maxBytes)
                  finish(crawlerError("response_too_large"))
                else chunks.push(chunk)
              })
              response.on("end", () =>
                finish(null, {
                  status: response.statusCode ?? 0,
                  headers: response.headers,
                  body: Buffer.concat(chunks),
                })
              )
            }
          )
          request.on("error", (error) => finish(error))
          request.end()
        } catch (error) {
          finish(error)
        }
      })
    } catch (error) {
      outcome = error.code ?? "request_error"
      throw error
    } finally {
      onTiming({
        phase: "http",
        url,
        elapsedMs: Math.round(performance.now() - started),
        firstByteMs,
        receivedBytes,
        outcome,
      })
    }
  }
}
