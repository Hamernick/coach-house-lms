import { readFileSync } from "node:fs"
import { join } from "node:path"

import { afterEach, describe, expect, it, vi } from "vitest"

import { loadPublicMapResourceItems } from "@/components/public/public-map-index/use-resource-map-items"

function buildResourceItemsResponse(resourceItems: unknown[]) {
  return {
    json: vi.fn(async () => ({ resourceItems })),
    ok: true,
  } as unknown as Response
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
