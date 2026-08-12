import { readFileSync } from "node:fs"
import { join } from "node:path"

import { afterEach, describe, expect, it, vi } from "vitest"

import {
  loadPublicMapResourceItems,
  mergeProgressiveResourceItems,
} from "@/components/public/public-map-index/use-resource-map-items"
import { loadPublicMapResourceItemDetail } from "@/components/public/public-map-index/use-resource-item-detail"
import type { ExternalResourceMapItem } from "@/lib/public-map/resource-map-items"

function buildJsonResponse(payload: unknown) {
  return {
    json: vi.fn(async () => payload),
    ok: true,
  } as unknown as Response
}

function buildResourceItemsResponse(resourceItems: unknown[]) {
  return buildJsonResponse({ resourceItems })
}

describe("public map resource items client", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("deduplicates only concurrent resource requests", async () => {
    let resolveFetch: ((response: Response) => void) | null = null
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve
        })
    )
    const endpoint = "/api/public/resource-map/items?test=concurrent"

    const firstLoad = loadPublicMapResourceItems(endpoint)
    const secondLoad = loadPublicMapResourceItems(endpoint)

    expect(secondLoad).toBe(firstLoad)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    resolveFetch?.(buildResourceItemsResponse([]))
    await expect(firstLoad).resolves.toEqual([])
  })

  it("refetches after an earlier empty response instead of retaining it", async () => {
    const currentItems = [{ id: "resource-map:library-1" }]
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(buildResourceItemsResponse([]))
      .mockResolvedValueOnce(buildResourceItemsResponse(currentItems))
    const endpoint = "/api/public/resource-map/items?test=revalidate"

    await expect(loadPublicMapResourceItems(endpoint)).resolves.toEqual([])
    await expect(loadPublicMapResourceItems(endpoint)).resolves.toEqual(
      currentItems
    )
    expect(fetchSpy).toHaveBeenCalledTimes(2)
    expect(fetchSpy).toHaveBeenLastCalledWith(endpoint, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    })
  })

  it("drains compact cursor pages and hydrates map-safe item defaults", async () => {
    const compactItem = {
      id: "resource_map:resource-a",
      itemType: "external_resource",
      title: "Food pantry",
      subtitle: "Community center",
      latitude: 41.88,
      longitude: -87.63,
      city: "Chicago",
      state: "IL",
      country: "United States",
      resourceCategories: ["food"],
      primaryResourceCategory: "food",
      verificationStatus: "external_data",
      visibility: "published",
    }
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        buildJsonResponse({
          resourceItems: [compactItem],
          page: { hasMore: true, nextCursor: compactItem.id },
        })
      )
      .mockResolvedValueOnce(
        buildJsonResponse({
          resourceItems: [{ ...compactItem, id: "resource_map:resource-b" }],
          page: { hasMore: false, nextCursor: null },
        })
      )

    const progressCounts: number[] = []
    const items = await loadPublicMapResourceItems(
      "/api/public/resource-map/index?limit=200",
      (loadedItems) => progressCounts.push(loadedItems.length)
    )

    expect(items).toHaveLength(2)
    expect(progressCounts).toEqual([1, 2])
    expect(items[0]).toMatchObject({
      id: compactItem.id,
      address: "Chicago, IL, United States",
      description: null,
      orgCategory: null,
      sourceUrl: null,
    })
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      `/api/public/resource-map/index?limit=200&cursor=${encodeURIComponent(compactItem.id)}`,
      {
        cache: "no-store",
        headers: { Accept: "application/json" },
      }
    )
  })

  it("deduplicates selected resource detail loads", async () => {
    const resourceItem = {
      id: "resource_map:detail-client-test",
      itemType: "external_resource",
      title: "Resource detail",
    }
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(buildJsonResponse({ resourceItem }))

    const firstLoad = loadPublicMapResourceItemDetail(resourceItem.id)
    const secondLoad = loadPublicMapResourceItemDetail(resourceItem.id)

    expect(secondLoad).toBe(firstLoad)
    await expect(firstLoad).resolves.toEqual(resourceItem)
    expect(fetchSpy).toHaveBeenCalledOnce()
    expect(fetchSpy).toHaveBeenCalledWith(
      `/api/public/resource-map/items/${encodeURIComponent(resourceItem.id)}`,
      {
        cache: "no-store",
        headers: { Accept: "application/json" },
      }
    )
  })

  it("preserves later-page selections during progressive refresh", () => {
    const firstPageItem = { id: "resource_map:first" }
    const selectedLaterItem = { id: "resource_map:selected" }

    expect(
      mergeProgressiveResourceItems(
        [selectedLaterItem as ExternalResourceMapItem],
        [firstPageItem as ExternalResourceMapItem]
      ).map(({ id }) => id)
    ).toEqual([firstPageItem.id, selectedLaterItem.id])
  })

  it("revalidates mounted resource lists when the tab becomes active", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "src/components/public/public-map-index/use-resource-map-items.ts"
      ),
      "utf8"
    )

    expect(source).toContain('window.addEventListener("focus"')
    expect(source).toContain('document.addEventListener("visibilitychange"')
    expect(source).toContain("PUBLIC_MAP_RESOURCE_ITEMS_REFRESH_INTERVAL_MS")
    expect(source).not.toContain('cache: "force-cache"')
  })
})
