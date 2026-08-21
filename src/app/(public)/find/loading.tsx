import { HomeCanvasFindShell } from "@/components/public/home-canvas-find-shell"
import { FindMapLoadingSidebar, FindMapLoadingState } from "@/features/find-map"

export default function PublicFindLoading() {
  return (
    <HomeCanvasFindShell
      showAuthActions={false}
      sidebarFallback={<FindMapLoadingSidebar />}
    >
      <FindMapLoadingState />
    </HomeCanvasFindShell>
  )
}
