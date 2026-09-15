"use client"

import dynamic from "next/dynamic"

// Keep a cold detail import inside the panel instead of suspending the Find shell.
const detailPanelLoading = () => null

export const PublicMapDrawerDetailPanel = dynamic(
  () =>
    import("./sidebar-detail-panels").then(
      (module) => module.PublicMapDrawerDetailPanel
    ),
  { loading: detailPanelLoading }
)

export const PublicMapRailDetailPanel = dynamic(
  () =>
    import("./sidebar-detail-panels").then(
      (module) => module.PublicMapRailDetailPanel
    ),
  { loading: detailPanelLoading }
)

export const PublicMapResourceDrawerDetailPanel = dynamic(
  () =>
    import("./sidebar-detail-panels").then(
      (module) => module.PublicMapResourceDrawerDetailPanel
    ),
  { loading: detailPanelLoading }
)

export const PublicMapResourceRailDetailPanel = dynamic(
  () =>
    import("./sidebar-detail-panels").then(
      (module) => module.PublicMapResourceRailDetailPanel
    ),
  { loading: detailPanelLoading }
)
