import { describe, expect, it } from "vitest"

import { resolvePublicMapSurfacePanelState } from "@/components/public/public-map-index/map-surface-helpers"

describe("resolvePublicMapSurfacePanelState", () => {
  it("keeps the panel hidden until the surface width is measured", () => {
    expect(
      resolvePublicMapSurfacePanelState({
        surfaceWidth: 0,
        surfaceHeight: 540,
        sidebarMode: "search",
        portalContainerReady: false,
      })
    ).toEqual({
      panelPresentation: null,
      panelReady: false,
      sidebarWidth: 0,
    })
  })

  it("keeps drawer mode hidden until the in-canvas portal is ready", () => {
    expect(
      resolvePublicMapSurfacePanelState({
        surfaceWidth: 620,
        surfaceHeight: 540,
        sidebarMode: "search",
        portalContainerReady: false,
      })
    ).toEqual({
      panelPresentation: "drawer",
      panelReady: false,
      sidebarWidth: 0,
    })
  })

  it("allows drawer mode once the in-canvas portal is ready", () => {
    expect(
      resolvePublicMapSurfacePanelState({
        surfaceWidth: 620,
        surfaceHeight: 540,
        sidebarMode: "search",
        portalContainerReady: true,
      })
    ).toEqual({
      panelPresentation: "drawer",
      panelReady: true,
      sidebarWidth: 0,
    })
  })

  it("keeps wide surfaces on the drawer and waits for its portal", () => {
    const state = resolvePublicMapSurfacePanelState({
      surfaceWidth: 900,
      surfaceHeight: 540,
      sidebarMode: "search",
      portalContainerReady: false,
    })

    expect(state.panelPresentation).toBe("drawer")
    expect(state.panelReady).toBe(false)
    expect(state.sidebarWidth).toBe(0)
  })

  it("keeps the panel hidden until the surface height is measured", () => {
    expect(
      resolvePublicMapSurfacePanelState({
        surfaceWidth: 620,
        surfaceHeight: 0,
        sidebarMode: "search",
        portalContainerReady: true,
      })
    ).toEqual({
      panelPresentation: null,
      panelReady: false,
      sidebarWidth: 0,
    })
  })
})
