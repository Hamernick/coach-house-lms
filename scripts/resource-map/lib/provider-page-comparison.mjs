import { createHash } from "node:crypto"
import { lookup } from "node:dns/promises"
import { isIP } from "node:net"

import { extractProviderPageSignals } from "./provider-page-signals.mjs"
import { extractSourcePageEvidence } from "./source-evidence.mjs"

const MAX_BODY_BYTES = 1_500_000
const MAX_REDIRECTS = 5
const REQUEST_HEADERS = {
  Accept: "text/html,application/xhtml+xml",
  "User-Agent": "Mozilla/5.0 CoachHouseResourceMap/1.0",
}
const NAME_STOP_WORDS = new Set([
  "and",
  "association",
  "center",
  "chicago",
  "company",
  "corporation",
  "foundation",
  "for",
  "illinois",
  "inc",
  "incorporated",
  "nonprofit",
  "organization",
  "service",
  "services",
  "the",
])

const ACRONYM_STOP_WORDS = new Set([
  "and",
  "at",
  "chicago",
  "for",
  "illinois",
  "in",
  "of",
  "on",
  "the",
])

function readString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return null
}

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .toLocaleLowerCase("en-US")
    .replace(/&(?:amp|#38);/giu, " and ")
    .replace(/&(?:nbsp|#160);/giu, " ")
    .replace(/&#(?:39|x27);|&apos;/giu, "'")
    .replace(/&(?:quot|#34);/giu, '"')
    .replace(/['’]s\b/gu, "s")
    .replace(/[^a-z0-9]+/gu, " ")
    .replace(/\s+/gu, " ")
    .replace(/\b([a-z0-9]+) s\b/gu, "$1s")
    .trim()
}

export function normalizeProviderNameForExactMatch(value) {
  return normalizeText(value)
    .replace(
      /\b(?:co|company|corp|corporation|inc|incorporated|limited|llc|ltd)\b$/u,
      ""
    )
    .trim()
}

function meaningfulNameTokens(value) {
  return [
    ...new Set(
      normalizeText(value)
        .split(" ")
        .filter(
          (token) =>
            token.length >= 3 &&
            !NAME_STOP_WORDS.has(token) &&
            !/^\d+$/u.test(token)
        )
    ),
  ]
}

function providerNameAcronym(value) {
  const acronym = normalizeText(value)
    .split(" ")
    .filter(
      (token) =>
        token.length >= 2 &&
        !ACRONYM_STOP_WORDS.has(token) &&
        !/^\d+$/u.test(token)
    )
    .map((token) => token[0])
    .join("")
  return acronym.length >= 4 && acronym.length <= 10 ? acronym : null
}

function phoneDigits(value) {
  return String(value ?? "")
    .replace(/\D/gu, "")
    .slice(-7)
}

function allDigits(value) {
  return String(value ?? "").replace(/\D/gu, "")
}

function baseDomain(hostname) {
  const parts = hostname
    .replace(/^www\./iu, "")
    .split(".")
    .filter(Boolean)
  return parts.slice(-2).join(".")
}

function readPageTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/iu)
  return readString(match?.[1]?.replace(/<[^>]+>/gu, " "))
}

function visiblePageText(html) {
  return normalizeText(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/giu, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/giu, " ")
      .replace(/<!--([\s\S]*?)-->/gu, " ")
      .replace(/<[^>]+>/gu, " ")
  )
}

function isPrivateIpv4(address) {
  const parts = address.split(".").map(Number)
  const [a, b] = parts
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  )
}

function isPrivateAddress(address) {
  if (isIP(address) === 4) return isPrivateIpv4(address)
  const normalized = address.toLocaleLowerCase("en-US")
  if (normalized.startsWith("::ffff:")) {
    const mapped = normalized.slice("::ffff:".length)
    return isIP(mapped) === 4 ? isPrivateIpv4(mapped) : true
  }
  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    /^fe[89ab]/u.test(normalized)
  )
}

async function assertPublicHttpUrl(value) {
  const url = new URL(value)
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password
  ) {
    throw new Error("Provider URLs must use public HTTP(S).")
  }
  if (url.hostname === "localhost" || url.hostname.endsWith(".localhost")) {
    throw new Error("Provider URLs cannot use local hosts.")
  }
  const addresses = await lookup(url.hostname, { all: true, verbatim: true })
  if (
    addresses.length === 0 ||
    addresses.some(({ address }) => isPrivateAddress(address))
  ) {
    throw new Error("Provider URL resolved to a private or reserved address.")
  }
  return url
}

async function readLimitedBody(response) {
  const contentLength = Number(response.headers.get("content-length"))
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    throw new Error("Provider page exceeds the retained evidence limit.")
  }
  if (!response.body) return ""
  const reader = response.body.getReader()
  const chunks = []
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > MAX_BODY_BYTES) {
      await reader.cancel()
      throw new Error("Provider page exceeds the retained evidence limit.")
    }
    chunks.push(value)
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString(
    "utf8"
  )
}

async function fetchWithSafeRedirects(value, timeoutMs) {
  let current = await assertPublicHttpUrl(value)
  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    const response = await fetch(current, {
      headers: REQUEST_HEADERS,
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (response.status < 300 || response.status >= 400) return response
    const location = response.headers.get("location")
    if (!location) return response
    current = await assertPublicHttpUrl(new URL(location, current).toString())
  }
  throw new Error("Provider page exceeded the redirect limit.")
}

export function readProviderWebsite(record) {
  const fields = record?.extractedFields ?? record?.extracted_fields ?? {}
  const value = readString(
    fields.websiteUrl,
    fields.website_url,
    fields.website
  )
  if (!value) return null
  try {
    const url = new URL(value)
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : null
  } catch {
    return null
  }
}

export async function fetchProviderPageSnapshot(
  websiteUrl,
  { checkedAt = new Date().toISOString(), timeoutMs = 12_000 } = {}
) {
  try {
    const response = await fetchWithSafeRedirects(websiteUrl, timeoutMs)
    const contentType = response.headers.get("content-type") ?? ""
    const base = {
      checkedAt,
      contentType,
      finalUrl: response.url || websiteUrl,
      httpStatus: response.status,
      websiteUrl,
    }
    if (!response.ok) {
      return {
        ...base,
        fetchStatus: [404, 410].includes(response.status)
          ? "dead_link"
          : "unavailable",
      }
    }
    if (!/html|xhtml/iu.test(contentType)) {
      return { ...base, fetchStatus: "unsupported_content" }
    }
    const html = await readLimitedBody(response)
    const visibleText = visiblePageText(html)
    const pageEvidence = extractSourcePageEvidence({
      body: html,
      contentType,
      url: response.url || websiteUrl,
    })
    return {
      ...base,
      contentHash: createHash("sha256").update(html).digest("hex"),
      evidenceSnippet: visibleText.slice(0, 2_000),
      fetchStatus: "fetched",
      pageTitle: readPageTitle(html),
      pageEvidence,
      pageSignals: extractProviderPageSignals({
        html,
        url: response.url || websiteUrl,
      }),
      visibleText,
    }
  } catch (error) {
    return {
      checkedAt,
      error: error instanceof Error ? error.message : String(error),
      fetchStatus: "unavailable",
      websiteUrl,
    }
  }
}

export function compareProviderPageSnapshot(record, snapshot) {
  const fields = record?.extractedFields ?? record?.extracted_fields ?? {}
  if (snapshot.fetchStatus !== "fetched") {
    return { ...snapshot, status: snapshot.fetchStatus }
  }
  const providerNames = [
    fields.organizationName,
    fields.organization_name,
    fields.providerName,
    fields.provider_name,
  ]
    .map(readString)
    .filter(Boolean)
  const text = normalizeText(snapshot.visibleText ?? "")
  const allTokens = [...new Set(providerNames.flatMap(meaningfulNameTokens))]
  const matchedTokens = allTokens.filter((token) => text.includes(token))
  const tokenCoverage = allTokens.length
    ? matchedTokens.length / allTokens.length
    : 0
  const exactName = providerNames.some((name) => {
    const normalized = normalizeProviderNameForExactMatch(name)
    return normalized.length >= 5 && text.includes(normalized)
  })
  const pageTokens = new Set(normalizeText(text).split(" "))
  const matchedAcronym = providerNames
    .map(providerNameAcronym)
    .find((acronym) => acronym && pageTokens.has(acronym))
  const phone = phoneDigits(fields.phone)
  const phoneMatch = phone.length === 7 && allDigits(text).includes(phone)
  const hostText = normalizeText(new URL(snapshot.finalUrl).hostname)
  const crossSiteRedirect =
    baseDomain(new URL(snapshot.websiteUrl).hostname) !==
    baseDomain(new URL(snapshot.finalUrl).hostname)
  const acronymDomainMatch = providerNames
    .map(providerNameAcronym)
    .some(
      (acronym) => !crossSiteRedirect && acronym && hostText.includes(acronym)
    )
  const domainTokenMatch = allTokens.some(
    (token) =>
      token.length >= 5 && hostText.includes(token) && text.includes(token)
  )
  const multiTokenMatch =
    allTokens.length >= 2 && matchedTokens.length >= 2 && tokenCoverage >= 0.6
  const addressNumber = normalizeText(fields.address).match(/^\d+/u)?.[0]
  const addressNumberMatch = Boolean(
    addressNumber && text.includes(addressNumber)
  )
  const supported =
    exactName ||
    Boolean(matchedAcronym) ||
    acronymDomainMatch ||
    phoneMatch ||
    multiTokenMatch ||
    domainTokenMatch
  return {
    ...snapshot,
    addressNumberMatch,
    crossSiteRedirect,
    matchedSignals: [
      exactName ? "exact_provider_name" : null,
      matchedAcronym ? "provider_name_acronym" : null,
      acronymDomainMatch ? "provider_acronym_domain" : null,
      phoneMatch ? "phone" : null,
      multiTokenMatch ? "provider_name_tokens" : null,
      domainTokenMatch ? "provider_domain" : null,
      addressNumberMatch ? "address_number" : null,
    ].filter(Boolean),
    matchedTokens,
    status: supported
      ? "supported"
      : crossSiteRedirect
        ? "contradicted"
        : "weak_match",
    tokenCoverage: Number(tokenCoverage.toFixed(3)),
  }
}

function publicComparisonMetadata(comparison) {
  const { visibleText, evidenceSnippet, error, ...metadata } = comparison
  return metadata
}

function removeFailedWebsite(fields, websiteUrl) {
  const failed = new URL(websiteUrl).toString()
  fields.websiteUrl = null
  if ("website_url" in fields) fields.website_url = null
  if ("website" in fields) fields.website = null
  fields.links = (Array.isArray(fields.links) ? fields.links : []).filter(
    (link) => {
      try {
        return new URL(link?.url ?? link?.href).toString() !== failed
      } catch {
        return true
      }
    }
  )
}

export function applyProviderPageComparison(record, comparison) {
  const next = structuredClone(record)
  const fields = next.extractedFields ?? next.extracted_fields ?? {}
  next.extractedFields = fields
  const enrichment = fields.enrichment ?? {}
  const verification = enrichment.verification ?? {
    contradictions: [],
    status: "needs_review",
    unsupportedClaims: [],
  }
  const metadata = publicComparisonMetadata(comparison)
  fields.enrichment = {
    ...enrichment,
    providerPageComparison: metadata,
    verification,
  }
  next.rawSnapshot = {
    ...(next.rawSnapshot ?? next.raw_snapshot ?? {}),
    providerPageEvidence: {
      ...metadata,
      evidenceSnippet: comparison.evidenceSnippet ?? null,
    },
  }

  if (comparison.status === "supported") {
    fields.enrichment.sourceComparisonCount = Math.max(
      2,
      Number(enrichment.sourceComparisonCount ?? 0)
    )
    fields.enrichment.passes = [
      ...(Array.isArray(enrichment.passes) ? enrichment.passes : []),
      {
        name: "provider_page_identity_comparison",
        sourceUrl: comparison.finalUrl,
        status: "completed",
      },
    ]
    const observedAt = comparison.checkedAt
    const evidence = ["organizationName", "serviceTitle", "websiteUrl"]
      .filter((field) => fields[field])
      .map((field) => ({
        confidenceScore: 90,
        derivedFrom: [comparison.websiteUrl, comparison.finalUrl].filter(
          Boolean
        ),
        evidenceMetadata: {
          contentHash: comparison.contentHash,
          matchedSignals: comparison.matchedSignals,
          providerPageStatus: comparison.status,
        },
        evidenceType: "provider_page",
        fieldPath: `extractedFields.${field}`,
        observedAt,
        sourceUrl: comparison.finalUrl,
        transformation: "provider_page_identity_comparison",
      }))
    next.fieldEvidence = [
      ...(Array.isArray(next.fieldEvidence) ? next.fieldEvidence : []),
      ...evidence,
    ]
  } else if (["contradicted", "dead_link"].includes(comparison.status)) {
    const websiteUrl = readProviderWebsite(record)
    if (websiteUrl) removeFailedWebsite(fields, websiteUrl)
    if (comparison.status === "contradicted") {
      fields.enrichment.verification = {
        ...verification,
        contradictions: [
          ...(Array.isArray(verification.contradictions)
            ? verification.contradictions
            : []),
          {
            code: "provider_website_redirect_mismatch",
            sourceUrl: comparison.websiteUrl,
            finalUrl: comparison.finalUrl,
          },
        ],
      }
    }
  }
  return next
}
