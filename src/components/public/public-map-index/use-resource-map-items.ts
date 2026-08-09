"use client"

import { useCallback, useEffect, useState } from "react"

import type { ExternalResourceMapItem } from "@/lib/public-map/resource-map-items"
import { warmPublicMapListItemSearchCache } from "./map-items-state"

export const EMPTY_PUBLIC_MAP_RESOURCE_ITEMS: ExternalResourceMapItem[] = []

export type PublicMapResourceItemsLoadStatus = "loading" | "ready" | "error"

const pendingResourceItemsLoadByEndpoint = new Map<
  string,
  Promise<ExternalResourceMapItem[]>
>()
const resolvedResourceItemsByEndpoint = new Map<
  string,
  ExternalResourceMapItem[]
>()

export function clearPublicMapResourceItemsCache(endpoint?: string) {
  if (endpoint) {
    pendingResourceItemsLoadByEndpoint.delete(endpoint)
    resolvedResourceItemsByEndpoint.delete(endpoint)
    return
  }

  pendingResourceItemsLoadByEndpoint.clear()
  resolvedResourceItemsByEndpoint.clear()
}

export function loadPublicMapResourceItems(endpoint: string) {
  const resolved = resolvedResourceItemsByEndpoint.get(endpoint)
  if (resolved) return Promise.resolve(resolved)

  const pending = pendingResourceItemsLoadByEndpoint.get(endpoint)
  if (pending) return pending

  const load = fetch(endpoint, {
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
    resolvedResourceItemsByEndpoint.set(endpoint, resourceItems)
    return resourceItems
  })

  const clearPendingLoad = () => {
    if (pendingResourceItemsLoadByEndpoint.get(endpoint) === load) {
      pendingResourceItemsLoadByEndpoint.delete(endpoint)
    }
  }

  pendingResourceItemsLoadByEndpoint.set(endpoint, load)
  void load.then(clearPendingLoad, clearPendingLoad)
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

    return () => {
      cancelled = true
    }
  }, [loadRequestId, resourceItemsEndpoint])

  const retry = useCallback(() => {
    if (!resourceItemsEndpoint) return
    clearPublicMapResourceItemsCache(resourceItemsEndpoint)
    setLoadRequestId((current) => current + 1)
  }, [resourceItemsEndpoint])

  return { error, resourceItems, retry, status }
}
