import { describe, expect, it, vi } from "vitest"

import { buildOverlayItems } from "@/components/public/public-map-index/public-map-marker-overlay-model"

describe("public map marker overlay model", () => {
  it("returns no overlay items when the cluster layer is not in the current style", () => {
    const queryRenderedFeatures = vi.fn()
    const map = {
      getSource: vi.fn().mockReturnValue(undefined),
      getLayer: vi.fn().mockReturnValue(undefined),
      queryRenderedFeatures,
    } as unknown as Parameters<typeof buildOverlayItems>[0]["map"]

    const items = buildOverlayItems({
      map,
      organizationById: new Map(),
      selectedOrganizationId: null,
      activeSameLocationGroupKey: null,
    })

    expect(items).toEqual([])
    expect(queryRenderedFeatures).not.toHaveBeenCalled()
  })

  it("returns no overlay items when Mapbox rejects a cluster query during a style transition", () => {
    const map = {
      getSource: vi.fn().mockReturnValue({}),
      getLayer: vi.fn().mockReturnValue({ id: "public-map-organizations-cluster" }),
      querySourceFeatures: vi.fn().mockReturnValue([]),
      queryRenderedFeatures: vi
        .fn()
        .mockImplementation(() => {
          throw new Error(
            "The layer 'public-map-organizations-cluster' does not exist in the map's style and cannot be queried for features.",
          )
        }),
    } as unknown as Parameters<typeof buildOverlayItems>[0]["map"]

    const items = buildOverlayItems({
      map,
      organizationById: new Map(),
      selectedOrganizationId: null,
      activeSameLocationGroupKey: null,
    })

    expect(items).toEqual([])
  })
})
