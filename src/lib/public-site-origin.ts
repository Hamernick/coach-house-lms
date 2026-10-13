/** Shared absolute origin for public metadata, profiles, sitemap and robots. */
export function getPublicSiteOrigin(): string {
  const fallback = "http://localhost:3000"
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    fallback

  try {
    const url = new URL(configured)
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
      return fallback
    }
    return url.origin
  } catch {
    return fallback
  }
}
