"use client"

import { useCallback, useEffect, useState } from "react"

import type { FindResourceIndexItem } from "@/features/find-resource-index"
import type { ExternalResourceMapItem } from "@/lib/public-map/resource-map-items"
import { warmPublicMapListItemSearchCache } from "./map-items-state"

export const EMPTY_PUBLIC_MAP_RESOURCE_ITEMS: ExternalResourceMapItem[] = []
export const PUBLIC_MAP_RESOURCE_ITEMS_REFRESH_INTERVAL_MS = 5 * 60 * 1000
export type PublicMapResourceItemsLoadStatus = "loading" | "ready" | "error"

type ResourceItemsLoad = {
  listeners: Set<(items: ExternalResourceMapItem[]) => void>
  promise: Promise<ExternalResourceMapItem[]>
}

const resourceItemsLoadByEndpoint = new Map<string, ResourceItemsLoad>()

type FindResourceIndexPage = {
  hasMore?: unknown
  nextCursor?: unknown
}

function isFindResourceIndexItem(
  value: unknown
): value is FindResourceIndexItem {
  return Boolean(
    value &&
    typeof value === "object" &&
    (value as { itemType?: unknown }).itemType === "external_resource" &&
    typeof (value as { id?: unknown }).id === "string" &&
    !("description" in value)
  )
}

function hydrateFindResourceIndexItem(
  item: FindResourceIndexItem
): ExternalResourceMapItem {
  const address = [item.city, item.state, item.country]
    .filter(Boolean)
    .join(", ")

  return {
    ...item,
    description: null,
    address: address || null,
    addressStreet: null,
    orgCategory: null,
    sourceLabel: null,
    sourceUrl: null,
    lastVerifiedAt: null,
    availability: item.availability
      ? {
          ...item.availability,
          nextOpenAt: null,
          nextCloseAt: null,
          timezone: null,
          label: null,
          notes: null,
          appointmentRequired: false,
          sourceStatus: null,
          temporaryClosedUntil: null,
        }
      : undefined,
  }
}

function normalizeLoadedResourceItem(value: unknown) {
  return isFindResourceIndexItem(value)
    ? hydrateFindResourceIndexItem(value)
    : (value as ExternalResourceMapItem)
}

function appendResourceCursor(endpoint: string, cursor: string) {
  const separator = endpoint.includes("?") ? "&" : "?"
  return `${endpoint}${separator}cursor=${encodeURIComponent(cursor)}`
}

export function mergeProgressiveResourceItems(
  currentItems: ExternalResourceMapItem[],
  loadedItems: ExternalResourceMapItem[]
) {
  const mergedItems = new Map(
    loadedItems.map((item) => [item.id, item] as const)
  )
  for (const item of currentItems) {
    if (!mergedItems.has(item.id)) mergedItems.set(item.id, item)
  }
  return [...mergedItems.values()]
}

export function clearPublicMapResourceItemsCache(endpoint?: string) {
  if (endpoint) {
    resourceItemsLoadByEndpoint.delete(endpoint)
    return
  }

  resourceItemsLoadByEndpoint.clear()
}

export function loadPublicMapResourceItems(
  endpoint: string,
  onProgress?: (items: ExternalResourceMapItem[]) => void
) {
  const cached = resourceItemsLoadByEndpoint.get(endpoint)
  if (cached) {
    if (onProgress) cached.listeners.add(onProgress)
    return cached.promise
  }

  const listeners = new Set<(items: ExternalResourceMapItem[]) => void>()
  if (onProgress) listeners.add(onProgress)

  const promise = (async () => {
    const resourceItems: ExternalResourceMapItem[] = []
    let pageEndpoint: string | null = endpoint
    let pageCount = 0

    while (pageEndpoint) {
      const response = await fetch(pageEndpoint, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      })
      if (!response.ok) {
        throw new Error(`Resource map items failed: ${response.status}`)
      }

      const payload = (await response.json()) as {
        resourceItems?: unknown
        page?: FindResourceIndexPage
      }
      if (Array.isArray(payload.resourceItems)) {
        resourceItems.push(
          ...payload.resourceItems.map(normalizeLoadedResourceItem)
        )
        for (const listener of listeners) listener([...resourceItems])
      }

      const nextCursor = payload.page?.nextCursor
      pageEndpoint =
        payload.page?.hasMore === true && typeof nextCursor === "string"
          ? appendResourceCursor(endpoint, nextCursor)
          : null
      pageCount += 1
      if (pageCount > 100) {
        throw new Error("Resource map items exceeded the page limit")
      }
    }

    warmPublicMapListItemSearchCache(resourceItems)
    return resourceItems
  })()

  const load = { listeners, promise }
  resourceItemsLoadByEndpoint.set(endpoint, load)
  const clearSettledLoad = () => {
    if (resourceItemsLoadByEndpoint.get(endpoint)?.promise === promise) {
      resourceItemsLoadByEndpoint.delete(endpoint)
    }
  }
  void promise.then(clearSettledLoad, clearSettledLoad)
  return promise
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
        const payload = await loadPublicMapResourceItems(endpoint, (items) => {
          if (!cancelled) {
            setResourceItems((currentItems) =>
              mergeProgressiveResourceItems(currentItems, items)
            )
          }
        })
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
