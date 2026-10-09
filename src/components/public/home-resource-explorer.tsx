import { Suspense } from "react"
import { PublicFindRoute } from "@/features/find-map"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"
import type { ExternalResourceMapItem } from "@/lib/public-map/resource-map-items"
import { HomeCanvasFindShell } from "./home-canvas-find-shell"
import { PublicMapHomeLoading } from "./public-map-index/map-loading-state"

export function PublicHomeResourceExplorer({ searchParams, initialOrganization, initialResource }: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
  initialOrganization?: PublicMapOrganization
  initialResource?: ExternalResourceMapItem
}) {
  return (
    <HomeCanvasFindShell searchDockBelowCanvas glassHeader showPublicSearch={false} className="[html.light_&]:[--shell-bg:var(--muted)]" canvasClassName="[contain:layout]">
      <section data-public-home-scroll="" data-public-home-flat-surfaces="" aria-label="Resources"
        className="relative isolate h-full min-h-0 w-full min-w-0 flex-1 scroll-pt-1 overflow-x-hidden overflow-y-auto p-3 pt-1 pb-4 [clip-path:inset(0)] sm:p-4 sm:pt-1 sm:pb-4">
        <Suspense fallback={<PublicMapHomeLoading />}>
          <PublicFindRoute embedded searchParams={searchParams} initialOrganization={initialOrganization} initialResource={initialResource} />
        </Suspense>
      </section>
    </HomeCanvasFindShell>
  )
}
