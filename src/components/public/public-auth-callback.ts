export function resolvePublicAuthCallbackHref({
  pathname,
  searchParams,
}: {
  pathname: string
  searchParams: URLSearchParams
}) {
  const hasAuthCallbackParams =
    searchParams.has("code") || (searchParams.has("token_hash") && searchParams.has("type"))

  if (!hasAuthCallbackParams) return null

  const next = new URLSearchParams(searchParams.toString())
  const query = next.toString()
  if (!query) return null

  return `/auth/callback?${query}`
}
