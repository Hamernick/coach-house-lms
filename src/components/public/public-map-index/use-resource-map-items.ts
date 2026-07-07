"use client"

import { useEffect, useState } from "react"

import type { ExternalResourceMapItem } from "@/lib/public-map/resource-map-items"

export const EMPTY_PUBLIC_MAP_RESOURCE_ITEMS: ExternalResourceMapItem[] = []

const resourceItemsLoadByEndpoint = new Map<
  string,
  Promise<ExternalResourceMapItem[]>
>()

function loadPublicMapResourceItems(endpoint: string) {
  const cached = resourceItemsLoadByEndpoint.get(endpoint)
  if (cached) return cached

  const load = fetch(endpoint, {
    cache: "force-cache",
    headers: { Accept: "application/json" },
  })
    .then(async (response) => {
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
    .catch((error) => {
      resourceItemsLoadByEndpoint.delete(endpoint)
      throw error
    })

  resourceItemsLoadByEndpoint.set(endpoint, load)
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

    return () => {
      cancelled = true
    }
  }, [resourceItemsEndpoint])

  return resourceItems
}
