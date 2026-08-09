import type mapboxgl from "mapbox-gl"

import type { PublicMapGroupKey } from "@/lib/public-map/groups"
import type { PublicMapResourceCategoryKey } from "@/lib/public-map/resource-categories"

import {
  PUBLIC_MAP_MARKER_IMAGE_FALLBACK_KEY,
  PUBLIC_MAP_MARKER_IMAGE_SELECTED_FALLBACK_KEY,
  type PublicMapFeatureCollection,
} from "./public-map-geojson"
import {
  createPublicMapFallbackMarkerImage,
  createPublicMapRemoteMarkerImage,
  PUBLIC_MAP_MARKER_IMAGE_PIXEL_RATIO,
} from "./public-map-pin-marker-canvas"
import { getPublicMapPinMarkerBitmap } from "./public-map-pin-marker-bitmap-cache"
import type { PublicMapTheme } from "./public-map-theme"

export type PublicMapPinMarkerImageLoadResult = {
  changed: boolean
  key: string
  status: "ready" | "failed"
}

const appliedProfileImageKeysByMap = new WeakMap<mapboxgl.Map, Set<string>>()
const pendingProfileImageLoadsByMap = new WeakMap<
  mapboxgl.Map,
  Map<string, Promise<PublicMapPinMarkerImageLoadResult>>
>()

function mapHasImage(map: mapboxgl.Map, key: string) {
  return typeof map.hasImage === "function" && map.hasImage(key)
}

function mapHasImagePair(map: mapboxgl.Map, key: string) {
  return mapHasImage(map, key) && mapHasImage(map, `${key}-selected`)
}

function addImageSafely({
  image,
  key,
  map,
}: {
  image: ImageData
  key: string
  map: mapboxgl.Map
}) {
  try {
    if (mapHasImage(map, key)) return false
    map.addImage(key, image, {
      pixelRatio: PUBLIC_MAP_MARKER_IMAGE_PIXEL_RATIO,
    })
    return true
  } catch {
    return false
  }
}

function upsertImageSafely({
  image,
  key,
  map,
}: {
  image: ImageData
  key: string
  map: mapboxgl.Map
}) {
  try {
    if (mapHasImage(map, key)) {
      map.updateImage(key, image)
      return true
    }
    map.addImage(key, image, {
      pixelRatio: PUBLIC_MAP_MARKER_IMAGE_PIXEL_RATIO,
    })
    return true
  } catch {
    return false
  }
}

function getAppliedProfileImageKeys(map: mapboxgl.Map) {
  const existing = appliedProfileImageKeysByMap.get(map)
  if (existing) return existing
  const keys = new Set<string>()
  appliedProfileImageKeysByMap.set(map, keys)
  return keys
}

function getPendingProfileImageLoads(map: mapboxgl.Map) {
  const existing = pendingProfileImageLoadsByMap.get(map)
  if (existing) return existing
  const loads = new Map<string, Promise<PublicMapPinMarkerImageLoadResult>>()
  pendingProfileImageLoadsByMap.set(map, loads)
  return loads
}

export function shouldUsePublicMapPinProfileImage({
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

function createPinPair({
  markerAccentColor,
  markerImageKey,
  name,
  primaryGroup,
  resourceCategory,
  sameLocationCount,
  theme,
}: {
  markerAccentColor?: string | null
  markerImageKey: string
  name: string
  primaryGroup?: PublicMapGroupKey | null
  resourceCategory?: PublicMapResourceCategoryKey | null
  sameLocationCount?: number
  theme: PublicMapTheme
}) {
  const normal = createPublicMapFallbackMarkerImage({
    label: name,
    markerAccentColor,
    primaryGroup,
    resourceCategory,
    sameLocationCount,
    selected: false,
    theme,
  })
  const selected = createPublicMapFallbackMarkerImage({
    label: name,
    markerAccentColor,
    primaryGroup,
    resourceCategory,
    sameLocationCount,
    selected: true,
    theme,
  })

  return {
    normal: normal ? { image: normal, key: markerImageKey } : null,
    selected: selected
      ? { image: selected, key: `${markerImageKey}-selected` }
      : null,
  }
}

function createProfilePinPair({
  bitmap,
  markerAccentColor,
  markerImageKey,
  primaryGroup,
  sameLocationCount,
  theme,
  verificationStatus,
}: {
  bitmap: ImageBitmap
  markerAccentColor?: string | null
  markerImageKey: string
  primaryGroup?: PublicMapGroupKey | null
  sameLocationCount?: number
  theme: PublicMapTheme
  verificationStatus?: string | null
}) {
  const normal = createPublicMapRemoteMarkerImage({
    bitmap,
    markerAccentColor,
    primaryGroup,
    sameLocationCount,
    selected: false,
    theme,
    verificationStatus,
  })
  const selected = createPublicMapRemoteMarkerImage({
    bitmap,
    markerAccentColor,
    primaryGroup,
    sameLocationCount,
    selected: true,
    theme,
    verificationStatus,
  })

  return {
    normal: normal ? { image: normal, key: markerImageKey } : null,
    selected: selected
      ? { image: selected, key: `${markerImageKey}-selected` }
      : null,
  }
}

function loadProfilePinPair({
  imageUrl,
  map,
  markerAccentColor,
  markerImageKey,
  primaryGroup,
  sameLocationCount,
  theme,
  verificationStatus,
}: {
  imageUrl: string
  map: mapboxgl.Map
  markerAccentColor?: string | null
  markerImageKey: string
  primaryGroup?: PublicMapGroupKey | null
  sameLocationCount?: number
  theme: PublicMapTheme
  verificationStatus?: string | null
}) {
  const appliedKeys = getAppliedProfileImageKeys(map)
  if (!mapHasImagePair(map, markerImageKey)) {
    appliedKeys.delete(markerImageKey)
  } else if (appliedKeys.has(markerImageKey)) {
    return null
  }

  const pendingLoads = getPendingProfileImageLoads(map)
  const pending = pendingLoads.get(markerImageKey)
  if (pending) return pending

  const load = getPublicMapPinMarkerBitmap({
    imageUrl,
    key: markerImageKey,
  })
    .then((result) => {
      if (result.status !== "ready" || !result.bitmap) {
        return {
          changed: false,
          key: markerImageKey,
          status: "failed",
        } satisfies PublicMapPinMarkerImageLoadResult
      }

      const pair = createProfilePinPair({
        bitmap: result.bitmap,
        markerAccentColor,
        markerImageKey,
        primaryGroup,
        sameLocationCount,
        theme,
        verificationStatus,
      })
      let changed = false
      if (pair.normal) {
        changed = upsertImageSafely({ map, ...pair.normal }) || changed
      }
      if (pair.selected) {
        changed = upsertImageSafely({ map, ...pair.selected }) || changed
      }
      if (mapHasImagePair(map, markerImageKey)) {
        appliedKeys.add(markerImageKey)
      }
      if (changed) map.triggerRepaint()

      return {
        changed,
        key: markerImageKey,
        status: "ready",
      } satisfies PublicMapPinMarkerImageLoadResult
    })
    .finally(() => {
      pendingLoads.delete(markerImageKey)
    })

  pendingLoads.set(markerImageKey, load)
  return load
}

export function ensurePublicMapPinFallbackMarkerImages({
  map,
  theme = "light",
}: {
  map: mapboxgl.Map
  theme?: PublicMapTheme
}) {
  const pair = createPinPair({
    markerImageKey: PUBLIC_MAP_MARKER_IMAGE_FALLBACK_KEY,
    name: "Organization",
    primaryGroup: "community",
    theme,
  })
  if (pair.normal) {
    addImageSafely({ map, ...pair.normal })
  }
  if (pair.selected) {
    addImageSafely({
      image: pair.selected.image,
      key: PUBLIC_MAP_MARKER_IMAGE_SELECTED_FALLBACK_KEY,
      map,
    })
  }
}

export function ensurePublicMapPinMarkerImages({
  features,
  map,
  theme = "light",
}: {
  features: PublicMapFeatureCollection["features"]
  map: mapboxgl.Map
  theme?: PublicMapTheme
}) {
  ensurePublicMapPinFallbackMarkerImages({ map, theme })
  const profileImageLoads: Array<Promise<PublicMapPinMarkerImageLoadResult>> =
    []

  for (const feature of features) {
    if ("cluster" in feature.properties) continue
    const {
      itemType,
      markerAccentColor,
      markerImageKey,
      markerImageUrl,
      name,
      primaryGroup,
      primaryResourceCategory,
      sameLocationCount,
      verificationStatus,
    } = feature.properties
    if (!mapHasImagePair(map, markerImageKey)) {
      const pair = createPinPair({
        markerAccentColor,
        markerImageKey,
        name,
        primaryGroup,
        resourceCategory:
          itemType === "external_resource" ? primaryResourceCategory : null,
        sameLocationCount,
        theme,
      })
      if (pair.normal) addImageSafely({ map, ...pair.normal })
      if (pair.selected) addImageSafely({ map, ...pair.selected })
    }

    if (
      shouldUsePublicMapPinProfileImage({
        imageUrl: markerImageUrl,
        itemType,
        verificationStatus,
      })
    ) {
      const load = loadProfilePinPair({
        imageUrl: markerImageUrl!.trim(),
        map,
        markerAccentColor,
        markerImageKey,
        primaryGroup,
        sameLocationCount,
        theme,
        verificationStatus,
      })
      if (load) profileImageLoads.push(load)
    }
  }

  return profileImageLoads
}

export function registerPublicMapPinStyleImageMissingHandler({
  map,
  theme = "light",
}: {
  map: mapboxgl.Map
  theme?: PublicMapTheme
}) {
  const handler = (event: { id?: string }) => {
    if (event.id?.startsWith("public-map-marker-")) {
      ensurePublicMapPinFallbackMarkerImages({ map, theme })
    }
  }
  map.on("styleimagemissing", handler)
  return () => map.off("styleimagemissing", handler)
}
