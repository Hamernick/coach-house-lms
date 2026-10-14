export function mergeSupportSearchResults<T extends { orgId: string; name: string }>(memberships: T[], matches: T[], query: string) {
  const search = query.trim().toLowerCase()
  const result = new Map(memberships.filter((entry) => !search || entry.name.toLowerCase().includes(search)).map((entry) => [entry.orgId, entry]))
  if (search.length >= 2) for (const entry of matches) if (!result.has(entry.orgId)) result.set(entry.orgId, entry)
  return [...result.values()]
}

export function createOrganizationScopedFetch(baseFetch: typeof fetch, organizationId: string, baseHref: string, supportAccess = false): typeof fetch {
  return (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input), baseHref)
    if (url.origin !== new URL(baseHref).origin) return baseFetch(input, init)
    const headers = new Headers(input instanceof Request ? input.headers : undefined)
    new Headers(init?.headers).forEach((value, key) => headers.set(key, value))
    headers.set("x-coach-house-organization-id", organizationId)
    headers.set("x-coach-house-support-mode", supportAccess ? "1" : "0")
    return baseFetch(input, { ...init, headers })
  }
}
