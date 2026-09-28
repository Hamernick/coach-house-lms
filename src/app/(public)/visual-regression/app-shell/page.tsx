import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { AppShellVisualFixture } from "@/features/mobile-navigation/client"
import { canAccessVisualRegressionRoute } from "@/lib/visual-regression-access"

export default async function AppShellVisualRegressionPage({
  searchParams,
}: {
  searchParams: Promise<{ scenario?: string; rail?: string; mode?: string }>
}) {
  if (!canAccessVisualRegressionRoute(await headers())) notFound()
  const { scenario, rail, mode } = await searchParams
  return (
    <AppShellVisualFixture
      scenario={scenario}
      withRail={rail !== "none"}
      fullBleed={mode === "full-bleed"}
    />
  )
}
