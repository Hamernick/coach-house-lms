import { normalizeAcquisitionUrl } from "../../../../scripts/resource-map/lib/web-acquisition-policy.mjs"
import { pageRejection } from "./verification.mjs"
import { hash } from "./store.mjs"

const NON_PAGE = /\.(?:pdf|jpe?g|png|gif|svg|zip|xml|json|mp[34])$/i
const EXCLUDED =
  /\b(?:donate|donation|login|logout|sign-in|privacy|terms|news|blog|shop|cart|checkout|calendars?|schedules?)\b/i

export function retainedFollowups(db, ein, website) {
  const saved = db
    .prepare("SELECT body FROM pages WHERE cache_key=? AND expires_at>?")
    .get(hash(website), Date.now())
  if (!saved) return []
  const receipt = JSON.parse(saved.body)
  if (receipt.status !== "fetched" || pageRejection(receipt)) return []
  const parentUrl = normalizeAcquisitionUrl(receipt.finalUrl)
  if (!parentUrl) return []
  const parent = new URL(parentUrl)
  const host = (url) => url.hostname.toLowerCase().replace(/^www\./, "")
  // Do not follow an unrelated redirect just because it linked to itself.
  if (host(parent) !== host(new URL(website))) return []
  const found = new Map()
  for (const link of receipt.signals?.evidenceLinkCandidates ?? []) {
    const normalized = normalizeAcquisitionUrl(link.url)
    if (!normalized) continue
    const url = new URL(normalized)
    if (
      host(url) !== host(parent) ||
      url.port !== parent.port ||
      (parent.protocol === "https:" && url.protocol !== "https:") ||
      url.search ||
      normalized === parentUrl ||
      NON_PAGE.test(url.pathname)
    )
      continue
    const words = `${link.label ?? ""} ${url.pathname.replace(/[-_/]/g, " ")}`
    if (EXCLUDED.test(words)) continue
    const score = /\b(?:contact|hours|locations?)\b/i.test(words)
      ? 0
      : /\b(?:services?|programs?|get help|find help)\b/i.test(words)
        ? 1
        : 2
    if (found.has(normalized)) continue
    found.set(normalized, {
      ein,
      url: normalized,
      parentUrl,
      parentHash: receipt.evidence.contentSha256,
      parentCacheKey: hash(website),
      label: link.label ?? null,
      score,
    })
  }
  return [...found.values()].sort(
    (a, b) => a.score - b.score || a.url.localeCompare(b.url)
  )
}
