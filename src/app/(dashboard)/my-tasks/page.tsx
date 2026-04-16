import { redirect } from "next/navigation"

function buildTasksAliasRedirectDestination(
  searchParams: Record<string, string | string[] | undefined> | undefined,
) {
  if (!searchParams) return "/tasks"

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
  return serialized ? `/tasks?${serialized}` : "/tasks"
}

export default async function MyTasksPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
} = {}) {
  redirect(buildTasksAliasRedirectDestination(searchParams ? await searchParams : undefined))
}
