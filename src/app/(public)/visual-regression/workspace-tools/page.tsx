import { headers } from "next/headers"
import { notFound } from "next/navigation"

import { WorkspaceToolsPanel } from "@/features/workspace-tools"
import { canAccessVisualRegressionRoute } from "@/lib/visual-regression-access"

export default async function WorkspaceToolsVisualRegressionPage() {
  if (!canAccessVisualRegressionRoute(await headers())) notFound()

  return (
    <main className="bg-muted/25 min-h-screen px-4 py-8 sm:px-8 sm:py-12">
      <section
        data-workspace-tools-visual-fixture
        className="border-border/70 bg-background mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border shadow-sm"
      >
        <WorkspaceToolsPanel
          input={{ stripeConnection: { state: "not_configured" } }}
        />
      </section>
    </main>
  )
}
