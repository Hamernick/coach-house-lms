export const DEFAULT_POST_AUTH_REDIRECT = "/workspace"

export function getSafeRedirectPath(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  if (!value.startsWith("/")) return undefined
  if (value.startsWith("//")) return undefined
  return value
}
