import { redirect } from "next/navigation"

type WorkspaceSearchParams = Record<string, string | string[] | undefined>

function buildSearchParamsQuery(searchParams: WorkspaceSearchParams | undefined): string {
  const query = new URLSearchParams()
  if (!searchParams) {
    query.set("mode", "present")
    return query.toString()
  }

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

  query.set("mode", "present")
  return query.toString()
}

export default async function WorkspacePresentationPage({
  searchParams,
}: {
  searchParams?: Promise<WorkspaceSearchParams>
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const query = buildSearchParamsQuery(resolvedSearchParams)
  redirect(`/workspace?${query}`)
}
