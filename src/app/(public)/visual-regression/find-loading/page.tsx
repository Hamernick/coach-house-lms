import { headers } from "next/headers"
import { notFound } from "next/navigation"

import { HomeCanvasFindShell } from "@/components/public/home-canvas-find-shell"
import { FindMapLoadingState } from "@/features/find-map"
import { canAccessVisualRegressionRoute } from "@/lib/visual-regression-access"

export default async function FindLoadingVisualRegressionPage() {
  if (!canAccessVisualRegressionRoute(await headers())) {
    notFound()
  }

  return (
    <HomeCanvasFindShell showAuthActions={false}>
      <FindMapLoadingState />
    </HomeCanvasFindShell>
  )
}
