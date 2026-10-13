import { isIP } from "node:net"
import { isSpecificSocialAccountUrl } from "../../../../scripts/resource-map/lib/provider-page-signals.mjs"

export const METADATA_METHOD = "provider_json_ld_v1"
export const METADATA_PAGE_BYTES = 8192
const TYPES = new Set([
  "Organization",
  "NGO",
  "LocalBusiness",
  "EducationalOrganization",
  "MedicalOrganization",
  "School",
  "Library",
  "Hospital",
  "PerformingGroup",
  "SportsOrganization",
])
const list = (value) =>
  Array.isArray(value) ? value : value == null ? [] : [value]
const text = (value, max = 500) =>
  typeof value === "string" && value.trim() && value.length <= max
    ? value
    : null

function publicUrl(value, base) {
  if (typeof value !== "string" || value.length > 2000) return null
  try {
    const url = new URL(value, base)
    if (
      !/^https?:$/.test(url.protocol) ||
      url.username ||
      url.password ||
      url.port ||
      isIP(url.hostname) ||
      !url.hostname.includes(".") ||
      /\.(?:local|internal|localhost)$/i.test(url.hostname)
    )
      return null
    return url.href
  } catch {
    return null
  }
}

// Parse JSON only. Never execute scripts, expand contexts, or fetch references.
export function extractStructuredMetadata(html, pageUrl) {
  if (
    typeof html !== "string" ||
    Buffer.byteLength(html) > 1_000_000 ||
    !publicUrl(pageUrl, pageUrl)
  )
    return []
  const nodes = []
  let inspected = 0
  const visit = (value, depth = 0) => {
    if (!value || typeof value !== "object" || depth > 10 || inspected++ >= 250)
      return
    if (!Array.isArray(value)) nodes.push(value)
    for (const child of Object.values(value).slice(0, 100))
      visit(child, depth + 1)
  }
  let scripts = 0
  for (const match of html.matchAll(
    /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi
  )) {
    if (++scripts > 50) break
    if (
      !/(?:^|\s)type\s*=\s*(?:["']application\/ld\+json["']|application\/ld\+json(?=\s|$))/i.test(
        match[1]
      )
    )
      continue
    if (Buffer.byteLength(match[2]) > 128000) continue
    try {
      visit(JSON.parse(match[2]))
    } catch {
      /* malformed block is not evidence */
    }
  }
  const references = new Map()
  for (const node of nodes) {
    const id = publicUrl(node["@id"], pageUrl)
    if (id && Object.keys(node).length > 1) references.set(id, node)
  }
  const resolve = (value) => {
    const id =
      value && typeof value === "object"
        ? publicUrl(value["@id"], pageUrl)
        : null
    return id && references.has(id) ? references.get(id) : value
  }
  const asset = (value) => {
    const item = resolve(value)
    return publicUrl(
      typeof item === "string" ? item : (item?.contentUrl ?? item?.url),
      pageUrl
    )
  }
  const host = (url) => new URL(url).hostname.replace(/^www\./, "")
  const results = []
  for (const node of nodes) {
    if (
      !list(node["@type"]).some((type) =>
        TYPES.has(String(type).replace(/^https?:\/\/schema.org\//, ""))
      )
    )
      continue
    const organizationUrl =
      publicUrl(node.url, pageUrl) ?? publicUrl(node["@id"], pageUrl)
    if (
      !organizationUrl ||
      host(organizationUrl) !== host(pageUrl) ||
      !text(node.name)
    )
      continue
    const contacts = [node, ...list(node.contactPoint).slice(0, 6).map(resolve)]
    const unique = (values) => [...new Set(values.filter(Boolean))]
    const organization = {
      name: node.name,
      url: organizationUrl,
      description: text(node.description, 4000),
      socialUrls: unique(
        list(node.sameAs)
          .slice(0, 20)
          .map((value) => publicUrl(value, pageUrl))
          .filter((url) => url && isSpecificSocialAccountUrl(url))
      ).slice(0, 12),
      logos: unique(list(node.logo).slice(0, 20).map(asset)).slice(0, 4),
      images: unique(list(node.image).slice(0, 20).map(asset)).slice(0, 4),
      phones: unique(
        contacts
          .flatMap((contact) => list(contact?.telephone))
          .map((value) => text(value, 80))
          .filter((value) => value && /^\+?[\d\s().-]{7,40}$/.test(value))
      ).slice(0, 6),
      emails: unique(
        contacts
          .flatMap((contact) => list(contact?.email))
          .map((value) => text(value, 254))
          .filter(
            (value) => value && /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(value)
          )
      ).slice(0, 6),
    }
    if (
      Buffer.byteLength(JSON.stringify([...results, organization])) >
      METADATA_PAGE_BYTES - 1500
    )
      continue
    results.push(organization)
    if (results.length === 3) break
  }
  return results
}
