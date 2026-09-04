import { permanentRedirect } from "next/navigation"

import { buildFindOrganizationHref } from "@/lib/find/routes"

type LegacyFindOrganizationPageProps = {
  params: Promise<{ slug: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function LegacyFindOrganizationPage({
  params,
  searchParams,
}: LegacyFindOrganizationPageProps) {
  const [{ slug }, resolved] = await Promise.all([
    params,
    searchParams ?? Promise.resolve(undefined),
  ])
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(resolved ?? {})) {
    if (typeof value === "string") query.append(key, value)
    if (Array.isArray(value)) {
      for (const item of value) query.append(key, item)
    }
  }

  permanentRedirect(buildFindOrganizationHref(slug, query))
}
