import { redirect } from "next/navigation"

import type { MyOrganizationSearchParams } from "./_lib/types"

function buildSearchParamsQuery(searchParams: MyOrganizationSearchParams | undefined): string {
  if (!searchParams) return ""
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
  return query.toString()
}

export default async function LegacyMyOrganizationPage({
  searchParams,
}: {
  searchParams?: Promise<MyOrganizationSearchParams>
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const query = buildSearchParamsQuery(resolvedSearchParams)
  redirect(query ? `/workspace?${query}` : "/workspace")
}
