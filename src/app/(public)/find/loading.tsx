import { HomeCanvasFindShell } from "@/components/public/home-canvas-find-shell"
import { FindMapLoadingState } from "@/features/find-map"

export default function PublicFindLoading() {
  return (
    <HomeCanvasFindShell showAuthActions={false}>
      <FindMapLoadingState />
    </HomeCanvasFindShell>
  )
}
