"use client"

import { useEffect, useState } from "react"

import type { ExternalResourceMapItem } from "@/lib/public-map/resource-map-items"

export const EMPTY_PUBLIC_MAP_RESOURCE_ITEMS: ExternalResourceMapItem[] = []
export const PUBLIC_MAP_RESOURCE_ITEMS_REFRESH_INTERVAL_MS = 5 * 60 * 1000

const resourceItemsLoadByEndpoint = new Map<
  string,
  Promise<ExternalResourceMapItem[]>
>()

export function loadPublicMapResourceItems(endpoint: string) {
  const cached = resourceItemsLoadByEndpoint.get(endpoint)
  if (cached) return cached

  const load = fetch(endpoint, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error(`Resource map items failed: ${response.status}`)
    }

    const payload = (await response.json()) as {
      resourceItems?: unknown
    }
    return Array.isArray(payload.resourceItems)
      ? (payload.resourceItems as ExternalResourceMapItem[])
      : EMPTY_PUBLIC_MAP_RESOURCE_ITEMS
  })

  resourceItemsLoadByEndpoint.set(endpoint, load)
  const clearSettledLoad = () => {
    if (resourceItemsLoadByEndpoint.get(endpoint) === load) {
      resourceItemsLoadByEndpoint.delete(endpoint)
    }
  }
  void load.then(clearSettledLoad, clearSettledLoad)
  return load
}

export function usePublicMapResourceItems({
  initialResourceItems = EMPTY_PUBLIC_MAP_RESOURCE_ITEMS,
  resourceItemsEndpoint,
}: {
  initialResourceItems?: ExternalResourceMapItem[]
  resourceItemsEndpoint?: string
}) {
  const [resourceItems, setResourceItems] = useState(initialResourceItems)

  useEffect(() => {
    if (resourceItemsEndpoint) return
    setResourceItems(initialResourceItems)
  }, [initialResourceItems, resourceItemsEndpoint])

  useEffect(() => {
    if (!resourceItemsEndpoint) return

    const endpoint = resourceItemsEndpoint
    let cancelled = false

    async function loadResourceItems() {
      try {
        const payload = await loadPublicMapResourceItems(endpoint)
        if (cancelled) return
        setResourceItems(payload)
      } catch (error) {
        if (cancelled) return
        console.warn("[public-map] resource items unavailable", {
          message: error instanceof Error ? error.message : String(error),
        })
      }
    }

    void loadResourceItems()
    const refreshVisibleResourceItems = () => {
      if (document.visibilityState === "hidden") return
      void loadResourceItems()
    }
    const refreshInterval = window.setInterval(
      refreshVisibleResourceItems,
      PUBLIC_MAP_RESOURCE_ITEMS_REFRESH_INTERVAL_MS
    )
    window.addEventListener("focus", refreshVisibleResourceItems)
    document.addEventListener("visibilitychange", refreshVisibleResourceItems)

    return () => {
      cancelled = true
      window.clearInterval(refreshInterval)
      window.removeEventListener("focus", refreshVisibleResourceItems)
      document.removeEventListener(
        "visibilitychange",
        refreshVisibleResourceItems
      )
    }
  }, [resourceItemsEndpoint])

  return resourceItems
}
