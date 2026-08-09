export const PERSON_SOCIAL_PLATFORMS = [
  {
    key: "linkedin",
    label: "LinkedIn",
    placeholder: "https://linkedin.com/in/username",
  },
  {
    key: "instagram",
    label: "Instagram",
    placeholder: "https://instagram.com/username",
  },
  {
    key: "facebook",
    label: "Facebook",
    placeholder: "https://facebook.com/username",
  },
  {
    key: "twitter",
    label: "X",
    placeholder: "https://x.com/username",
  },
  {
    key: "youtube",
    label: "YouTube",
    placeholder: "https://youtube.com/@channel",
  },
  {
    key: "tiktok",
    label: "TikTok",
    placeholder: "https://tiktok.com/@username",
  },
] as const

export type PersonSocialPlatform =
  (typeof PERSON_SOCIAL_PLATFORMS)[number]["key"]

export type PersonSocialLinks = Record<PersonSocialPlatform, string>
export type PersonSocialLinkInput = Partial<
  Record<PersonSocialPlatform, string | null | undefined>
>

const PROFILE_BASE_URLS: Record<PersonSocialPlatform, string> = {
  linkedin: "https://www.linkedin.com/in/",
  instagram: "https://www.instagram.com/",
  facebook: "https://www.facebook.com/",
  twitter: "https://x.com/",
  youtube: "https://www.youtube.com/@",
  tiktok: "https://www.tiktok.com/@",
}

const PROFILE_HOSTNAMES: Record<PersonSocialPlatform, readonly string[]> = {
  linkedin: ["linkedin.com"],
  instagram: ["instagram.com"],
  facebook: ["facebook.com", "fb.com"],
  twitter: ["x.com", "twitter.com"],
  youtube: ["youtube.com"],
  tiktok: ["tiktok.com"],
}

function normalizeSocialValue(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 2048) : ""
}

function isPlatformHostname(platform: PersonSocialPlatform, hostname: string) {
  const normalizedHostname = hostname.toLowerCase().replace(/\.$/, "")
  return PROFILE_HOSTNAMES[platform].some(
    (allowedHostname) =>
      normalizedHostname === allowedHostname ||
      normalizedHostname.endsWith(`.${allowedHostname}`)
  )
}

export function readPersonSocialLinks(
  source: PersonSocialLinkInput | null | undefined
): PersonSocialLinks {
  return Object.fromEntries(
    PERSON_SOCIAL_PLATFORMS.map(({ key }) => [
      key,
      normalizeSocialValue(source?.[key]),
    ])
  ) as PersonSocialLinks
}

export function normalizePersonSocialLinks(
  source: PersonSocialLinkInput,
  fallback?: PersonSocialLinkInput | null
): Record<PersonSocialPlatform, string | null> {
  return Object.fromEntries(
    PERSON_SOCIAL_PLATFORMS.map(({ key }) => {
      const value = source[key] === undefined ? fallback?.[key] : source[key]
      return [key, normalizeSocialValue(value) || null]
    })
  ) as Record<PersonSocialPlatform, string | null>
}

export function resolvePersonSocialHref(
  platform: PersonSocialPlatform,
  value: string | null | undefined
) {
  const normalized = normalizeSocialValue(value)
  if (!normalized) return ""

  if (
    /^[a-z][a-z\d+.-]*:/i.test(normalized) &&
    !/^https?:\/\//i.test(normalized)
  ) {
    return ""
  }

  if (/^https?:\/\//i.test(normalized)) {
    try {
      const url = new URL(normalized)
      return (url.protocol === "http:" || url.protocol === "https:") &&
        isPlatformHostname(platform, url.hostname)
        ? url.toString()
        : ""
    } catch {
      return ""
    }
  }

  const handle = normalized.replace(/^@/, "").replace(/^\/+|\/+$/g, "")
  if (!handle || /\s/.test(handle)) return ""
  if (platform === "linkedin" && /^(in|company)\//i.test(handle)) {
    return `https://www.linkedin.com/${handle}`
  }
  if (platform === "youtube" && /^(channel|c|user)\//i.test(handle)) {
    return `https://www.youtube.com/${handle}`
  }
  return `${PROFILE_BASE_URLS[platform]}${handle}`
}

export function getPersonSocialLinkError(
  platform: PersonSocialPlatform,
  value: string | null | undefined
) {
  const normalized = normalizeSocialValue(value)
  if (!normalized || resolvePersonSocialHref(platform, normalized)) return null

  const label =
    PERSON_SOCIAL_PLATFORMS.find((item) => item.key === platform)?.label ??
    "social media"
  return `Enter a valid ${label} profile URL or handle.`
}

export function findPersonSocialLinkError(source: PersonSocialLinkInput) {
  for (const { key } of PERSON_SOCIAL_PLATFORMS) {
    if (source[key] === undefined) continue
    const error = getPersonSocialLinkError(key, source[key])
    if (error) return error
  }
  return null
}
