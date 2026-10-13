import { hash, stable } from "./store.mjs"
import { addEvidence } from "./queue.mjs"
import { pageRejection } from "./verification.mjs"
import {
  extractStructuredMetadata,
  METADATA_METHOD,
  METADATA_PAGE_BYTES,
} from "./structured-metadata.mjs"

const key = (receipt) =>
  hash({ method: METADATA_METHOD, receipt: receipt.receiptHash })
export function structuredPolicy(claims) {
  return {
    method: METADATA_METHOD,
    maxPageBytes: METADATA_PAGE_BYTES,
    maxRetainedBytes: claims.length * METADATA_PAGE_BYTES,
  }
}

export function createStructuredCollector(db, bundle) {
  const enabled = bundle.structuredMetadata?.method === METADATA_METHOD
  if (
    enabled &&
    (bundle.structuredMetadata.maxPageBytes !== METADATA_PAGE_BYTES ||
      bundle.structuredMetadata.maxRetainedBytes !==
        bundle.claims.length * METADATA_PAGE_BYTES)
  )
    throw new Error("Invalid structured metadata budget")
  const pending = new Map()
  const kind = `structured:${bundle.hash}`
  let bytes = db
    .prepare(
      "SELECT coalesce(sum(length(CAST(body AS BLOB))),0) n FROM runs WHERE kind=?"
    )
    .get(kind).n
  return {
    capture(request, response) {
      pending.clear() // Executor is sequential; do not retain response bodies.
      if (
        !enabled ||
        response.status < 200 ||
        response.status >= 300 ||
        !Buffer.isBuffer(response.body)
      )
        return
      const headers = Object.fromEntries(
        Object.entries(response.headers ?? {}).map(([name, value]) => [
          name.toLowerCase(),
          value,
        ])
      )
      if (
        !/^(?:text\/html|application\/xhtml\+xml)(?:;|$)/i.test(
          headers["content-type"] ?? ""
        )
      )
        return
      const organizations = extractStructuredMetadata(
        response.body.toString("utf8"),
        request.url
      )
      if (organizations.length)
        pending.set(request.url, {
          contentSha256: hash(response.body),
          organizations,
        })
    },
    retain(receipt) {
      const extracted = pending.get(receipt.finalUrl)
      pending.clear()
      if (
        !enabled ||
        !extracted ||
        receipt.status !== "fetched" ||
        receipt.receiptType !== "provider" ||
        pageRejection(receipt)
      )
        return
      const final = receipt.networkEvents?.at(-1)
      if (
        final?.phase !== "provider" ||
        final.url !== receipt.finalUrl ||
        final.contentSha256 !== extracted.contentSha256
      )
        return
      const record = {
        method: METADATA_METHOD,
        receiptHash: receipt.receiptHash,
        sourceUrl: receipt.finalUrl,
        observedAt: receipt.finishedAt,
        ...extracted,
      }
      const body = stable(record),
        size = Buffer.byteLength(body)
      if (
        size > METADATA_PAGE_BYTES ||
        bytes + size > bundle.structuredMetadata.maxRetainedBytes
      )
        return
      const inserted = db
        .prepare("INSERT OR IGNORE INTO runs VALUES (?,?,?,?)")
        .run(key(receipt), kind, body, receipt.finishedAt)
      if (inserted.changes) bytes += size
      applyStructuredEvidence(db, receipt, receipt.consumers)
    },
    get retainedBytes() {
      return bytes
    },
  }
}

export function applyStructuredEvidence(db, receipt, consumers) {
  if (
    !receipt.receiptHash ||
    receipt.status !== "fetched" ||
    pageRejection(receipt)
  )
    return
  const saved = db.prepare("SELECT body FROM runs WHERE id=?").get(key(receipt))
  if (!saved) return
  const record = JSON.parse(saved.body)
  if (
    record.receiptHash !== receipt.receiptHash ||
    record.sourceUrl !== receipt.finalUrl ||
    record.contentSha256 !== receipt.networkEvents?.at(-1)?.contentSha256
  )
    throw new Error("Structured evidence receipt mismatch")
  for (const { ein } of consumers) {
    if (!receipt.consumers?.some((consumer) => consumer.ein === ein)) continue
    for (const organization of record.organizations) {
      const base = {
        source_url: record.sourceUrl,
        observed_at: record.observedAt,
        source_type: "provider_page",
        method: METADATA_METHOD,
        license: "unknown",
        evidence: stable({ ...record, organizations: [organization] }),
      }
      const add = (field, value) =>
        addEvidence(db, ein, { ...base, field, value })
      if (organization.description) add("description", organization.description)
      for (const phone of organization.phones) add("phone", phone)
      if (organization.socialUrls.length)
        add(
          "social_profiles",
          organization.socialUrls.map((url) => ({
            url,
            sourceUrl: record.sourceUrl,
            providerLinked: true,
            sourceMethod: METADATA_METHOD,
          }))
        )
      const images = [
        ...organization.logos.map((url) => ({ url, kind: "logo_candidate" })),
        ...organization.images.map((url) => ({ url, kind: "image_candidate" })),
      ]
      if (images.length)
        add(
          "logo",
          images.map((image) => ({
            ...image,
            sourceUrl: record.sourceUrl,
            rightsStatus: "rights_unknown",
            publishable: false,
            sourceMethod: METADATA_METHOD,
          }))
        )
    }
  }
}
