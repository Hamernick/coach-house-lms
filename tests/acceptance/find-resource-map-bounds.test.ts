import { describe, expect, it } from "vitest"
import { resourceMapScreenBounds, serializeResourceMapBounds, resolveResourceMapQueryBounds } from "@/features/find-resource-index/lib/map-bounds"
import { parseFindResourceCatalogQuery, resourceIndexItemInBounds } from "@/features/find-resource-index/lib/catalog-query"
import type { FindResourceIndexItem } from "@/features/find-resource-index/types"

describe("resource map viewport queries", () => {
  it("contains all four geographic corners after rotation, including reversed diagonals", () => {
    const screen = { left: 100, top: 200, right: 300, bottom: 400 }
    const project = ([x, y]: [number, number]) => ({ lng: -88 + (x + y) / 1000, lat: 42 + (x - y) / 1000 })
    const edges = resourceMapScreenBounds(screen, { left: 100, top: 200 }, project)
    const bounds = parseFindResourceCatalogQuery(new URLSearchParams(`mode=map&bounds=${serializeResourceMapBounds(edges)}`))!.bounds!
    for (const point of [[0, 0], [200, 0], [200, 200], [0, 200]] as [number, number][]) {
      const { lng, lat } = project(point)
      expect(resourceIndexItemInBounds({ latitude: lat, longitude: lng } as FindResourceIndexItem, bounds)).toBe(true)
    }
  })
  it("uses projection-aware bounds for the globe rather than excluding visible northern places", () => {
    const viewport = [-180, -50, 180, 90]
    const corners = () => [-100, -7.244, 80, 35.973]
    const query = resolveResourceMapQueryBounds("globe", viewport, corners)
    const bounds = parseFindResourceCatalogQuery(new URLSearchParams(`mode=map&bounds=${query}`))!.bounds!
    expect(resourceIndexItemInBounds({ latitude: 41.879, longitude: -87.725 } as FindResourceIndexItem, bounds)).toBe(true)
    expect(resolveResourceMapQueryBounds("mercator", viewport, corners)).toBe("-100.000,-7.244,80.000,35.973")
  })
  it("rounds outward and preserves antimeridian and whole-world bounds", () => {
    expect(serializeResourceMapBounds([-87.1239, 41.1231, -87.1001, 41.9991])).toBe("-87.124,41.123,-87.100,42.000")
    expect(serializeResourceMapBounds([179, -10, 181, 10])).toBe("179.000,-10.000,-179.000,10.000")
    expect(serializeResourceMapBounds([-200, -95, 200, 95])).toBe("-180.000,-90.000,180.000,90.000")
    expect(serializeResourceMapBounds([NaN, 0, 1, 2])).toBeNull()
  })
})
