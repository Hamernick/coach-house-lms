import type { MetadataRoute } from "next"

function publicOrigin() {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000"

  try {
    return new URL(configured).origin
  } catch {
    return "http://localhost:3000"
  }
}

export default function robots(): MetadataRoute.Robots {
  const origin = publicOrigin()

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/", "/internal/", "/workspace/"],
    },
    sitemap: `${origin}/sitemap.xml`,
  }
}
