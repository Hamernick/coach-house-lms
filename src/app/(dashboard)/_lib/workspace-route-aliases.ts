import type { MyOrganizationSearchParams } from "../my-organization/_lib/types"

export function buildWorkspaceAliasRedirectDestination(
  searchParams: MyOrganizationSearchParams | undefined,
) {
  if (!searchParams) return "/workspace"

  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") {
      query.set(key, value)
      continue
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string") {
          query.append(key, item)
        }
      }
    }
  }

  const serialized = query.toString()
  return serialized ? `/workspace?${serialized}` : "/workspace"
}
