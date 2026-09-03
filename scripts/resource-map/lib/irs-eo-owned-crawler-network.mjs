import { lookup } from "node:dns/promises"
import http from "node:http"
import https from "node:https"
import { BlockList, isIP } from "node:net"

import { normalizeAcquisitionUrl } from "./web-acquisition-policy.mjs"

const PRIVATE_NETWORKS = new BlockList()

for (const [network, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
]) {
  PRIVATE_NETWORKS.addSubnet(network, prefix, "ipv4")
}
for (const [network, prefix] of [
  ["::", 128],
  ["::1", 128],
  ["64:ff9b::", 96],
  ["64:ff9b:1::", 48],
  ["100::", 64],
  ["2001:2::", 48],
  ["2001:10::", 28],
  ["2001:db8::", 32],
  ["2002::", 16],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
]) {
  PRIVATE_NETWORKS.addSubnet(network, prefix, "ipv6")
}

export function crawlerError(code, details = {}) {
  const error = new Error(code)
  error.code = code
  Object.assign(error, details)
  return error
}

export function readCrawlerHeader(headers, name) {
  if (headers instanceof Headers) return headers.get(name)
  const value = headers?.[name] ?? headers?.[name.toLowerCase()]
  return Array.isArray(value) ? value.join(", ") : value ?? null
}

export function isPublicNetworkAddress(value) {
  const address = String(value ?? "")
    .replace(/^\[|\]$/gu, "")
    .toLowerCase()
  const family = isIP(address)
  return family > 0 && !PRIVATE_NETWORKS.check(address, `ipv${family}`)
}

export async function validatePublicCrawlerTarget(
  value,
  {
    resolveHostname = async (hostname) =>
      lookup(hostname, { all: true, verbatim: true }),
    allowedPorts = [80, 443],
  } = {}
) {
  const normalized = normalizeAcquisitionUrl(value)
  if (!normalized) throw crawlerError("unsafe_url")
  const url = new URL(normalized)
  const hostname = url.hostname.replace(/^\[|\]$/gu, "").toLowerCase()
  const port = Number(url.port || (url.protocol === "https:" ? 443 : 80))
  if (
    url.username ||
    url.password ||
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    !allowedPorts.includes(port)
  ) {
    throw crawlerError("unsafe_url")
  }

  const literalFamily = isIP(hostname)
  const resolved = literalFamily
    ? [{ address: hostname, family: literalFamily }]
    : await resolveHostname(hostname)
  const addresses = (Array.isArray(resolved) ? resolved : [resolved])
    .map((entry) =>
      typeof entry === "string"
        ? { address: entry, family: isIP(entry) }
        : {
            address: entry?.address,
            family: entry?.family ?? isIP(entry?.address),
          }
    )
    .filter(({ address, family }) => address && family)
  if (
    addresses.length === 0 ||
    addresses.some(({ address }) => !isPublicNetworkAddress(address))
  ) {
    throw crawlerError("unsafe_dns_resolution")
  }
  return { url: normalized, hostname, port, addresses }
}

export function createNodeCrawlerTransport() {
  return async function request({ url, addresses, headers, maxBytes, timeoutMs }) {
    const parsed = new URL(url)
    const client = parsed.protocol === "https:" ? https : http
    return new Promise((resolve, reject) => {
      let settled = false
      const finish = (callback, value) => {
        if (settled) return
        settled = true
        callback(value)
      }
      const request = client.request(
        parsed,
        {
          agent: false,
          headers,
          lookup(_hostname, options, callback) {
            const candidates = addresses.map(({ address, family }) => ({
              address,
              family: Number(family),
            }))
            if (options?.all) callback(null, candidates)
            else callback(null, candidates[0].address, candidates[0].family)
          },
        },
        (response) => {
          const declaredLength = Number(response.headers["content-length"])
          if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
            response.destroy()
            finish(reject, crawlerError("response_too_large"))
            return
          }
          const chunks = []
          let received = 0
          response.on("data", (chunk) => {
            received += chunk.length
            if (received > maxBytes) {
              response.destroy()
              finish(reject, crawlerError("response_too_large"))
              return
            }
            chunks.push(chunk)
          })
          response.on("end", () => {
            finish(resolve, {
              status: response.statusCode ?? 0,
              headers: response.headers,
              body: Buffer.concat(chunks),
            })
          })
          response.on("error", (error) => finish(reject, error))
        }
      )
      request.setTimeout(timeoutMs, () => {
        request.destroy(crawlerError("request_timeout"))
      })
      request.on("error", (error) => finish(reject, error))
      request.end()
    })
  }
}
