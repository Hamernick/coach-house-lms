import { describe, expect, it, vi } from "vitest"
import type mapboxgl from "mapbox-gl"

import {
  resolveMarkerOverlapBuckets,
} from "@/components/public/public-map-index/marker-overlap-buckets"

function buildMap() {
  return {
    project: vi.fn(([longitude, latitude]: [number, number]) => ({
      x: longitude * 1_000,
      y: latitude * 1_000,
    })),
    unproject: vi.fn(([x, y]: [number, number]) => ({
      lng: x / 1_000,
      lat: y / 1_000,
    })),
  } as unknown as mapboxgl.Map
}

describe("resolveMarkerOverlapBuckets", () => {
  it("groups near-identical points using screen-space overlap instead of exact coordinates", () => {
    const map = buildMap()
    const buckets = resolveMarkerOverlapBuckets({
      map,
      items: [
        { id: "org-a", coordinates: [0, 0] as [number, number] },
        { id: "org-b", coordinates: [0.009, 0] as [number, number] },
        { id: "org-c", coordinates: [0.04, 0] as [number, number] },
      ],
      getKey: (item) => item.id,
      getCoordinates: (item) => item.coordinates,
    })

    expect(buckets).toHaveLength(2)
    expect(buckets[0]?.members.map((member) => member.key)).toEqual(["org-a", "org-b"])
    expect(buckets[1]?.members.map((member) => member.key)).toEqual(["org-c"])
  })

  it("keeps overlap grouping transitive and member ordering deterministic", () => {
    const map = buildMap()
    const buckets = resolveMarkerOverlapBuckets({
      map,
      items: [
        { id: "org-c", coordinates: [0.024, 0] as [number, number] },
        { id: "org-a", coordinates: [0, 0] as [number, number] },
        { id: "org-b", coordinates: [0.012, 0] as [number, number] },
      ],
      getKey: (item) => item.id,
      getCoordinates: (item) => item.coordinates,
      thresholdPx: 13,
    })

    expect(buckets).toHaveLength(1)
    expect(buckets[0]?.members.map((member) => member.key)).toEqual([
      "org-a",
      "org-b",
      "org-c",
    ])
  })
})
