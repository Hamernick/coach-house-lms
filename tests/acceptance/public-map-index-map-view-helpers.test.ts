import { describe, expect, it, vi } from "vitest"
import type mapboxgl from "mapbox-gl"

import {
  CHICAGO_FALLBACK_CENTER,
  CHICAGO_FALLBACK_ZOOM,
  focusChicagoFallback,
  PUBLIC_MAP_CAMERA_EDGE_PADDING,
  PUBLIC_MAP_SIDEBAR_MAX_WIDTH,
  PUBLIC_MAP_SIDEBAR_MIN_WIDTH,
  PUBLIC_MAP_SIDEBAR_MIN_VISIBLE_MAP_WIDTH,
  resolvePublicMapCameraPadding,
  resolvePublicMapSidebarWidth,
} from "@/components/public/public-map-index/map-view-helpers"

describe("focusChicagoFallback", () => {
  it("centers the map on Chicago when browser location is unavailable or denied", () => {
    const easeTo = vi.fn()
    const map = {
      easeTo,
    } as unknown as mapboxgl.Map

    focusChicagoFallback({
      map,
      duration: 450,
    })

    expect(easeTo).toHaveBeenCalledWith({
      center: CHICAGO_FALLBACK_CENTER,
      zoom: CHICAGO_FALLBACK_ZOOM,
      duration: 450,
    })
  })
})

describe("resolvePublicMapSidebarWidth", () => {
  it("returns zero when the sidebar is hidden", () => {
    expect(
      resolvePublicMapSidebarWidth({
        surfaceWidth: 1200,
        sidebarMode: "hidden",
      }),
    ).toBe(0)
  })

  it("caps width at desktop maximum when space is available", () => {
    expect(
      resolvePublicMapSidebarWidth({
        surfaceWidth: 1600,
        sidebarMode: "search",
      }),
    ).toBe(PUBLIC_MAP_SIDEBAR_MAX_WIDTH)
  })

  it("keeps the minimum sidebar width when there is still enough map area", () => {
    expect(
      resolvePublicMapSidebarWidth({
        surfaceWidth: 280,
        sidebarMode: "details",
      }),
    ).toBe(PUBLIC_MAP_SIDEBAR_MIN_WIDTH)
  })

  it("shrinks sidebar width below minimum to preserve map visibility on very narrow surfaces", () => {
    expect(
      resolvePublicMapSidebarWidth({
        surfaceWidth: 240,
        sidebarMode: "details",
      }),
    ).toBe(240 - PUBLIC_MAP_SIDEBAR_MIN_VISIBLE_MAP_WIDTH)
  })
})

describe("resolvePublicMapCameraPadding", () => {
  it("adds sidebar inset to left camera padding while keeping edge gutters", () => {
    expect(resolvePublicMapCameraPadding(320)).toEqual({
      top: PUBLIC_MAP_CAMERA_EDGE_PADDING,
      right: PUBLIC_MAP_CAMERA_EDGE_PADDING,
      bottom: PUBLIC_MAP_CAMERA_EDGE_PADDING,
      left: 320 + PUBLIC_MAP_CAMERA_EDGE_PADDING,
    })
  })

  it("falls back to symmetric edge padding with no sidebar inset", () => {
    expect(resolvePublicMapCameraPadding(0)).toEqual({
      top: PUBLIC_MAP_CAMERA_EDGE_PADDING,
      right: PUBLIC_MAP_CAMERA_EDGE_PADDING,
      bottom: PUBLIC_MAP_CAMERA_EDGE_PADDING,
      left: PUBLIC_MAP_CAMERA_EDGE_PADDING,
    })
  })
})
