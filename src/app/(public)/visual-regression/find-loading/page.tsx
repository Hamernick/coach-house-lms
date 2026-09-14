import { MobileMapFixture } from "./mobile-map-fixture"

import { headers } from "next/headers"
import { notFound } from "next/navigation"

import { HomeCanvasFindShell } from "@/components/public/home-canvas-find-shell"
import {
  FindMapLoadingSidebar,
  FindMapLoadingState,
} from "@/features/find-map/components/find-map-loading-state"
import { canAccessVisualRegressionRoute } from "@/lib/visual-regression-access"

export default async function FindLoadingVisualRegressionPage({
  searchParams,
}: {
  searchParams: Promise<{ shell?: string }>
}) {
  if (!canAccessVisualRegressionRoute(await headers())) {
    notFound()
  }

  if ((await searchParams).shell === "app") return <MobileMapFixture />

  return (
    <HomeCanvasFindShell
      showAuthActions={false}
      sidebarFallback={<FindMapLoadingSidebar />}
    >
      <FindMapLoadingState />
    </HomeCanvasFindShell>
  )
}
