'use client'

type QueryLikeError = {
  message?: string
  response?: {
    data?: {
      message?: string
    }
  }
}

export function extractSupabaseManagerErrorMessage(
  error: QueryLikeError | null | undefined,
  fallback: string
) {
  const responseMessage = error?.response?.data?.message?.trim()
  if (responseMessage) return responseMessage

  const directMessage = error?.message?.trim()
  if (directMessage) return directMessage

  return fallback
}
