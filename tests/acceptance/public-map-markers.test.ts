import { describe, expect, it } from "vitest"

import {
  buildPublicMapMarkerReactGrabMetadata,
  CLUSTER_GLYPH_SIZE,
  CLUSTER_PREVIEW_MAX_MEMBERS,
  PUBLIC_MAP_MARKER_PILL_STYLE,
  resolveClusterAvatarLayout,
} from "@/components/public/public-map-index/map-markers"

describe("public map markers", () => {
  it("builds explicit React Grab metadata for marker owners", () => {
    const metadata = buildPublicMapMarkerReactGrabMetadata("org-1")
    expect(metadata).toBeTruthy()
    expect(metadata?.["data-react-grab-owner-id"]).toBe("public-map-marker:org-1")
    expect(metadata?.["data-react-grab-link-id"]).toBe("public-map-marker:org-1")
    expect(metadata?.["data-react-grab-owner-component"]).toBe(
      "PublicMapOrganizationMarker",
    )
    expect(metadata?.["data-react-grab-surface-source"]).toBe(
      "src/components/public/public-map-index/map-markers.ts",
    )
    expect(metadata?.["data-react-grab-surface-kind"]).toBe("root")
  })

  it("builds bounded, varied cluster avatar layouts up to the configured preview cap", () => {
    const layout = resolveClusterAvatarLayout(99)
    expect(layout).toHaveLength(CLUSTER_PREVIEW_MAX_MEMBERS)
    expect(new Set(layout.map((entry) => entry.size)).size).toBeGreaterThan(1)

    layout.forEach((entry) => {
      expect(entry.size).toBeGreaterThan(0)
      expect(entry.left).toBeGreaterThanOrEqual(0)
      expect(entry.top).toBeGreaterThanOrEqual(0)
      expect(entry.left + entry.size).toBeLessThanOrEqual(CLUSTER_GLYPH_SIZE)
      expect(entry.top + entry.size).toBeLessThanOrEqual(CLUSTER_GLYPH_SIZE)
    })
  })

  it("keeps the shared marker pill style contract for marker labels and cluster count labels", () => {
    expect(PUBLIC_MAP_MARKER_PILL_STYLE.borderRadius).toBe("9999px")
    expect(PUBLIC_MAP_MARKER_PILL_STYLE.fontSize).toBe("11px")
    expect(PUBLIC_MAP_MARKER_PILL_STYLE.border).toBe("1px solid rgba(255, 255, 255, 0.28)")
    expect(PUBLIC_MAP_MARKER_PILL_STYLE.background).toBe("rgba(8, 15, 40, 0.84)")
  })
})
