type ErrorLike = {
  message?: unknown
}

function resolveErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (!error || typeof error !== "object") return null
  const { message } = error as ErrorLike
  if (typeof message === "string" && message.trim().length > 0) return message
  return null
}

export function supabaseErrorToError(error: unknown, fallbackMessage: string) {
  const message = resolveErrorMessage(error) ?? fallbackMessage
  const wrapped = new Error(message)
  ;(wrapped as Error & { cause?: unknown }).cause = error
  return wrapped
}

