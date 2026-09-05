import type { Metadata } from "next"
import { DocumentationSearchPage } from "@/features/nonprofit-documentation"

export const metadata: Metadata = {
  title: "Search nonprofit documentation",
  description:
    "Find guidance, tools, and resources for starting and operating a nonprofit.",
  alternates: { canonical: "/documentation/search" },
  robots: { index: false, follow: true },
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>
}) {
  const { q } = await searchParams
  return <DocumentationSearchPage query={Array.isArray(q) ? q[0] : q} />
}
