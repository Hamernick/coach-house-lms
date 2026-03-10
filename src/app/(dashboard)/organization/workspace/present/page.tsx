import { redirect } from "next/navigation"

type WorkspaceSearchParams = Record<string, string | string[] | undefined>

function buildSearchParamsQuery(searchParams: WorkspaceSearchParams | undefined): string {
  if (!searchParams) return ""

  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") {
      query.set(key, value)
      continue
    }
    if (!Array.isArray(value)) continue
    for (const entry of value) {
      if (typeof entry === "string") {
        query.append(key, entry)
      }
    }
  }
  return query.toString()
}

export default async function LegacyOrganizationWorkspacePresentationPage({
  searchParams,
}: {
  searchParams?: Promise<WorkspaceSearchParams>
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const query = buildSearchParamsQuery(resolvedSearchParams)
  redirect(query ? `/workspace/present?${query}` : "/workspace/present")
}
