type ErrorLike = {
  name?: unknown
  message?: unknown
}

export function isSupabaseAuthSessionMissingError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false
  const { name, message } = error as ErrorLike
  if (name === "AuthSessionMissingError") return true
  if (typeof message === "string" && message.toLowerCase().includes("auth session missing")) return true
  return false
}

