import { redirect } from "next/navigation"

type SearchParams = Record<string, string | string[] | undefined>

type PricingPageProps = {
  searchParams?: Promise<SearchParams>
}

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const resolved = searchParams ? await searchParams : {}

  const params = new URLSearchParams()
  params.set("section", "pricing")

  for (const [key, value] of Object.entries(resolved)) {
    if (key === "section" || key === "embed") continue
    const normalized = Array.isArray(value) ? value[0] : value
    if (typeof normalized === "string" && normalized.length > 0) {
      params.set(key, normalized)
    }
  }

  redirect(`/?${params.toString()}`)
}
