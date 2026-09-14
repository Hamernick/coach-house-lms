import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { canAccessVisualRegressionRoute } from "@/lib/visual-regression-access"
import { RoadmapSaveFixture } from "./_components/roadmap-save-fixture"

export default async function Page() {
  if (!canAccessVisualRegressionRoute(await headers())) notFound()
  return <RoadmapSaveFixture />
}
