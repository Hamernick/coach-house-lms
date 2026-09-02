const SOCIAL_PLATFORMS = new Map([
  ["facebook.com", "facebook"],
  ["instagram.com", "instagram"],
  ["linkedin.com", "linkedin"],
  ["tiktok.com", "tiktok"],
  ["twitter.com", "x"],
  ["x.com", "x"],
  ["youtube.com", "youtube"],
])

const EVIDENCE_LINK_PATTERN =
  /\b(adopt|application|apply|care|contact|eligib|find help|find support|get help|hours|location|program|resource|schedule|service|support|workshop)\b/iu
const EXCLUDED_LINK_PATTERN =
  /\b(blog|careers?|donate|give|login|news|privacy|shop|sign in|terms)\b/iu

function decodeHtml(value) {
  return String(value ?? "")
    .replace(/&amp;/giu, "&")
    .replace(/&quot;|&#34;/giu, '"')
    .replace(/&#39;|&apos;/giu, "'")
    .replace(/&lt;/giu, "<")
    .replace(/&gt;/giu, ">")
    .replace(/&nbsp;|&#160;/giu, " ")
    .replace(/&#(\d+);/gu, (_, codePoint) =>
      String.fromCodePoint(Number.parseInt(codePoint, 10))
    )
    .replace(/&#x([\da-f]+);/giu, (_, codePoint) =>
      String.fromCodePoint(Number.parseInt(codePoint, 16))
    )
}

function stripTags(value) {
  return decodeHtml(value)
    .replace(/<[^>]+>/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
}

function visiblePageText(value) {
  return stripTags(
    String(value ?? "")
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/giu, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/giu, " ")
      .replace(/<!--([\s\S]*?)-->/gu, " ")
  )
}

function readAttribute(tag, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")
  const quoted = tag.match(
    new RegExp(`\\b${escaped}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, "iu")
  )
  if (quoted?.[2]) return decodeHtml(quoted[2]).trim()
  const bare = tag.match(new RegExp(`\\b${escaped}\\s*=\\s*([^\\s>]+)`, "iu"))
  return decodeHtml(bare?.[1]).trim() || null
}

function normalizeHttpUrl(value, baseUrl) {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    ["null", "undefined"].includes(value.trim().toLocaleLowerCase("en-US"))
  ) {
    return null
  }
  try {
    const url = new URL(value, baseUrl)
    if (!["http:", "https:"].includes(url.protocol)) return null
    url.hash = ""
    return url.toString()
  } catch {
    return null
  }
}

function decodeContactValue(value) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function isPlausibleEmail(value) {
  const [localPart, domain] = value.toLocaleLowerCase("en-US").split("@")
  return Boolean(
    localPart &&
    domain &&
    !["email", "example", "filler", "name", "test", "user"].includes(
      localPart
    ) &&
    !["domain.com", "example.com", "example.net", "example.org"].includes(
      domain
    )
  )
}

function baseHost(value) {
  const parts = value
    .toLocaleLowerCase("en-US")
    .replace(/^www\./u, "")
    .split(".")
    .filter(Boolean)
  return parts.slice(-2).join(".")
}

function isSameSite(value, baseUrl) {
  return (
    baseHost(new URL(value).hostname) === baseHost(new URL(baseUrl).hostname)
  )
}

function uniqueBy(rows, readKey) {
  const seen = new Set()
  return rows.filter((row) => {
    const key = readKey(row)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function socialPlatform(value) {
  const host = baseHost(new URL(value).hostname)
  return SOCIAL_PLATFORMS.get(host) ?? null
}

export function isSpecificSocialAccountUrl(value) {
  try {
    const url = new URL(value)
    const platform = socialPlatform(url.toString())
    if (!platform) return false
    const segments = url.pathname.split("/").filter(Boolean)
    if (segments.length === 0) return false
    if (
      platform === "linkedin" &&
      segments[0].toLocaleLowerCase("en-US") === "in"
    ) {
      return false
    }
    if (
      platform === "facebook" &&
      segments[0].toLocaleLowerCase("en-US") === "profile.php"
    ) {
      return false
    }
    return !["home", "intent", "login", "share", "sharer", "signup"].includes(
      segments[0].toLocaleLowerCase("en-US")
    )
  } catch {
    return false
  }
}

function normalizeSocialUrl(value) {
  const url = new URL(value)
  url.protocol = "https:"
  url.search = ""
  url.hash = ""
  return url.toString()
}

function socialAccountKey(account) {
  const url = new URL(account.url)
  url.pathname = url.pathname.replace(/\/+$/u, "") || "/"
  return `${account.platform}:${url.toString()}`
}

function contactKey(contact) {
  let value = contact.value.toLocaleLowerCase("en-US")
  if (contact.type === "phone") {
    value = value.replace(/\D/gu, "")
    if (value.length === 11 && value.startsWith("1")) value = value.slice(1)
  }
  return `${contact.type}:${value}`
}

function readMetaContent(html, key, expected) {
  for (const tag of html.match(/<meta\b[^>]*>/giu) ?? []) {
    if (readAttribute(tag, key)?.toLocaleLowerCase("en-US") === expected) {
      return readAttribute(tag, "content")
    }
  }
  return null
}

function extractImageCandidates(html, baseUrl) {
  const candidates = []
  const openGraphImage = readMetaContent(html, "property", "og:image")
  const normalizedOpenGraph = normalizeHttpUrl(openGraphImage, baseUrl)
  if (normalizedOpenGraph) {
    candidates.push({
      url: normalizedOpenGraph,
      kind: "open_graph_image",
      sourceUrl: baseUrl,
      publishable: false,
    })
  }
  for (const tag of html.match(/<img\b[^>]*>/giu) ?? []) {
    const alt = readAttribute(tag, "alt")
    if (!/\blogo\b/iu.test(alt ?? "")) continue
    const url = normalizeHttpUrl(
      readAttribute(tag, "src") ?? readAttribute(tag, "data-src"),
      baseUrl
    )
    if (!url) continue
    candidates.push({
      url,
      alt,
      kind: "logo_candidate",
      sourceUrl: baseUrl,
      publishable: false,
    })
    if (candidates.length >= 5) break
  }
  return uniqueBy(candidates, (candidate) => candidate.url).slice(0, 5)
}

export function extractProviderPageSignals({ html, url }) {
  const socialAccounts = []
  const evidenceLinkCandidates = []
  const contacts = []

  for (const match of String(html ?? "").matchAll(
    /<a\b([^>]*)>([\s\S]*?)<\/a>/giu
  )) {
    const tag = `<a ${match[1]}>`
    const href = readAttribute(tag, "href")
    const label = stripTags(match[2])
    if (!href) continue
    if (
      /\bcontext\.(?:item|submission)\b|\{\{|\}\}/iu.test(href) ||
      ["''", '""'].includes(href.trim())
    ) {
      continue
    }
    if (/^mailto:/iu.test(href)) {
      const email = decodeContactValue(href)
        .replace(/^mailto:/iu, "")
        .split("?")[0]
        .trim()
      if (email && isPlausibleEmail(email)) {
        contacts.push({ type: "email", value: email, sourceUrl: url })
      }
      continue
    }
    if (/^tel:/iu.test(href)) {
      const phone = decodeContactValue(href).replace(/^tel:/iu, "").trim()
      if (phone) contacts.push({ type: "phone", value: phone, sourceUrl: url })
      continue
    }
    const normalizedUrl = normalizeHttpUrl(href, url)
    if (!normalizedUrl) continue
    const platform = socialPlatform(normalizedUrl)
    if (platform && isSpecificSocialAccountUrl(normalizedUrl)) {
      socialAccounts.push({
        platform,
        url: normalizeSocialUrl(normalizedUrl),
        sourceUrl: url,
        providerLinked: true,
      })
      continue
    }
    if (!isSameSite(normalizedUrl, url)) continue
    if (normalizedUrl === normalizeHttpUrl(url, url)) continue
    const searchText = `${label} ${new URL(normalizedUrl).pathname}`
    if (
      EVIDENCE_LINK_PATTERN.test(searchText) &&
      !EXCLUDED_LINK_PATTERN.test(searchText)
    ) {
      evidenceLinkCandidates.push({
        url: normalizedUrl,
        label: label || null,
        sourceUrl: url,
        providerLinked: true,
      })
    }
  }

  const pageText = visiblePageText(html)
  for (const match of pageText.matchAll(
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu
  )) {
    if (isPlausibleEmail(match[0])) {
      contacts.push({
        type: "email",
        value: match[0],
        sourceUrl: url,
        sourceMethod: "page_text",
      })
    }
  }
  for (const match of pageText.matchAll(
    /(?:\+?1[\s.()-]+)?(?:\d{3}|\(\d{3}\))[\s.-]+\d{3}[\s.-]+\d{4}\b/gu
  )) {
    contacts.push({
      type: "phone",
      value: match[0].trim(),
      sourceUrl: url,
      sourceMethod: "page_text",
    })
  }

  return {
    schemaVersion: 1,
    socialAccounts: uniqueBy(socialAccounts, socialAccountKey).slice(0, 12),
    evidenceLinkCandidates: uniqueBy(
      evidenceLinkCandidates,
      (candidate) => candidate.url
    ).slice(0, 20),
    contacts: uniqueBy(contacts, contactKey).slice(0, 12),
    imageCandidates: extractImageCandidates(String(html ?? ""), url),
  }
}
