import { hash } from "./store.mjs"
import { pageRejection } from "./verification.mjs"

function reusableRedirect(page, request, now) {
  try {
    const receipt = JSON.parse(page.body)
    const source = new URL(receipt.sourceUrl)
    const target = new URL(request.url)
    const host = (url) => url.hostname.replace(/^www\./, "")
    const fetchedAt = Date.parse(receipt.finishedAt)
    return (
      receipt.receiptType === "provider" &&
      receipt.status === "fetched" &&
      !pageRejection(receipt) &&
      receipt.finalUrl === request.url &&
      ["http:", "https:"].includes(source.protocol) &&
      ["http:", "https:"].includes(target.protocol) &&
      !source.username &&
      !source.password &&
      !target.username &&
      !target.password &&
      host(source) === host(target) &&
      source.port === target.port &&
      !(source.protocol === "https:" && target.protocol === "http:") &&
      page.url === receipt.sourceUrl &&
      page.cache_key === hash(receipt.sourceUrl) &&
      page.content_hash === receipt.evidence?.contentSha256 &&
      Number.isFinite(fetchedAt) &&
      fetchedAt <= now &&
      now - fetchedAt < 30 * 86400_000 &&
      request.consumers.every((consumer) =>
        receipt.consumers?.some((saved) => saved.ein === consumer.ein)
      )
    )
  } catch {
    return false
  }
}

export function findCachedPage(db, request, now = Date.now()) {
  const direct = db
    .prepare("SELECT * FROM pages WHERE cache_key=? AND expires_at>?")
    .get(hash(request.url), now)
  if (direct) return direct
  // Existing expression index keeps this lookup scoped to one destination.
  const redirected = db
    .prepare(
      "SELECT * FROM pages WHERE json_extract(body,'$.finalUrl')=? AND expires_at>? ORDER BY fetched_at DESC,cache_key LIMIT 8"
    )
    .all(request.url, now)
  return redirected.find((page) => reusableRedirect(page, request, now))
}

export function plannedCachedPage(db, request, now = Date.now()) {
  const page = db
    .prepare("SELECT * FROM pages WHERE cache_key=? AND expires_at>?")
    .get(request.cacheKey ?? hash(request.url), now)
  if (!page) throw new Error("Planned cache expired; regenerate crawl plan")
  if (request.cacheBodyHash && hash(page.body) !== request.cacheBodyHash)
    throw new Error("Planned cache changed; regenerate crawl plan")
  if (
    page.cache_key !== hash(request.url) &&
    !reusableRedirect(page, request, now)
  )
    throw new Error("Planned redirect cache invalid; regenerate crawl plan")
  return page
}
