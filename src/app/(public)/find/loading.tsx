import { HomeCanvasFindShell } from "@/components/public/home-canvas-find-shell"
import { readAppSidebarDefaultOpen } from "@/components/app-shell/sidebar-state-server"
import { resolveDashboardLayoutState } from "@/app/(dashboard)/_lib/dashboard-layout-state"
import {
  AuthenticatedFindShell,
  fetchPublicMapViewerState,
  FindMapLoadingState,
} from "@/features/find-map"

export default async function PublicFindLoading() {
  const viewerState = await fetchPublicMapViewerState()
  if (viewerState.viewer) {
    const [shellState, defaultSidebarOpen] = await Promise.all([
      resolveDashboardLayoutState(),
      readAppSidebarDefaultOpen(),
    ])
    if (shellState.userPresent) {
      return (
        <AuthenticatedFindShell
          state={shellState}
          defaultSidebarOpen={defaultSidebarOpen}
        >
          <FindMapLoadingState />
        </AuthenticatedFindShell>
      )
    }
  }

  return (
    <HomeCanvasFindShell showAuthActions={false}>
      <FindMapLoadingState />
    </HomeCanvasFindShell>
  )
}
