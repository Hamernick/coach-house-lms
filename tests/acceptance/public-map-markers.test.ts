import { describe, expect, it } from "vitest"

import { buildPublicMapMarkerReactGrabMetadata } from "@/components/public/public-map-index/map-markers"

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
})
