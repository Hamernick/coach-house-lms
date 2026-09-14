const TRACKING_PARAMETERS = new Set([
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
  "ref",
  "source",
])

function escapePattern(value) {
  return value.replace(/[.+?^${}()|[\]\\]/gu, "\\$&")
}

export function normalizeAcquisitionUrl(value) {
  try {
    const url = new URL(value)
    if (!["http:", "https:"].includes(url.protocol)) return null
    if (url.username || url.password) return null
    url.hash = ""
    url.hostname = url.hostname.toLocaleLowerCase("en-US")
    for (const key of [...url.searchParams.keys()]) {
      const normalizedKey = key.toLowerCase()
      if (
        normalizedKey.startsWith("utm_") ||
        TRACKING_PARAMETERS.has(normalizedKey)
      ) {
        url.searchParams.delete(key)
      }
    }
    url.searchParams.sort()
    return url.toString()
  } catch {
    return null
  }
}

export function acquisitionHostKey(value) {
  const normalized = normalizeAcquisitionUrl(value)
  return normalized ? new URL(normalized).hostname : null
}

export function robotsUrlFor(value) {
  const normalized = normalizeAcquisitionUrl(value)
  return normalized ? new URL("/robots.txt", normalized).toString() : null
}

export function parseRobotsTxt(body) {
  const groups = []
  let agents = []
  let rules = []
  let crawlDelaySeconds = null
  let hasDirectives = false

  const flush = () => {
    if (agents.length === 0) return
    groups.push({ agents, rules, crawlDelaySeconds })
    agents = []
    rules = []
    crawlDelaySeconds = null
    hasDirectives = false
  }

  for (const rawLine of String(body ?? "").split(/\r?\n/u)) {
    const line = rawLine.replace(/#.*$/u, "").trim()
    if (!line) continue
    const separator = line.indexOf(":")
    if (separator < 0) continue
    const field = line.slice(0, separator).trim().toLowerCase()
    const value = line.slice(separator + 1).trim()
    if (field === "user-agent") {
      if (hasDirectives) flush()
      agents.push(value.toLowerCase())
      continue
    }
    if (agents.length === 0) continue
    if (field === "allow" || field === "disallow") {
      rules.push({ directive: field, path: value })
      hasDirectives = true
    } else if (field === "crawl-delay") {
      const parsed = Number(value)
      crawlDelaySeconds = Number.isFinite(parsed) && parsed >= 0 ? parsed : null
      hasDirectives = true
    }
  }
  flush()
  return groups
}

function matchingGroups(groups, userAgent) {
  const normalizedAgent = userAgent.toLowerCase()
  const matches = groups
    .map((group) => ({
      group,
      matchLength: Math.max(
        ...group.agents.map((agent) =>
          agent === "*" || normalizedAgent.includes(agent) ? agent.length : -1
        )
      ),
    }))
    .filter((entry) => entry.matchLength >= 0)
  if (matches.length === 0) return []
  const longest = Math.max(...matches.map((entry) => entry.matchLength))
  return matches
    .filter((entry) => entry.matchLength === longest)
    .map((entry) => entry.group)
}

function ruleMatches(rulePath, target) {
  if (!rulePath) return false
  const endAnchored = rulePath.endsWith("$")
  const rawPattern = endAnchored ? rulePath.slice(0, -1) : rulePath
  const pattern = escapePattern(rawPattern).replaceAll("*", ".*")
  return new RegExp(`^${pattern}${endAnchored ? "$" : ""}`, "u").test(target)
}

export function evaluateParsedRobots({ groups, url, userAgent }) {
  const normalized = normalizeAcquisitionUrl(url)
  if (!normalized) return { allowed: false, reason: "invalid_url" }
  const selectedGroups = matchingGroups(groups, userAgent)
  const target = `${new URL(normalized).pathname}${new URL(normalized).search}`
  const matches = selectedGroups
    .flatMap((group) => group.rules)
    .filter((rule) => ruleMatches(rule.path, target))
    .sort(
      (left, right) =>
        right.path.length - left.path.length ||
        Number(right.directive === "allow") - Number(left.directive === "allow")
    )
  const winningRule = matches[0] ?? null
  const crawlDelaySeconds = Math.max(
    0,
    ...selectedGroups.map((group) => group.crawlDelaySeconds ?? 0)
  )
  return {
    allowed: winningRule?.directive !== "disallow",
    reason: winningRule ? `robots_${winningRule.directive}` : "robots_no_match",
    matchedPath: winningRule?.path ?? null,
    crawlDelayMs: Math.min(crawlDelaySeconds * 1_000, 60_000),
  }
}

export function evaluateRobotsResponse({
  status,
  body,
  url,
  userAgent = "CoachHouseResourceResearch",
}) {
  if (status >= 200 && status < 300) {
    return evaluateParsedRobots({
      groups: parseRobotsTxt(body),
      url,
      userAgent,
    })
  }
  if (status === 401 || status === 403) {
    return { allowed: false, reason: "robots_forbidden", crawlDelayMs: 0 }
  }
  if (status >= 400 && status < 500) {
    return { allowed: true, reason: "robots_unavailable", crawlDelayMs: 0 }
  }
  return { allowed: false, reason: "robots_unreachable", crawlDelayMs: 0 }
}

export function buildHostAcquisitionPolicy(hostname, { maxRequests = 3 } = {}) {
  return {
    hostname,
    maxConcurrent: 1,
    minDelayMs: 1_000,
    maxRequests,
    requireRobotsCheck: true,
    redirectPolicy: "manual_revalidate_every_hop",
    credentialsAllowed: false,
    publicationBlocked: true,
  }
}
