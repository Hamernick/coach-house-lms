import {
  isPublicMapClusterFeature,
  type PublicMapFeatureCollection,
} from "./public-map-geojson"
import type { PublicMapClusterClient } from "./public-map-cluster-client"
import { buildPublicMapClusterSprite } from "./public-map-cluster-sprite-renderer"
import {
  resolvePublicMapClusterCategoryColorKeys,
  resolvePublicMapClusterVisibleCategoryKeys,
} from "./public-map-cluster-aggregation"
import {
  PUBLIC_MAP_CLUSTER_SPRITE_LAYOUT_VERSION,
  resolveVisiblePublicMapClusterDotCount,
} from "./public-map-cluster-layout"
import {
  isPublicMapResourceCategoryKey,
  resolvePublicMapResourceCategoryColor,
  type PublicMapResourceCategoryKey,
} from "./resource-categories"
import type { PublicMapTheme } from "./public-map-theme"

export { buildPublicMapClusterSprite } from "./public-map-cluster-sprite-renderer"
export { PUBLIC_MAP_CLUSTER_SPRITE_LAYOUT_VERSION } from "./public-map-cluster-layout"

export type PublicMapClusterTierName = "small" | "medium" | "large" | "xlarge"

export type PublicMapClusterTier = {
  size: number
  avatars: number
}

export type PublicMapClusterSignatureInput = {
  categoryColorKeys?: string[]
  categoryKeys?: PublicMapResourceCategoryKey[]
  markerTheme?: PublicMapTheme
  totalCount: number
  imageKeys: string[]
  zoom: number
}

export type PublicMapClusterSignature = {
  signature: string
  imageId: string
  markerTheme: PublicMapTheme
  tierName: PublicMapClusterTierName
  tier: PublicMapClusterTier
  totalCount: number
  visibleImageKeys: string[]
  visibleCategoryColors: string[]
  visibleCategoryKeys: PublicMapResourceCategoryKey[]
  overflowCount: number
  zoomBucket: number
}

export type PublicMapClusterSpriteResult = {
  image: ImageData
  key: string
  pixelRatio: number
  size: number
}

export type PublicMapClusterSpriteInput = {
  signature: PublicMapClusterSignature
  avatarBitmaps?: ImageBitmap[]
}

export type PublicMapClusterSpriteImageMap = {
  addImage: (
    id: string,
    image: ImageData,
    options?: { pixelRatio?: number }
  ) => unknown
  hasImage?: (id: string) => boolean
  updateImage?: (id: string, image: ImageData) => unknown
}

export type PublicMapClusterSpriteCacheResult = {
  imageId: string
  signature: string
  status: "added" | "cached" | "failed" | "missing" | "updated"
  changed: boolean
}

export type PublicMapClusterSpriteCache = ReturnType<
  typeof createPublicMapClusterSpriteCache
>

export type PublicMapClusterSourceDataSpriteInput = {
  clusterClient: PublicMapClusterClient
  dataVersion: string
  map: PublicMapClusterSpriteImageMap
  markerTheme?: PublicMapTheme
  shouldContinue?: () => boolean
  sourceData: PublicMapFeatureCollection
  spriteCache: PublicMapClusterSpriteCache
  zoom: number
}

export type PublicMapClusterSpriteUpgradeResult = {
  imageId: string
  signature: string
  status: "cached" | "failed" | "missing" | "skipped" | "updated"
  changed: boolean
}

export const PUBLIC_MAP_CLUSTER_TIERS = {
  small: { size: 64, avatars: 1 },
  medium: { size: 64, avatars: 2 },
  large: { size: 64, avatars: 3 },
  xlarge: { size: 64, avatars: 4 },
} as const satisfies Record<PublicMapClusterTierName, PublicMapClusterTier>

const PUBLIC_MAP_CLUSTER_IMAGE_ID_PREFIX = "public-map-cluster-sprite"
const PUBLIC_MAP_CLUSTER_SPRITE_CACHE_LIMIT = 360

export function getPublicMapClusterTier(
  totalCount: number
): PublicMapClusterTierName {
  const count = normalizePublicMapClusterCount(totalCount)
  if (count < 5) return "small"
  if (count < 20) return "medium"
  if (count < 100) return "large"
  return "xlarge"
}

export function resolvePublicMapClusterZoomBucket(zoom: number) {
  if (!Number.isFinite(zoom)) return 0
  return Math.max(0, Math.min(24, Math.floor(zoom)))
}

export function buildPublicMapClusterSignature({
  categoryColorKeys = [],
  categoryKeys = [],
  markerTheme = "light",
  totalCount,
  zoom,
}: PublicMapClusterSignatureInput): PublicMapClusterSignature {
  const normalizedTotalCount = normalizePublicMapClusterCount(totalCount)
  const tierName = getPublicMapClusterTier(normalizedTotalCount)
  const tier = PUBLIC_MAP_CLUSTER_TIERS[tierName]
  const visibleImageKeys: string[] = []
  const visibleCategoryKeys =
    normalizePublicMapClusterCategoryKeys(categoryKeys)
  const visibleCategoryColors =
    visibleCategoryKeys.length > 0
      ? visibleCategoryKeys.map((category) =>
          resolvePublicMapResourceCategoryColor(category)
        )
      : normalizePublicMapClusterCategoryColorKeys(categoryColorKeys)
  const overflowCount = 0
  const zoomBucket = resolvePublicMapClusterZoomBucket(zoom)
  const signatureParts = [
    `layout:${PUBLIC_MAP_CLUSTER_SPRITE_LAYOUT_VERSION}`,
    `theme:${markerTheme}`,
    `tier:${tierName}`,
    `count:${normalizedTotalCount}`,
  ]
  if (visibleCategoryKeys.length > 0) {
    signatureParts.push(`categories:${visibleCategoryKeys.join(",")}`)
  } else if (visibleCategoryColors.length > 0) {
    signatureParts.push(`colors:${visibleCategoryColors.join(",")}`)
  }
  const signature = signatureParts.join("|")

  return {
    signature,
    imageId: buildPublicMapClusterImageId(signature),
    markerTheme,
    tierName,
    tier,
    totalCount: normalizedTotalCount,
    visibleImageKeys,
    visibleCategoryColors,
    visibleCategoryKeys,
    overflowCount,
    zoomBucket,
  }
}

function normalizePublicMapClusterCategoryKeys(
  categoryKeys: PublicMapResourceCategoryKey[]
) {
  return categoryKeys.filter(isPublicMapResourceCategoryKey)
}

function normalizePublicMapClusterCategoryColorKeys(colorKeys: string[]) {
  return colorKeys.flatMap((colorKey) => {
    const normalizedColor = colorKey.trim().toLowerCase()
    return normalizedColor.length > 0 ? [normalizedColor] : []
  })
}

export function buildPublicMapClusterImageId(signature: string) {
  return `${PUBLIC_MAP_CLUSTER_IMAGE_ID_PREFIX}-${hashPublicMapClusterSignature(signature)}`
}

export function createPublicMapClusterSpriteCache({
  limit = PUBLIC_MAP_CLUSTER_SPRITE_CACHE_LIMIT,
}: {
  limit?: number
} = {}) {
  const imageIdBySignature = new Map<string, string>()

  const cacheSignature = (signature: PublicMapClusterSignature) => {
    touchPublicMapClusterSpriteCacheEntry({
      cache: imageIdBySignature,
      limit,
      signature: signature.signature,
      imageId: signature.imageId,
    })
    return signature.imageId
  }

  return {
    getImageId(signature: PublicMapClusterSignature) {
      return cacheSignature(signature)
    },
    ensureFallbackSprite({
      map,
      signature,
    }: {
      map: PublicMapClusterSpriteImageMap
      signature: PublicMapClusterSignature
    }): PublicMapClusterSpriteCacheResult {
      const imageId = cacheSignature(signature)
      if (mapHasClusterSpriteImage(map, imageId)) {
        return {
          imageId,
          signature: signature.signature,
          status: "cached",
          changed: false,
        }
      }

      const sprite = buildPublicMapClusterSprite({ signature })
      if (!sprite) {
        return {
          imageId,
          signature: signature.signature,
          status: "failed",
          changed: false,
        }
      }

      try {
        map.addImage(imageId, sprite.image, { pixelRatio: sprite.pixelRatio })
        return {
          imageId,
          signature: signature.signature,
          status: "added",
          changed: true,
        }
      } catch {
        return {
          imageId,
          signature: signature.signature,
          status: "failed",
          changed: false,
        }
      }
    },
    upgradeSprite({
      map,
      signature,
      avatarBitmaps: _avatarBitmaps,
    }: {
      map: PublicMapClusterSpriteImageMap
      signature: PublicMapClusterSignature
      avatarBitmaps: ImageBitmap[]
    }): PublicMapClusterSpriteUpgradeResult {
      const imageId = cacheSignature(signature)
      if (!mapHasClusterSpriteImage(map, imageId)) {
        return {
          imageId,
          signature: signature.signature,
          status: "missing",
          changed: false,
        }
      }
      return {
        imageId,
        signature: signature.signature,
        status: "cached",
        changed: false,
      }
    },
    has(signature: PublicMapClusterSignature) {
      return imageIdBySignature.has(signature.signature)
    },
    get size() {
      return imageIdBySignature.size
    },
  }
}

export async function enrichPublicMapClusterSourceDataWithSprites({
  clusterClient: _clusterClient,
  dataVersion: _dataVersion,
  map,
  markerTheme = "light",
  sourceData,
  spriteCache,
  zoom,
}: PublicMapClusterSourceDataSpriteInput): Promise<PublicMapFeatureCollection> {
  type PublicMapSourceFeature = PublicMapFeatureCollection["features"][number]

  const features = await Promise.all(
    sourceData.features.map(async (feature: PublicMapSourceFeature) => {
      if (!isPublicMapClusterFeature(feature)) return feature

      const signature = buildPublicMapClusterSignature({
        categoryColorKeys: resolvePublicMapClusterCategoryColorKeys(
          feature.properties
        ),
        categoryKeys: resolvePublicMapClusterVisibleCategoryKeys(
          feature.properties,
          resolveVisiblePublicMapClusterDotCount(feature.properties.point_count)
        ),
        markerTheme,
        totalCount: feature.properties.point_count,
        imageKeys: [],
        zoom,
      })
      spriteCache.ensureFallbackSprite({ map, signature })

      return {
        ...feature,
        properties: {
          ...feature.properties,
          clusterImageId: signature.imageId,
          clusterSignature: signature.signature,
        },
      }
    })
  )

  return {
    ...sourceData,
    features,
  }
}

export async function upgradePublicMapClusterSpritesWithAvatars({
  clusterClient: _clusterClient,
  dataVersion: _dataVersion,
  map: _map,
  shouldContinue,
  sourceData,
  spriteCache: _spriteCache,
  zoom: _zoom,
}: PublicMapClusterSourceDataSpriteInput): Promise<
  PublicMapClusterSpriteUpgradeResult[]
> {
  const results: PublicMapClusterSpriteUpgradeResult[] = []

  for (const feature of sourceData.features) {
    if (!isPublicMapClusterFeature(feature)) continue
    if (shouldContinue && !shouldContinue()) break

    results.push({
      imageId: feature.properties.clusterImageId ?? "",
      signature: feature.properties.clusterSignature ?? "",
      status: "skipped",
      changed: false,
    })
  }

  return results
}

function normalizePublicMapClusterCount(totalCount: number) {
  return Number.isFinite(totalCount) ? Math.max(0, Math.floor(totalCount)) : 0
}

function hashPublicMapClusterSignature(signature: string) {
  let hash = 2166136261
  for (let index = 0; index < signature.length; index += 1) {
    hash ^= signature.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

function touchPublicMapClusterSpriteCacheEntry({
  cache,
  limit,
  signature,
  imageId,
}: {
  cache: Map<string, string>
  limit: number
  signature: string
  imageId: string
}) {
  if (cache.has(signature)) {
    cache.delete(signature)
  }
  cache.set(signature, imageId)

  while (cache.size > limit) {
    const oldest = cache.keys().next().value as string | undefined
    if (!oldest) return
    cache.delete(oldest)
  }
}

function mapHasClusterSpriteImage(
  map: PublicMapClusterSpriteImageMap,
  imageId: string
) {
  try {
    return typeof map.hasImage === "function" && map.hasImage(imageId)
  } catch {
    return false
  }
}
