import {
  isPublicMapClusterFeature,
  type PublicMapFeatureCollection,
  type PublicMapPointFeature,
} from "./public-map-geojson"
import type { PublicMapClusterClient } from "./public-map-cluster-client"
import { getPublicMapMarkerImageBitmap } from "./public-map-marker-images"
import { buildPublicMapClusterSprite } from "./public-map-cluster-sprite-renderer"

export { buildPublicMapClusterSprite } from "./public-map-cluster-sprite-renderer"

export type PublicMapClusterTierName = "small" | "medium" | "large" | "xlarge"

export type PublicMapClusterTier = {
  size: number
  avatars: number
}

export type PublicMapClusterSignatureInput = {
  totalCount: number
  imageKeys: string[]
  zoom: number
}

export type PublicMapClusterSignature = {
  signature: string
  imageId: string
  tierName: PublicMapClusterTierName
  tier: PublicMapClusterTier
  totalCount: number
  visibleImageKeys: string[]
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
    options?: { pixelRatio?: number },
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

export type PublicMapClusterSpriteCache = ReturnType<typeof createPublicMapClusterSpriteCache>

export type PublicMapClusterSourceDataSpriteInput = {
  clusterClient: PublicMapClusterClient
  dataVersion: string
  map: PublicMapClusterSpriteImageMap
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
  small: { size: 32, avatars: 1 },
  medium: { size: 36, avatars: 2 },
  large: { size: 42, avatars: 3 },
  xlarge: { size: 48, avatars: 4 },
} as const satisfies Record<PublicMapClusterTierName, PublicMapClusterTier>

const PUBLIC_MAP_CLUSTER_IMAGE_ID_PREFIX = "public-map-cluster-sprite"
const PUBLIC_MAP_CLUSTER_SPRITE_CACHE_LIMIT = 360

export function getPublicMapClusterTier(
  totalCount: number,
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
  totalCount,
  imageKeys,
  zoom,
}: PublicMapClusterSignatureInput): PublicMapClusterSignature {
  const normalizedTotalCount = normalizePublicMapClusterCount(totalCount)
  const tierName = getPublicMapClusterTier(normalizedTotalCount)
  const tier = PUBLIC_MAP_CLUSTER_TIERS[tierName]
  const visibleImageKeys = normalizePublicMapClusterImageKeys(imageKeys).slice(
    0,
    tier.avatars,
  )
  const overflowCount = Math.max(0, normalizedTotalCount - visibleImageKeys.length)
  const zoomBucket = resolvePublicMapClusterZoomBucket(zoom)
  const signature = [
    `tier:${tierName}`,
    `count:${normalizedTotalCount}`,
    `images:${visibleImageKeys.map(encodePublicMapClusterSignaturePart).join(",")}`,
    `overflow:${overflowCount}`,
    `zoom:${zoomBucket}`,
  ].join("|")

  return {
    signature,
    imageId: buildPublicMapClusterImageId(signature),
    tierName,
    tier,
    totalCount: normalizedTotalCount,
    visibleImageKeys,
    overflowCount,
    zoomBucket,
  }
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
  const upgradedSignatures = new Set<string>()

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
        upgradedSignatures.delete(signature.signature)
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
      avatarBitmaps,
    }: {
      map: PublicMapClusterSpriteImageMap
      signature: PublicMapClusterSignature
      avatarBitmaps: ImageBitmap[]
    }): PublicMapClusterSpriteUpgradeResult {
      const imageId = cacheSignature(signature)
      if (!mapHasClusterSpriteImage(map, imageId) || typeof map.updateImage !== "function") {
        return {
          imageId,
          signature: signature.signature,
          status: "missing",
          changed: false,
        }
      }
      if (upgradedSignatures.has(signature.signature)) {
        return {
          imageId,
          signature: signature.signature,
          status: "cached",
          changed: false,
        }
      }

      const sprite = buildPublicMapClusterSprite({ signature, avatarBitmaps })
      if (!sprite) {
        return {
          imageId,
          signature: signature.signature,
          status: "failed",
          changed: false,
        }
      }

      try {
        map.updateImage(imageId, sprite.image)
        upgradedSignatures.add(signature.signature)
        return {
          imageId,
          signature: signature.signature,
          status: "updated",
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
    has(signature: PublicMapClusterSignature) {
      return imageIdBySignature.has(signature.signature)
    },
    get size() {
      return imageIdBySignature.size
    },
  }
}

export async function enrichPublicMapClusterSourceDataWithSprites({
  clusterClient,
  dataVersion,
  map,
  sourceData,
  spriteCache,
  zoom,
}: PublicMapClusterSourceDataSpriteInput): Promise<PublicMapFeatureCollection> {
  type PublicMapSourceFeature = PublicMapFeatureCollection["features"][number]

  const features = await Promise.all(
    sourceData.features.map(async (feature: PublicMapSourceFeature) => {
      if (!isPublicMapClusterFeature(feature)) return feature

      const leaves = await clusterClient.getLeaves(
        feature.properties.cluster_id,
        4,
        dataVersion,
      )
      const signature = buildPublicMapClusterSignature({
        totalCount: feature.properties.point_count,
        imageKeys: leaves.map((leaf) => leaf.properties.markerImageKey),
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
    }),
  )

  return {
    ...sourceData,
    features,
  }
}

export async function upgradePublicMapClusterSpritesWithAvatars({
  clusterClient,
  dataVersion,
  map,
  shouldContinue,
  sourceData,
  spriteCache,
  zoom,
}: PublicMapClusterSourceDataSpriteInput): Promise<PublicMapClusterSpriteUpgradeResult[]> {
  const results: PublicMapClusterSpriteUpgradeResult[] = []

  for (const feature of sourceData.features) {
    if (!isPublicMapClusterFeature(feature)) continue
    if (shouldContinue && !shouldContinue()) break

    const leaves = await clusterClient.getLeaves(
      feature.properties.cluster_id,
      4,
      dataVersion,
    )
    const signature = buildPublicMapClusterSignature({
      totalCount: feature.properties.point_count,
      imageKeys: leaves.map((leaf) => leaf.properties.markerImageKey),
      zoom,
    })

    if (feature.properties.clusterSignature !== signature.signature) {
      results.push({
        imageId: feature.properties.clusterImageId ?? signature.imageId,
        signature: feature.properties.clusterSignature ?? signature.signature,
        status: "skipped",
        changed: false,
      })
      continue
    }

    const avatarBitmaps = await loadPublicMapClusterAvatarBitmaps({
      leaves,
      visibleImageKeys: signature.visibleImageKeys,
    })
    if (shouldContinue && !shouldContinue()) {
      results.push({
        imageId: signature.imageId,
        signature: signature.signature,
        status: "skipped",
        changed: false,
      })
      continue
    }
    results.push(spriteCache.upgradeSprite({ map, signature, avatarBitmaps }))
  }

  return results
}

function normalizePublicMapClusterCount(totalCount: number) {
  return Number.isFinite(totalCount) ? Math.max(0, Math.floor(totalCount)) : 0
}

async function loadPublicMapClusterAvatarBitmaps({
  leaves,
  visibleImageKeys,
}: {
  leaves: PublicMapPointFeature[]
  visibleImageKeys: string[]
}) {
  const leafByMarkerImageKey = new Map(
    leaves.map((leaf) => [leaf.properties.markerImageKey, leaf] as const),
  )
  const results = await Promise.all(
    visibleImageKeys.map(async (imageKey) => {
      const leaf = leafByMarkerImageKey.get(imageKey)
      if (!leaf) return null
      const result = await getPublicMapMarkerImageBitmap({
        imageKey: leaf.properties.markerImageKey,
        imageUrl: leaf.properties.markerImageUrl,
        fallbackLabel: leaf.properties.name,
      })
      return result.bitmap
    }),
  )

  return results.filter((bitmap): bitmap is ImageBitmap => Boolean(bitmap))
}

function normalizePublicMapClusterImageKeys(imageKeys: string[]) {
  return [...new Set(
    imageKeys
      .map((imageKey) => imageKey.trim())
      .filter((imageKey) => imageKey.length > 0),
  )].sort()
}

function encodePublicMapClusterSignaturePart(value: string) {
  return encodeURIComponent(value)
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
  imageId: string,
) {
  try {
    return typeof map.hasImage === "function" && map.hasImage(imageId)
  } catch {
    return false
  }
}
