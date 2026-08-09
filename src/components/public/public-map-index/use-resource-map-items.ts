"use client"

import { useCallback, useEffect, useState } from "react"

import type { ExternalResourceMapItem } from "@/lib/public-map/resource-map-items"
import { warmPublicMapListItemSearchCache } from "./map-items-state"

export const EMPTY_PUBLIC_MAP_RESOURCE_ITEMS: ExternalResourceMapItem[] = []
export const PUBLIC_MAP_RESOURCE_ITEMS_REFRESH_INTERVAL_MS = 5 * 60 * 1000
export type PublicMapResourceItemsLoadStatus = "loading" | "ready" | "error"

const resourceItemsLoadByEndpoint = new Map<
  string,
  Promise<ExternalResourceMapItem[]>
>()

export function clearPublicMapResourceItemsCache(endpoint?: string) {
  if (endpoint) {
    resourceItemsLoadByEndpoint.delete(endpoint)
    return
  }

  resourceItemsLoadByEndpoint.clear()
}

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
    const resourceItems = Array.isArray(payload.resourceItems)
      ? (payload.resourceItems as ExternalResourceMapItem[])
      : EMPTY_PUBLIC_MAP_RESOURCE_ITEMS
    warmPublicMapListItemSearchCache(resourceItems)
    return resourceItems
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
  const [status, setStatus] = useState<PublicMapResourceItemsLoadStatus>(
    resourceItemsEndpoint ? "loading" : "ready"
  )
  const [error, setError] = useState<string | null>(null)
  const [loadRequestId, setLoadRequestId] = useState(0)

  useEffect(() => {
    if (resourceItemsEndpoint) return
    setResourceItems(initialResourceItems)
    setStatus("ready")
    setError(null)
  }, [initialResourceItems, resourceItemsEndpoint])

  useEffect(() => {
    if (!resourceItemsEndpoint) return

    const endpoint = resourceItemsEndpoint
    let cancelled = false

    async function loadResourceItems() {
      setStatus("loading")
      setError(null)
      try {
        const payload = await loadPublicMapResourceItems(endpoint)
        if (cancelled) return
        setResourceItems(payload)
        setStatus("ready")
      } catch (error) {
        if (cancelled) return
        setStatus("error")
        setError("The full resource directory could not load.")
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
  }, [loadRequestId, resourceItemsEndpoint])

  const retry = useCallback(() => {
    if (!resourceItemsEndpoint) return
    clearPublicMapResourceItemsCache(resourceItemsEndpoint)
    setLoadRequestId((current) => current + 1)
  }, [resourceItemsEndpoint])

  return { error, resourceItems, retry, status }
}
