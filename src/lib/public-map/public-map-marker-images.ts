import type mapboxgl from "mapbox-gl"

import type { PublicMapGroupKey } from "@/lib/public-map/groups"
import type { PublicMapResourceCategoryKey } from "@/lib/public-map/resource-categories"

import {
  PUBLIC_MAP_MARKER_IMAGE_FALLBACK_KEY,
  PUBLIC_MAP_MARKER_IMAGE_SELECTED_FALLBACK_KEY,
  type PublicMapFeatureCollection,
} from "./public-map-geojson"
import type { PublicMapMarkerStyleKey } from "./public-map-marker-styles"
import { PUBLIC_MAP_POINT_SHADOW_KEY } from "./public-map-marker-style"
import {
  createPublicMapFallbackMarkerImage,
  createPublicMapRemoteMarkerImage,
  PUBLIC_MAP_MARKER_IMAGE_PIXEL_RATIO,
} from "./public-map-marker-canvas"
import {
  getPublicMapMarkerImageBitmap,
  resetPublicMapMarkerBitmapCacheForTest,
} from "./public-map-marker-bitmap-cache"
import { ensurePublicMapBadgeImages } from "./public-map-marker-static-images"
import type { PublicMapTheme } from "./public-map-theme"

export { ensurePublicMapBadgeImages } from "./public-map-marker-static-images"
export { getPublicMapMarkerImageBitmap }
export type {
  PublicMapMarkerImageBitmapRequest,
  PublicMapMarkerImageBitmapResult,
} from "./public-map-marker-bitmap-cache"

const MARKER_IMAGE_CACHE_LIMIT = 240
const ADDED_IMAGE_CACHE_LIMIT = 360

type MarkerImageStatus = "loading" | "ready" | "failed"
export type PublicMapMarkerImageLoadResult = {
  key: string
  status: MarkerImageStatus | "cached"
  changed: boolean
}

const markerImageStatusByKey = new Map<string, MarkerImageStatus>()
const addedImageKeys = new Set<string>()
const fallbackMarkerImageByKey = new Map<string, ImageData>()
const FALLBACK_MARKER_IMAGE_CACHE_LIMIT = MARKER_IMAGE_CACHE_LIMIT * 2

export function resetPublicMapMarkerImageCachesForTest() {
  markerImageStatusByKey.clear()
  resetPublicMapMarkerBitmapCacheForTest()
  addedImageKeys.clear()
  fallbackMarkerImageByKey.clear()
}

function touchAddedImageKey(key: string) {
  if (addedImageKeys.has(key)) {
    addedImageKeys.delete(key)
  }
  addedImageKeys.add(key)

  while (addedImageKeys.size > ADDED_IMAGE_CACHE_LIMIT) {
    const oldest = addedImageKeys.values().next().value as string | undefined
    if (!oldest) return
    addedImageKeys.delete(oldest)
  }
}

function touchMarkerImageStatus(key: string, status: MarkerImageStatus) {
  if (markerImageStatusByKey.has(key)) {
    markerImageStatusByKey.delete(key)
  }
  markerImageStatusByKey.set(key, status)

  while (markerImageStatusByKey.size > MARKER_IMAGE_CACHE_LIMIT) {
    const oldest = markerImageStatusByKey.keys().next().value as
      | string
      | undefined
    if (!oldest) return
    markerImageStatusByKey.delete(oldest)
  }
}

function touchFallbackMarkerImage(key: string, image: ImageData) {
  if (fallbackMarkerImageByKey.has(key)) {
    fallbackMarkerImageByKey.delete(key)
  }
  fallbackMarkerImageByKey.set(key, image)

  while (fallbackMarkerImageByKey.size > FALLBACK_MARKER_IMAGE_CACHE_LIMIT) {
    const oldest = fallbackMarkerImageByKey.keys().next().value as
      | string
      | undefined
    if (!oldest) return
    fallbackMarkerImageByKey.delete(oldest)
  }
}

function mapHasImage(map: mapboxgl.Map, key: string) {
  return typeof map.hasImage === "function" && map.hasImage(key)
}

function mapHasMarkerImagePair(map: mapboxgl.Map, markerImageKey: string) {
  return (
    mapHasImage(map, markerImageKey) &&
    mapHasImage(map, `${markerImageKey}-selected`)
  )
}

function addImageSafely({
  map,
  key,
  image,
}: {
  map: mapboxgl.Map
  key: string
  image: ImageData
}) {
  try {
    if (mapHasImage(map, key)) return true
    map.addImage(key, image, {
      pixelRatio: PUBLIC_MAP_MARKER_IMAGE_PIXEL_RATIO,
    })
    touchAddedImageKey(key)
    return true
  } catch {
    return false
  }
}

function upsertImageSafely({
  map,
  key,
  image,
}: {
  map: mapboxgl.Map
  key: string
  image: ImageData
}) {
  try {
    if (mapHasImage(map, key)) {
      if (typeof map.updateImage !== "function") return false
      map.updateImage(key, image)
      touchAddedImageKey(key)
      return true
    }

    map.addImage(key, image, {
      pixelRatio: PUBLIC_MAP_MARKER_IMAGE_PIXEL_RATIO,
    })
    touchAddedImageKey(key)
    return true
  } catch {
    return false
  }
}

function ensurePublicMapFeatureFallbackMarkerImages({
  itemType,
  map,
  markerImageKey,
  markerImageUrl,
  markerAccentColor,
  markerStyleKey,
  name,
  primaryGroup,
  primaryResourceCategory,
  sameLocationCount,
  theme,
  verificationStatus,
}: {
  itemType?: string | null
  map: mapboxgl.Map
  markerImageKey: string
  markerImageUrl?: string | null
  markerAccentColor?: string | null
  markerStyleKey?: PublicMapMarkerStyleKey | null
  name: string
  primaryGroup?: PublicMapGroupKey | null
  primaryResourceCategory?: PublicMapResourceCategoryKey | null
  sameLocationCount?: number
  theme: PublicMapTheme
  verificationStatus?: string | null
}) {
  if (mapHasMarkerImagePair(map, markerImageKey)) return false

  let changed = false
  const suppressSelectedCheck = shouldSuppressSelectedFallbackCheck({
    imageUrl: markerImageUrl,
    itemType,
    verificationStatus,
  })
  const resourceCategory =
    itemType === "external_resource" ? primaryResourceCategory : null
  const image = getPublicMapFallbackMarkerImage({
    key: markerImageKey,
    label: name,
    markerAccentColor,
    markerStyleKey,
    primaryGroup,
    resourceCategory,
    sameLocationCount,
    selected: false,
    suppressSelectedCheck: false,
    theme,
    verificationStatus,
  })
  const selectedImage = getPublicMapFallbackMarkerImage({
    key: markerImageKey,
    label: name,
    markerAccentColor,
    markerStyleKey,
    primaryGroup,
    resourceCategory,
    sameLocationCount,
    selected: true,
    suppressSelectedCheck,
    theme,
    verificationStatus,
  })

  if (image && !mapHasImage(map, markerImageKey)) {
    changed = addImageSafely({ map, key: markerImageKey, image }) || changed
  }
  if (selectedImage && !mapHasImage(map, `${markerImageKey}-selected`)) {
    changed =
      addImageSafely({
        map,
        key: `${markerImageKey}-selected`,
        image: selectedImage,
      }) || changed
  }

  return changed
}

function getPublicMapFallbackMarkerImage({
  key,
  label,
  markerAccentColor,
  markerStyleKey,
  primaryGroup,
  resourceCategory,
  sameLocationCount,
  selected,
  suppressSelectedCheck = false,
  theme,
  verificationStatus,
}: {
  key: string
  label: string
  markerAccentColor?: string | null
  markerStyleKey?: PublicMapMarkerStyleKey | null
  primaryGroup?: PublicMapGroupKey | null
  resourceCategory?: PublicMapResourceCategoryKey | null
  sameLocationCount?: number
  selected: boolean
  suppressSelectedCheck?: boolean
  theme: PublicMapTheme
  verificationStatus?: string | null
}) {
  const count =
    typeof sameLocationCount === "number" && Number.isFinite(sameLocationCount)
      ? Math.max(0, Math.floor(sameLocationCount))
      : 0
  const cacheKey = [
    key,
    theme,
    selected ? "selected" : "normal",
    suppressSelectedCheck ? "selected-check:suppressed" : "selected-check:on",
    markerAccentColor ?? "group",
    markerStyleKey ?? "standard",
    resourceCategory ?? "no-icon",
    verificationStatus ?? "unknown",
    `count:${count}`,
  ].join(":")
  const cached = fallbackMarkerImageByKey.get(cacheKey)
  if (cached) return cached

  const image = createPublicMapFallbackMarkerImage({
    label,
    markerAccentColor,
    markerStyleKey,
    primaryGroup,
    resourceCategory,
    sameLocationCount: count,
    selected,
    suppressSelectedCheck,
    theme,
    verificationStatus,
  })
  if (!image) return null
  touchFallbackMarkerImage(cacheKey, image)
  return image
}

function shouldUpgradePublicMapMarkerImage({
  imageUrl,
  itemType,
  markerImageKey,
  verificationStatus,
}: {
  imageUrl?: string | null
  itemType?: string | null
  markerImageKey: string
  verificationStatus?: string | null
}) {
  if (markerImageStatusByKey.get(markerImageKey)) return false
  if (itemType !== "platform_organization") return false
  if (verificationStatus !== "verified_platform") return false
  return Boolean(imageUrl?.trim())
}

function shouldSuppressSelectedFallbackCheck({
  imageUrl,
  itemType,
  verificationStatus,
}: {
  imageUrl?: string | null
  itemType?: string | null
  verificationStatus?: string | null
}) {
  return (
    itemType === "platform_organization" &&
    verificationStatus === "verified_platform" &&
    Boolean(imageUrl?.trim())
  )
}

function createRemoteMarkerImageLoad({
  map,
  markerAccentColor,
  markerImageKey,
  markerImageUrl,
  name,
  onImagesChanged,
  primaryGroup,
  sameLocationCount,
  theme,
  verificationStatus,
}: {
  map: mapboxgl.Map
  markerAccentColor?: string | null
  markerImageKey: string
  markerImageUrl: string
  name: string
  onImagesChanged?: () => void
  primaryGroup?: PublicMapGroupKey | null
  sameLocationCount?: number
  theme: PublicMapTheme
  verificationStatus?: string | null
}): Promise<PublicMapMarkerImageLoadResult> {
  touchMarkerImageStatus(markerImageKey, "loading")

  return getPublicMapMarkerImageBitmap({
    imageKey: markerImageKey,
    imageUrl: markerImageUrl,
    fallbackLabel: name,
    markerAccentColor,
    primaryGroup,
  })
    .then((result) => {
      if (result.status !== "ready" || !result.bitmap) {
        touchMarkerImageStatus(markerImageKey, "failed")
        return {
          key: markerImageKey,
          status: "failed",
          changed: false,
        } satisfies PublicMapMarkerImageLoadResult
      }

      const image = createPublicMapRemoteMarkerImage({
        bitmap: result.bitmap,
        markerAccentColor,
        primaryGroup,
        sameLocationCount,
        selected: false,
        theme,
        verificationStatus,
      })
      const selectedImage = createPublicMapRemoteMarkerImage({
        bitmap: result.bitmap,
        markerAccentColor,
        primaryGroup,
        sameLocationCount,
        selected: true,
        theme,
        verificationStatus,
      })
      let changed = false

      if (image) {
        changed =
          upsertImageSafely({
            map,
            key: markerImageKey,
            image,
          }) || changed
      }
      if (selectedImage) {
        changed =
          upsertImageSafely({
            map,
            key: `${markerImageKey}-selected`,
            image: selectedImage,
          }) || changed
      }

      touchMarkerImageStatus(markerImageKey, "ready")
      if (changed) onImagesChanged?.()
      return {
        key: markerImageKey,
        status: "ready",
        changed,
      } satisfies PublicMapMarkerImageLoadResult
    })
    .catch(() => {
      touchMarkerImageStatus(markerImageKey, "failed")
      return {
        key: markerImageKey,
        status: "failed",
        changed: false,
      } satisfies PublicMapMarkerImageLoadResult
    })
}

export function ensurePublicMapFallbackMarkerImages(
  map: mapboxgl.Map,
  theme: PublicMapTheme = "light"
) {
  ensurePublicMapBadgeImages(map)

  if (!mapHasImage(map, PUBLIC_MAP_MARKER_IMAGE_FALLBACK_KEY)) {
    const fallback = createPublicMapFallbackMarkerImage({
      label: "CH",
      selected: false,
      theme,
    })
    if (fallback) {
      addImageSafely({
        map,
        key: PUBLIC_MAP_MARKER_IMAGE_FALLBACK_KEY,
        image: fallback,
      })
    }
  }

  if (!mapHasImage(map, PUBLIC_MAP_MARKER_IMAGE_SELECTED_FALLBACK_KEY)) {
    const selectedFallback = createPublicMapFallbackMarkerImage({
      label: "CH",
      selected: true,
      theme,
    })
    if (selectedFallback) {
      addImageSafely({
        map,
        key: PUBLIC_MAP_MARKER_IMAGE_SELECTED_FALLBACK_KEY,
        image: selectedFallback,
      })
    }
  }
}

export function registerPublicMapStyleImageMissingHandler(
  map: mapboxgl.Map,
  theme: PublicMapTheme = "light"
) {
  const handler = (event: { id?: string }) => {
    if (
      event.id?.startsWith("public-map-marker-") ||
      event.id?.startsWith("cluster-badge") ||
      event.id === PUBLIC_MAP_POINT_SHADOW_KEY
    ) {
      ensurePublicMapFallbackMarkerImages(map, theme)
    }
  }
  map.on("styleimagemissing", handler)
  return () => {
    map.off("styleimagemissing", handler)
  }
}

export function ensurePublicMapMarkerImages({
  map,
  features,
  onImagesChanged,
  theme = "light",
}: {
  map: mapboxgl.Map
  features: PublicMapFeatureCollection["features"]
  onImagesChanged?: () => void
  theme?: PublicMapTheme
}) {
  ensurePublicMapFallbackMarkerImages(map, theme)
  const loads: Array<Promise<PublicMapMarkerImageLoadResult>> = []

  for (const feature of features) {
    if ("cluster" in feature.properties) continue

    const {
      itemType,
      markerAccentColor,
      markerImageKey,
      markerImageUrl,
      markerStyleKey,
      name,
      primaryGroup,
      primaryResourceCategory,
      sameLocationCount,
      verificationStatus,
    } = feature.properties
    const mapAlreadyReady = mapHasMarkerImagePair(map, markerImageKey)

    if (mapAlreadyReady) {
      touchMarkerImageStatus(markerImageKey, "ready")
      continue
    }

    const fallbackChanged = ensurePublicMapFeatureFallbackMarkerImages({
      itemType,
      map,
      markerAccentColor,
      markerImageKey,
      markerImageUrl,
      markerStyleKey,
      name,
      primaryGroup,
      primaryResourceCategory,
      sameLocationCount,
      theme,
      verificationStatus,
    })

    if (fallbackChanged) onImagesChanged?.()

    if (
      shouldUpgradePublicMapMarkerImage({
        imageUrl: markerImageUrl,
        itemType,
        markerImageKey,
        verificationStatus,
      })
    ) {
      loads.push(
        createRemoteMarkerImageLoad({
          map,
          markerAccentColor,
          markerImageKey,
          markerImageUrl: markerImageUrl!.trim(),
          name,
          onImagesChanged,
          primaryGroup,
          sameLocationCount,
          theme,
          verificationStatus,
        })
      )
      continue
    }

    touchMarkerImageStatus(markerImageKey, "ready")
  }

  return loads
}
