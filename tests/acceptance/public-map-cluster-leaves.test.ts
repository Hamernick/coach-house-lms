import { describe, expect, it, vi } from "vitest"
import type mapboxgl from "mapbox-gl"

import { fetchAllClusterLeaves } from "@/components/public/public-map-index/cluster-leaf-helpers"

function buildLeaf(index: number) {
  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [-87.63 + index * 0.00001, 41.88 + index * 0.00001],
    },
    properties: {
      organizationId: `org-${index}`,
      name: `Org ${index}`,
    },
  } as unknown as mapboxgl.MapboxGeoJSONFeature
}

describe("fetchAllClusterLeaves", () => {
  it("pages through getClusterLeaves until all expected leaves are loaded", async () => {
    const sourceLeaves = Array.from({ length: 235 }, (_, index) => buildLeaf(index))
    const getClusterLeaves = vi.fn(
      (
        _clusterId: number,
        limit: number,
        offset: number,
        callback: (error: Error | null, leaves: mapboxgl.MapboxGeoJSONFeature[]) => void,
      ) => {
        callback(null, sourceLeaves.slice(offset, offset + limit))
      },
    )
    const source = {
      getClusterLeaves,
    } as unknown as mapboxgl.GeoJSONSource

    const leaves = await fetchAllClusterLeaves({
      source,
      clusterId: 77,
      pointCount: sourceLeaves.length,
      pageSize: 100,
    })

    expect(leaves).toHaveLength(sourceLeaves.length)
    expect(getClusterLeaves).toHaveBeenCalledTimes(3)
    expect(leaves[0]?.properties?.organizationId).toBe("org-0")
    expect(leaves.at(-1)?.properties?.organizationId).toBe("org-234")
  })
})
