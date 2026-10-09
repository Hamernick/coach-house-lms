"use client"

import dynamic from "next/dynamic"

// Keep first-open code loading inside the panel. Suspending the entire Find
// shell tears down layout refs whose state updates can repeatedly retry it.
function PublicMapDetailLoading() {
  return (
    <p role="status" className="text-muted-foreground px-4 py-6 text-sm">
      Loading details…
    </p>
  )
}

export const PublicMapDrawerDetailPanel = dynamic(
  () =>
    import("./sidebar-detail-panels").then(
      (module) => module.PublicMapDrawerDetailPanel
    ),
  { loading: PublicMapDetailLoading }
)
export const PublicMapRailDetailPanel = dynamic(
  () =>
    import("./sidebar-detail-panels").then(
      (module) => module.PublicMapRailDetailPanel
    ),
  { loading: PublicMapDetailLoading }
)
export const PublicMapResourceDrawerDetailPanel = dynamic(
  () =>
    import("./sidebar-detail-panels").then(
      (module) => module.PublicMapResourceDrawerDetailPanel
    ),
  { loading: PublicMapDetailLoading }
)
export const PublicMapResourceRailDetailPanel = dynamic(
  () =>
    import("./sidebar-detail-panels").then(
      (module) => module.PublicMapResourceRailDetailPanel
    ),
  { loading: PublicMapDetailLoading }
)

