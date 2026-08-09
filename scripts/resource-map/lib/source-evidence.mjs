import { createHash } from "node:crypto"
import { lookup } from "node:dns/promises"
import { isIP } from "node:net"

import { isTechnicalResourceSourceUrl } from "./enrichment-quality.mjs"

const MAX_SOURCE_BYTES = 2 * 1024 * 1024
const MAX_EVIDENCE_TEXT = 30_000
const MAX_REDIRECTS = 3

function readObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {}
}

function readArray(value) {
  return Array.isArray(value) ? value : []
}

function readString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return null
}

function readFields(record) {
  return readObject(
    record.extractedFields ?? record.extracted_fields ?? record.fields ?? record
  )
}

function normalizeComparisonText(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, " ")
    .replace(/\bnorth\b/gu, "n")
    .replace(/\bsouth\b/gu, "s")
    .replace(/\beast\b/gu, "e")
    .replace(/\bwest\b/gu, "w")
    .replace(/\bavenue\b/gu, "ave")
    .replace(/\bboulevard\b/gu, "blvd")
    .replace(/\bhighway\b/gu, "hwy")
    .replace(/\broad\b/gu, "rd")
    .replace(/\bstreet\b/gu, "st")
    .replace(/\s+/gu, " ")
    .trim()
}

const OPTIONAL_ADDRESS_TOKENS = new Set(["ave", "blvd", "hwy", "rd", "st"])

function sourceContainsComparison(fieldPath, value, sourceText) {
  const normalized = normalizeComparisonText(value)
  if (normalized.length < 4) return false
  if (sourceText.includes(normalized)) return true
  if (fieldPath !== "address") return false

  const requiredTokens = normalized
    .split(" ")
    .filter(Boolean)
    .filter((token) => !OPTIONAL_ADDRESS_TOKENS.has(token))
  return (
    requiredTokens.length >= 3 &&
    requiredTokens.every((token) => sourceText.split(" ").includes(token))
  )
}

function decodeHtml(value) {
  return String(value ?? "")
    .replace(/&nbsp;|&#160;/giu, " ")
    .replace(/&amp;/giu, "&")
    .replace(/&quot;|&#34;/giu, '"')
    .replace(/&#39;|&apos;/giu, "'")
    .replace(/&lsquo;|&rsquo;/giu, "'")
    .replace(/&ldquo;|&rdquo;/giu, '"')
    .replace(/&ndash;|&mdash;/giu, "-")
    .replace(/&lt;/giu, "<")
    .replace(/&gt;/giu, ">")
    .replace(/&#(\d+);/gu, (_, code) => String.fromCodePoint(Number(code)))
}

function stripTags(value) {
  return decodeHtml(value)
    .replace(/<[^>]*>/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
}

function readMetaDescription(html) {
  const patterns = [
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/iu,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/iu,
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/iu,
  ]
  for (const pattern of patterns) {
    const description = stripTags(html.match(pattern)?.[1])
    if (description) return description
  }
  return null
}

function extractHeadings(html) {
  return [...html.matchAll(/<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/giu)]
    .map((match) => stripTags(match[1]))
    .filter(Boolean)
    .filter((heading, index, headings) => headings.indexOf(heading) === index)
    .slice(0, 60)
}

function stripPageChrome(html) {
  return html
    .replace(/<!--([\s\S]*?)-->/gu, " ")
    .replace(
      /<(script|style|svg|noscript|template)\b[^>]*>[\s\S]*?<\/\1>/giu,
      " "
    )
    .replace(/<(nav|footer|form)\b[^>]*>[\s\S]*?<\/\1>/giu, " ")
}

export function extractSourcePageEvidence({ body, contentType, url }) {
  const rawBody = String(body ?? "")
  const isHtml = /html/iu.test(contentType ?? "") || /<html\b/iu.test(rawBody)
  const title = isHtml
    ? stripTags(rawBody.match(/<title\b[^>]*>([\s\S]*?)<\/title>/iu)?.[1])
    : null
  const headings = isHtml ? extractHeadings(rawBody) : []
  const text = isHtml
    ? stripTags(stripPageChrome(rawBody))
    : rawBody.replace(/\s+/gu, " ").trim()
  const excerpt = text.slice(0, MAX_EVIDENCE_TEXT)

  return {
    contentSha256: createHash("sha256").update(rawBody).digest("hex"),
    contentType: contentType ?? null,
    evidenceUrl: url,
    headings,
    metaDescription: isHtml ? readMetaDescription(rawBody) : null,
    pageTitle: title,
    textExcerpt: excerpt,
    truncated: text.length > excerpt.length,
  }
}

function comparisonFields(record) {
  const fields = readFields(record)
  return [
    [
      "title",
      readString(
        fields.serviceTitle,
        fields.service_title,
        fields.title,
        fields.organizationName,
        fields.organization_name,
        fields.name
      ),
    ],
    [
      "address",
      readString(
        fields.address,
        fields.addressLine1,
        fields.address_line1,
        fields.streetAddress
      ),
    ],
    ["phone", readString(fields.phone, fields.phoneNumber)],
    ["email", readString(fields.email, fields.contactEmail)],
  ].filter(([, value]) => value)
}

export function compareRecordToSourceEvidence(record, evidence) {
  const sourceText = normalizeComparisonText(
    [
      evidence.pageTitle,
      evidence.metaDescription,
      ...readArray(evidence.headings),
      evidence.textExcerpt,
    ]
      .filter(Boolean)
      .join(" ")
  )

  return comparisonFields(record).map(([fieldPath, value]) => {
    return {
      fieldPath,
      sourceUrl: evidence.evidenceUrl,
      status: sourceContainsComparison(fieldPath, value, sourceText)
        ? "matched"
        : "not_found",
      value,
    }
  })
}

export function selectProviderEvidenceUrl(record) {
  const fields = readFields(record)
  const candidates = [
    fields.websiteUrl,
    fields.website_url,
    fields.website,
    fields.intakeUrl,
    fields.intake_url,
    ...readArray(fields.links).map((link) => link?.url ?? link?.href),
    record.sourceUrl,
    record.source_url,
    fields.sourceUrl,
    fields.source_url,
  ]

  for (const candidate of candidates) {
    const value = readString(candidate)
    if (!value || isTechnicalResourceSourceUrl(value)) continue
    try {
      const url = new URL(value)
      if (url.protocol === "http:" || url.protocol === "https:") {
        return url.toString()
      }
    } catch {
      // Invalid candidates are skipped and surfaced by the readiness audit.
    }
  }
  return null
}

function isPrivateIpv4(address) {
  const octets = address.split(".").map(Number)
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part))) {
    return true
  }
  const [first, second] = octets
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19)) ||
    first >= 224
  )
}

function isPrivateIp(address) {
  if (isIP(address) === 4) return isPrivateIpv4(address)
  const normalized = address.toLowerCase()
  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb") ||
    normalized.startsWith("::ffff:127.") ||
    normalized.startsWith("::ffff:10.") ||
    normalized.startsWith("::ffff:192.168.")
  )
}

async function assertPublicHostname(url) {
  const parsed = new URL(url)
  const hostname = parsed.hostname.toLowerCase()
  if (
    parsed.username ||
    parsed.password ||
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local")
  ) {
    throw new Error("source_url_not_public")
  }

  const addresses = await lookup(hostname, { all: true, verbatim: true })
  if (
    addresses.length === 0 ||
    addresses.some(({ address }) => isPrivateIp(address))
  ) {
    throw new Error("source_url_resolves_private")
  }
}

async function fetchPublicSource(url, options, redirectCount = 0) {
  if (redirectCount > MAX_REDIRECTS) throw new Error("source_redirect_limit")
  await assertPublicHostname(url)
  const response = await options.fetchImpl(url, {
    headers: {
      Accept: "text/html,application/ld+json,application/json,text/plain;q=0.8",
      "User-Agent": "CoachHouseResourceVerifier/1.0 (+https://coachhouse.app)",
    },
    redirect: "manual",
    signal: AbortSignal.timeout(options.timeoutMs),
  })

  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location")
    if (!location) throw new Error("source_redirect_missing_location")
    return fetchPublicSource(
      new URL(location, url).toString(),
      options,
      redirectCount + 1
    )
  }
  if (!response.ok) throw new Error(`source_http_${response.status}`)

  const contentLength = Number(response.headers.get("content-length"))
  if (Number.isFinite(contentLength) && contentLength > MAX_SOURCE_BYTES) {
    throw new Error("source_body_too_large")
  }
  const buffer = Buffer.from(await response.arrayBuffer())
  if (buffer.byteLength > MAX_SOURCE_BYTES) {
    throw new Error("source_body_too_large")
  }

  return {
    body: buffer.toString("utf8"),
    contentType: response.headers.get("content-type"),
    finalUrl: url,
    status: response.status,
  }
}

export async function collectSourceEvidence(
  record,
  {
    fetchImpl = fetch,
    now = () => new Date().toISOString(),
    timeoutMs = 15_000,
  } = {}
) {
  const evidenceUrl = selectProviderEvidenceUrl(record)
  if (!evidenceUrl) {
    return {
      error: "provider_evidence_url_missing",
      evidenceUrl: null,
      fetchedAt: now(),
      recordId: readString(
        record.sourceRecordId,
        record.source_record_id,
        record.id
      ),
      status: "skipped",
    }
  }

  try {
    const response = await fetchPublicSource(evidenceUrl, {
      fetchImpl,
      timeoutMs,
    })
    const page = extractSourcePageEvidence({
      body: response.body,
      contentType: response.contentType,
      url: response.finalUrl,
    })
    return {
      ...page,
      comparisons: compareRecordToSourceEvidence(record, page),
      fetchedAt: now(),
      httpStatus: response.status,
      recordId: readString(
        record.sourceRecordId,
        record.source_record_id,
        record.id
      ),
      status: "fetched",
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      evidenceUrl,
      fetchedAt: now(),
      recordId: readString(
        record.sourceRecordId,
        record.source_record_id,
        record.id
      ),
      status: "failed",
    }
  }
}
