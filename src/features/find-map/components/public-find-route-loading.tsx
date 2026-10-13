import { HomeCanvasFindShell } from "@/components/public/home-canvas-find-shell"

import {
  FindMapLoadingSidebar,
  FindMapLoadingState,
} from "./find-map-loading-state"

export function PublicFindRouteLoading() {
  return (
    <HomeCanvasFindShell
      showAuthActions={false}
      sidebarFallback={<FindMapLoadingSidebar />}
    >
      <FindMapLoadingState />
    </HomeCanvasFindShell>
  )
}
