"use client"

function toOrigin(raw: string | null | undefined): string | null {
  if (!raw) return null
  try {
    return new URL(raw).origin
  } catch {
    return null
  }
}

function isLocalOrigin(origin: string) {
  return origin.includes("localhost") || origin.includes("127.0.0.1")
}

export function resolveAuthCallbackUrl(redirectTo: string): string | undefined {
  const configuredOrigin = toOrigin(process.env.NEXT_PUBLIC_SITE_URL)
  const browserOrigin = typeof window === "undefined" ? null : toOrigin(window.location.origin)

  const preferredOrigin =
    [configuredOrigin, browserOrigin].find((origin) => origin && !isLocalOrigin(origin)) ??
    configuredOrigin ??
    browserOrigin

  if (!preferredOrigin) return undefined
  return `${preferredOrigin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`
}
