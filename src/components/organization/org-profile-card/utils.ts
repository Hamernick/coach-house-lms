import { inferProviderSlug } from "@/lib/lessons/providers"

export function slugifyLocal(input: string): string {
  const base = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
  return base.slice(0, 60).replace(/^-+|-+$/g, "")
}

export function inferSocialSlug(url: string): string {
  try {
    const u = new URL(url)
    const host = u.hostname.toLowerCase().replace(/^www\./, "")
    if (host.includes("linkedin.com")) return "linkedin"
    if (host.includes("facebook.com")) return "facebook"
    if (host.includes("instagram.com")) return "instagram"
    if (host.includes("github.com")) return "github"
    if (host.includes("x.com") || host.includes("twitter.com")) return "link"
    if (host.includes("tiktok.com")) return "link"
    return inferProviderSlug(url)
  } catch {
    return "generic"
  }
}

export function shortUrl(url: string): string {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, "")
    return host + u.pathname.replace(/\/$/, "")
  } catch {
    return url
  }
}

export function normalizeToList(value?: string | null): string[] {
  if (!value) return []
  const v = value.trim()
  if (v.length === 0) return []
  if (v.startsWith("[")) {
    try {
      const arr = JSON.parse(v)
      return Array.isArray(arr) ? arr.map((x) => String(x)) : []
    } catch {
      // fallthrough to comma-separated
    }
  }
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

export function buildAddressLines({
  street,
  city,
  state,
  postal,
  country,
  fallback,
}: {
  street?: string | null
  city?: string | null
  state?: string | null
  postal?: string | null
  country?: string | null
  fallback?: string | null
}): string[] {
  const lines: string[] = []
  if (street && street.trim()) lines.push(street.trim())
  const locality = [city, state, postal]
    .filter((part) => part && String(part).trim().length > 0)
    .map((part) => String(part).trim())
  if (locality.length > 0) lines.push(locality.join(", "))
  if (country && country.trim()) lines.push(country.trim())

  if (lines.length === 0 && fallback && fallback.trim()) {
    fallback
      .split(/\n+/)
      .map((segment) => segment.trim())
      .filter(Boolean)
      .forEach((segment) => lines.push(segment))
  }

  return lines
}

export function dateRangeChip(start?: string | null, end?: string | null): string | null {
  try {
    if (!start || !end) return null
    const s = new Date(start)
    const e = new Date(end)
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null
    const ms = Math.max(0, e.getTime() - s.getTime())
    const days = Math.ceil(ms / (1000 * 60 * 60 * 24))
    if (days <= 0) return null
    const weeks = Math.max(1, Math.round(days / 7))
    return `${weeks} Weeks`
  } catch {
    return null
  }
}

export function locationSummary(p: {
  location?: string | null
  address_city?: string | null
  address_state?: string | null
  address_country?: string | null
}): string | null {
  if (p?.location && String(p.location).trim()) return String(p.location)
  const city = (p?.address_city && String(p.address_city).trim()) || ""
  const state = (p?.address_state && String(p.address_state).trim()) || ""
  const country = (p?.address_country && String(p.address_country).trim()) || ""
  const parts: string[] = []
  if (city) parts.push(city)
  if (state) parts.push(state)
  if (!state && !city && country) parts.push(country)
  if (state && country && city) {
    if (/^(us|usa|united states)$/i.test(country)) {
      return `${city}, ${state}`
    }
  }
  return parts.length ? parts.join(", ") : country || null
}
