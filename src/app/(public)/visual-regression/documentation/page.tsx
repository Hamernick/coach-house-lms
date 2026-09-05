import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { DocumentationVisualFixture } from "@/features/nonprofit-documentation"
import { canAccessVisualRegressionRoute } from "@/lib/visual-regression-access"

export default async function DocumentationVisualRegressionPage({
  searchParams,
}: {
  searchParams: Promise<{ viewer?: string }>
}) {
  if (!canAccessVisualRegressionRoute(await headers())) notFound()
  const { viewer = "anonymous" } = await searchParams
  return <DocumentationVisualFixture viewer={viewer} />
}
