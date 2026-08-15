import { readFileSync } from "node:fs"
import { join } from "node:path"

import { afterEach, describe, expect, it, vi } from "vitest"

import {
  clearPublicMapResourceItemsCache,
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
    clearPublicMapResourceItemsCache()
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
    const reportedTotalCounts: Array<number | null> = []
    const items = await loadPublicMapResourceItems(
      "/api/public/resource-map/index?limit=50",
      (loadedItems, totalCount) => {
        progressCounts.push(loadedItems.length)
        reportedTotalCounts.push(totalCount)
      }
    )

    expect(items).toHaveLength(2)
    expect(progressCounts).toEqual([1, 2])
    expect(reportedTotalCounts).toEqual([null, null])
    expect(items[0]).toMatchObject({
      id: compactItem.id,
      address: "Chicago, IL, United States",
      description: null,
      orgCategory: null,
      sourceUrl: null,
    })
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      `/api/public/resource-map/index?limit=50&cursor=${encodeURIComponent(compactItem.id)}`,
      {
        cache: "no-store",
        headers: { Accept: "application/json" },
      }
    )
  })

  it("publishes the first compact page immediately and batches later progress", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch")
    for (let index = 1; index <= 5; index += 1) {
      fetchSpy.mockResolvedValueOnce(
        buildJsonResponse({
          resourceItems: [{ id: `resource_map:${index}` }],
          page: {
            hasMore: index < 5,
            nextCursor: index < 5 ? `resource_map:${index}` : null,
          },
        })
      )
    }

    const progressCounts: number[] = []
    const items = await loadPublicMapResourceItems(
      "/api/public/resource-map/index?limit=50&test=batched-progress",
      (loadedItems) => progressCounts.push(loadedItems.length)
    )

    expect(items).toHaveLength(5)
    expect(progressCounts).toEqual([1, 5])
  })

  it("avoids repeated renders while draining the production-sized catalog", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch")
    const totalPages = 18
    const pageSize = 50

    for (let page = 0; page < totalPages; page += 1) {
      const isFinalPage = page === totalPages - 1
      const itemCount = isFinalPage ? 6 : pageSize
      const resourceItems = Array.from({ length: itemCount }, (_, index) => ({
        id: `resource_map:${page * pageSize + index}`,
      }))
      fetchSpy.mockResolvedValueOnce(
        buildJsonResponse({
          resourceItems,
          page: {
            hasMore: !isFinalPage,
            nextCursor: isFinalPage
              ? null
              : resourceItems[resourceItems.length - 1]?.id,
            totalCount: 856 - page * pageSize,
          },
        })
      )
    }

    const progressCounts: number[] = []
    const reportedTotalCounts: Array<number | null> = []
    const items = await loadPublicMapResourceItems(
      "/api/public/resource-map/index?limit=50&test=bounded-progress",
      (loadedItems, totalCount) => {
        progressCounts.push(loadedItems.length)
        reportedTotalCounts.push(totalCount)
      }
    )

    expect(items).toHaveLength(856)
    expect(progressCounts).toEqual([50, 856])
    expect(reportedTotalCounts).toEqual([856, 856])
  })

  it("keeps the map inventory total separate from progressive item pages", () => {
    const indexSource = readFileSync(
      join(process.cwd(), "src/components/public/public-map-index.tsx"),
      "utf8"
    )
    const surfaceSource = readFileSync(
      join(
        process.cwd(),
        "src/components/public/public-map-index/map-surface.tsx"
      ),
      "utf8"
    )
    const filterStateSource = readFileSync(
      join(
        process.cwd(),
        "src/components/public/public-map-index/public-map-index-filter-state.ts"
      ),
      "utf8"
    )

    expect(indexSource).toContain("directoryCount={directoryCount}")
    expect(indexSource).toContain("filteredItems={directoryListItems}")
    expect(surfaceSource).toContain("directoryCount={directoryCount}")
    expect(surfaceSource).not.toContain("directoryCount={filteredItems.length}")
    expect(filterStateSource).toContain(
      "organizations.length + totalResourceCount"
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
    expect(source).toContain('window.addEventListener("offline"')
    expect(source).toContain('window.addEventListener("online"')
    expect(source).toContain('document.addEventListener("visibilitychange"')
    expect(source).toContain("PUBLIC_MAP_RESOURCE_ITEMS_REFRESH_INTERVAL_MS")
    expect(source).not.toContain('cache: "force-cache"')
  })
})
