import type { SidebarMode } from "./constants"
import {
  resolvePublicMapPanelPresentation,
  resolvePublicMapSidebarWidth,
  type PublicMapPanelPresentation,
} from "./map-view-helpers"

export function resolvePublicMapSurfacePanelState({
  surfaceWidth,
  surfaceHeight,
  sidebarMode,
  portalContainerReady,
}: {
  surfaceWidth: number
  surfaceHeight: number
  sidebarMode: SidebarMode
  portalContainerReady: boolean
}): {
  panelPresentation: PublicMapPanelPresentation | null
  panelReady: boolean
  sidebarWidth: number
} {
  if (
    !Number.isFinite(surfaceWidth) ||
    surfaceWidth <= 0 ||
    !Number.isFinite(surfaceHeight) ||
    surfaceHeight <= 0
  ) {
    return {
      panelPresentation: null,
      panelReady: false,
      sidebarWidth: 0,
    }
  }

  const panelPresentation = resolvePublicMapPanelPresentation(surfaceWidth)
  const panelReady =
    panelPresentation === "drawer" ? portalContainerReady : true

  return {
    panelPresentation,
    panelReady,
    sidebarWidth:
      panelReady && panelPresentation === "rail"
        ? resolvePublicMapSidebarWidth({ surfaceWidth, sidebarMode })
        : 0,
  }
}
