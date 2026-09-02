export const PUBLIC_HANDLE_MIN_LENGTH = 2
export const PUBLIC_HANDLE_MAX_LENGTH = 48

export const PUBLIC_HANDLE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const RESERVED_PUBLIC_HANDLES = new Set([
  "_next",
  "academy",
  "accelerator",
  "access-requests",
  "admin",
  "api",
  "assets",
  "auth",
  "billing",
  "callback",
  "class",
  "classes",
  "coaching",
  "community",
  "dashboard",
  "db-viewer",
  "documents",
  "email",
  "favicon",
  "find",
  "fiscal-sponsorship",
  "forgot-password",
  "go",
  "home",
  "home-canvas",
  "internal",
  "join-organization",
  "legacy-home",
  "login",
  "marketplace",
  "my-organization",
  "my-tasks",
  "news",
  "notifications",
  "onboarding",
  "organization",
  "organizations",
  "people",
  "pricing",
  "privacy",
  "projects",
  "public",
  "roadmap",
  "robots",
  "sign-up",
  "signup",
  "sitemap",
  "status",
  "strategic-roadmap",
  "tasks",
  "team",
  "terms",
  "tester",
  "training",
  "unsubscribe",
  "update-password",
  "visual-regression",
  "workspace",
])

export type PublicHandleValidationCode = "available" | "invalid" | "reserved"

export type PublicHandleValidationResult =
  | { code: "available"; handle: string; valid: true }
  | { code: "invalid" | "reserved"; handle: string; valid: false }

export function normalizePublicHandle(value: string) {
  return value.trim().replace(/^@+/, "").toLowerCase()
}

export function validatePublicHandle(
  value: string
): PublicHandleValidationResult {
  const handle = normalizePublicHandle(value)
  const hasValidLength =
    handle.length >= PUBLIC_HANDLE_MIN_LENGTH &&
    handle.length <= PUBLIC_HANDLE_MAX_LENGTH

  if (!hasValidLength || !PUBLIC_HANDLE_PATTERN.test(handle)) {
    return { code: "invalid", handle, valid: false }
  }

  if (RESERVED_PUBLIC_HANDLES.has(handle)) {
    return { code: "reserved", handle, valid: false }
  }

  return { code: "available", handle, valid: true }
}
