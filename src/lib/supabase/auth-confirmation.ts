import type { EmailOtpType } from "@supabase/supabase-js"

import { DEFAULT_POST_AUTH_REDIRECT, getSafeRedirectPath } from "@/lib/auth/redirects"

const AUTH_CALLBACK_PATH = "/auth/callback"
const ALLOWED_CONFIRMATION_DESTINATION_ORIGINS = new Set([
  "https://coachhouse.app",
])

export function getSafeEmailOtpType(value: unknown): EmailOtpType | null {
  if (typeof value !== "string") return null
  const normalized = value.toLowerCase()
  switch (normalized) {
    case "email":
    case "signup":
    case "invite":
    case "magiclink":
    case "recovery":
    case "email_change":
      return normalized
    default:
      return null
  }
}

function unwrapAuthCallbackRedirect(path: string): string | null {
  const safePath = getSafeRedirectPath(path)
  if (!safePath) return null

  const callbackUrl = new URL(safePath, "https://coachhouse.app")
  if (callbackUrl.pathname !== AUTH_CALLBACK_PATH) return safePath

  return getSafeRedirectPath(callbackUrl.searchParams.get("redirect")) ?? null
}

function getAllowedDestinationOrigins(requestOrigin?: string | null) {
  const allowedOrigins = new Set(ALLOWED_CONFIRMATION_DESTINATION_ORIGINS)
  if (requestOrigin) allowedOrigins.add(requestOrigin)
  return allowedOrigins
}

function buildAbsoluteDestination(origin: string, path: string) {
  const destination = new URL(path, origin)
  return `${destination.origin}${destination.pathname}${destination.search}`
}

function resolveAllowedAbsoluteDestination(
  value: string,
  requestOrigin?: string | null,
) {
  try {
    const destinationUrl = new URL(value)
    if (!getAllowedDestinationOrigins(requestOrigin).has(destinationUrl.origin)) {
      return null
    }

    const resolvedPath = unwrapAuthCallbackRedirect(
      `${destinationUrl.pathname}${destinationUrl.search}`,
    )
    if (!resolvedPath) return null

    return {
      origin: destinationUrl.origin,
      path: resolvedPath,
    }
  } catch {
    return null
  }
}

export function resolveAuthConfirmationDestination(
  rawDestination: unknown,
  requestOrigin?: string | null,
) {
  const fallback = DEFAULT_POST_AUTH_REDIRECT

  if (typeof rawDestination !== "string" || rawDestination.trim().length === 0) {
    return fallback
  }

  const trimmed = rawDestination.trim()
  const directPath = unwrapAuthCallbackRedirect(trimmed)
  if (directPath) return directPath

  const absoluteDestination = resolveAllowedAbsoluteDestination(trimmed, requestOrigin)
  if (!absoluteDestination) return fallback

  return buildAbsoluteDestination(absoluteDestination.origin, absoluteDestination.path)
}

export function buildLoginUrlWithAuthConfirmationError({
  destination,
  message,
}: {
  destination: string
  message: string
}) {
  const directPath = unwrapAuthCallbackRedirect(destination)
  const absoluteDestination = directPath
    ? null
    : resolveAllowedAbsoluteDestination(destination)
  const loginUrl = new URL("/login", absoluteDestination?.origin ?? "https://coachhouse.app")
  loginUrl.searchParams.set(
    "redirect",
    directPath ?? absoluteDestination?.path ?? fallbackDestination(),
  )
  loginUrl.searchParams.set("error", message)
  if (absoluteDestination) return loginUrl.toString()
  return `${loginUrl.pathname}${loginUrl.search}`
}

export function resolvePostAuthConfirmationRedirect(
  destination: string,
  requestOrigin?: string | null,
) {
  if (!requestOrigin) return destination

  try {
    const destinationUrl = new URL(destination)
    if (destinationUrl.origin === requestOrigin) return destination
    if (!getAllowedDestinationOrigins(requestOrigin).has(destinationUrl.origin)) {
      return DEFAULT_POST_AUTH_REDIRECT
    }

    const redirectPath =
      getSafeRedirectPath(`${destinationUrl.pathname}${destinationUrl.search}`) ??
      fallbackDestination()
    const loginUrl = new URL("/login", destinationUrl.origin)
    loginUrl.searchParams.set("redirect", redirectPath)
    loginUrl.searchParams.set("notice", "email_confirmed_sign_in")
    return loginUrl.toString()
  } catch {
    return destination
  }
}

function fallbackDestination() {
  return DEFAULT_POST_AUTH_REDIRECT
}
