import { describe, expect, it, vi } from "vitest"
import type mapboxgl from "mapbox-gl"

import {
  buildPublicMapDataVersion,
  buildPublicMapPointFeatures,
  parsePublicMapOrganizationIds,
  resolvePublicMapMarkerImageKey,
} from "@/lib/public-map/public-map-geojson"
import {
  createPublicMapClusterClient,
  shouldUsePublicMapClusterResult,
} from "@/lib/public-map/public-map-cluster-client"
import {
  createPublicMapClusterViewportQueryState,
  preparePublicMapClusterViewportQuery,
  resolvePublicMapClusterBbox,
  resolvePublicMapClusterZoom,
} from "@/lib/public-map/public-map-bounds"
import {
  buildPublicMapClusterImageId,
  buildPublicMapClusterSignature,
  buildPublicMapClusterSprite,
  createPublicMapClusterSpriteCache,
  enrichPublicMapClusterSourceDataWithSprites,
  getPublicMapClusterTier,
  PUBLIC_MAP_CLUSTER_TIERS,
  resolvePublicMapClusterZoomBucket,
  upgradePublicMapClusterSpritesWithAvatars,
} from "@/lib/public-map/public-map-cluster-sprites"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"
import { isRecoverablePublicMapTileError } from "@/components/public/public-map-index/public-map-index-runtime"
import {
  ensurePublicMapMarkerImages,
  getPublicMapMarkerImageBitmap,
  resetPublicMapMarkerImageCachesForTest,
} from "@/lib/public-map/public-map-marker-images"

function buildOrganization(overrides: Partial<PublicMapOrganization> = {}): PublicMapOrganization {
  return {
    id: "org-1",
    name: "Alpha Org",
    tagline: null,
    description: null,
    boilerplate: null,
    vision: null,
    mission: null,
    values: null,
    needStatement: null,
    originStory: null,
    theoryOfChange: null,
    formationStatus: null,
    contactName: null,
    logoUrl: null,
    brandMarkUrl: null,
    headerUrl: null,
    website: null,
    email: null,
    phone: null,
    twitter: null,
    facebook: null,
    linkedin: null,
    instagram: null,
    brandPrimary: null,
    brandColors: [],
    brandThemePresetId: null,
    brandAccentPresetId: null,
    brandTypographyPresetId: null,
    brandTypography: null,
    brandKitAvailable: false,
    latitude: 41.8781,
    longitude: -87.6298,
    address: "233 S Wacker Dr, Chicago, IL 60606",
    addressStreet: "233 S Wacker Dr",
    addressPostal: null,
    city: "Chicago",
    state: "IL",
    country: "United States",
    locationUrl: null,
    publicSlug: "alpha-org",
    programPreview: null,
    programs: [],
    programCount: 0,
    groups: ["community"],
    primaryGroup: "community",
    isOnlineOnly: false,
    ...overrides,
  }
}

function installPublicMapImageCanvasMocks() {
  const context = {
    arc: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    clearRect: vi.fn(),
    clip: vi.fn(),
    drawImage: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    getImageData: vi.fn((_: number, __: number, width: number, height: number) => ({
      data: new Uint8ClampedArray(width * height * 4),
      height,
      width,
    })),
    lineTo: vi.fn(),
    moveTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    restore: vi.fn(),
    save: vi.fn(),
    scale: vi.fn(),
    stroke: vi.fn(),
    set fillStyle(_: string) {},
    set font(_: string) {},
    set lineWidth(_: number) {},
    set shadowBlur(_: number) {},
    set shadowColor(_: string) {},
    set shadowOffsetY(_: number) {},
    set strokeStyle(_: string) {},
    set textAlign(_: string) {},
    set textBaseline(_: string) {},
  }
  const previousDocument = globalThis.document
  const previousCreateImageBitmap = globalThis.createImageBitmap
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      createElement: vi.fn(() => ({
        getContext: vi.fn(() => context),
        height: 0,
        width: 0,
      })),
    },
  })
  Object.defineProperty(globalThis, "createImageBitmap", {
    configurable: true,
    value: vi.fn(async () => ({
      close: vi.fn(),
      height: 8,
      width: 8,
    })),
  })

  const restore = () => {
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: previousDocument,
    })
    Object.defineProperty(globalThis, "createImageBitmap", {
      configurable: true,
      value: previousCreateImageBitmap,
    })
  }
  return Object.assign(restore, { context })
}

function createImageMapMock() {
  const imageKeys = new Set<string>()
  return {
    addImage: vi.fn((key: string) => {
      imageKeys.add(key)
    }),
    hasImage: vi.fn((key: string) => imageKeys.has(key)),
    updateImage: vi.fn(),
  } as unknown as mapboxgl.Map & {
    addImage: ReturnType<typeof vi.fn>
    hasImage: ReturnType<typeof vi.fn>
    updateImage: ReturnType<typeof vi.fn>
  }
}

describe("public map WebGL data", () => {
  it("resolves deterministic Apple-style cluster tiers", () => {
    expect(PUBLIC_MAP_CLUSTER_TIERS).toEqual({
      small: { size: 32, avatars: 1 },
      medium: { size: 36, avatars: 2 },
      large: { size: 42, avatars: 3 },
      xlarge: { size: 48, avatars: 4 },
    })
    expect(getPublicMapClusterTier(2)).toBe("small")
    expect(getPublicMapClusterTier(5)).toBe("medium")
    expect(getPublicMapClusterTier(20)).toBe("large")
    expect(getPublicMapClusterTier(100)).toBe("xlarge")
  })

  it("builds stable cluster sprite signatures from tier, count, avatars, overflow, and zoom bucket", () => {
    const signature = buildPublicMapClusterSignature({
      totalCount: 24.9,
      imageKeys: ["org-c", "org-a", "org-b", "org-d"],
      zoom: 11.8,
    })
    const reordered = buildPublicMapClusterSignature({
      totalCount: 24,
      imageKeys: ["org-d", "org-b", "org-a", "org-c"],
      zoom: 11.1,
    })

    expect(signature.tierName).toBe("large")
    expect(signature.tier).toEqual({ size: 42, avatars: 3 })
    expect(signature.totalCount).toBe(24)
    expect(signature.visibleImageKeys).toEqual(["org-a", "org-b", "org-c"])
    expect(signature.overflowCount).toBe(21)
    expect(signature.zoomBucket).toBe(11)
    expect(signature.signature).toBe(
      "tier:large|count:24|images:org-a,org-b,org-c|overflow:21|zoom:11",
    )
    expect(signature.imageId).toBe(buildPublicMapClusterImageId(signature.signature))
    expect(reordered).toEqual(signature)
  })

  it("keeps cluster sprite signatures distinct across zoom buckets", () => {
    const base = {
      totalCount: 12,
      imageKeys: ["org-a", "org-b", "org-c"],
    }

    expect(resolvePublicMapClusterZoomBucket(9.99)).toBe(9)
    expect(resolvePublicMapClusterZoomBucket(10.01)).toBe(10)
    expect(buildPublicMapClusterSignature({ ...base, zoom: 9.99 }).signature).not.toBe(
      buildPublicMapClusterSignature({ ...base, zoom: 10.01 }).signature,
    )
  })

  it("builds deterministic fallback cluster sprites at the tier visual size", () => {
    const restoreCanvasMocks = installPublicMapImageCanvasMocks()
    try {
      const signature = buildPublicMapClusterSignature({
        totalCount: 8,
        imageKeys: ["org-a", "org-b"],
        zoom: 10,
      })

      const sprite = buildPublicMapClusterSprite({ signature })

      expect(sprite).toMatchObject({
        key: signature.imageId,
        pixelRatio: 2,
        size: 36,
      })
      expect(sprite?.image.width).toBe(72)
      expect(sprite?.image.height).toBe(72)
      expect(restoreCanvasMocks.context.scale).toHaveBeenCalledWith(2, 2)
      expect(restoreCanvasMocks.context.fillText).toHaveBeenCalledWith(
        "+6",
        expect.any(Number),
        expect.any(Number),
      )
      expect(restoreCanvasMocks.context.drawImage).not.toHaveBeenCalled()
    } finally {
      restoreCanvasMocks()
    }
  })

  it("draws available avatar bitmaps into cluster sprites without changing the image id", () => {
    const restoreCanvasMocks = installPublicMapImageCanvasMocks()
    try {
      const signature = buildPublicMapClusterSignature({
        totalCount: 3,
        imageKeys: ["org-a"],
        zoom: 8,
      })
      const avatar = {
        height: 64,
        width: 48,
      } as ImageBitmap

      const sprite = buildPublicMapClusterSprite({
        signature,
        avatarBitmaps: [avatar],
      })

      expect(sprite?.key).toBe(signature.imageId)
      expect(sprite?.image.width).toBe(64)
      expect(sprite?.image.height).toBe(64)
      expect(restoreCanvasMocks.context.drawImage).toHaveBeenCalledWith(
        avatar,
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
      )
    } finally {
      restoreCanvasMocks()
    }
  })

  it("registers fallback cluster sprites once per signature before async upgrades", () => {
    const restoreCanvasMocks = installPublicMapImageCanvasMocks()
    try {
      const cache = createPublicMapClusterSpriteCache()
      const map = createImageMapMock()
      const signature = buildPublicMapClusterSignature({
        totalCount: 12,
        imageKeys: ["org-a", "org-b"],
        zoom: 10,
      })

      expect(cache.ensureFallbackSprite({ map, signature })).toEqual({
        imageId: signature.imageId,
        signature: signature.signature,
        status: "added",
        changed: true,
      })
      expect(cache.ensureFallbackSprite({ map, signature })).toEqual({
        imageId: signature.imageId,
        signature: signature.signature,
        status: "cached",
        changed: false,
      })
      expect(map.addImage).toHaveBeenCalledTimes(1)
      expect(map.addImage).toHaveBeenCalledWith(
        signature.imageId,
        expect.objectContaining({
          height: 72,
          width: 72,
        }),
        { pixelRatio: 2 },
      )
    } finally {
      restoreCanvasMocks()
    }
  })

  it("updates cluster sprites only after the fallback image id exists", () => {
    const restoreCanvasMocks = installPublicMapImageCanvasMocks()
    try {
      const cache = createPublicMapClusterSpriteCache()
      const map = createImageMapMock()
      const signature = buildPublicMapClusterSignature({
        totalCount: 3,
        imageKeys: ["org-a"],
        zoom: 9,
      })
      const avatar = {
        height: 64,
        width: 64,
      } as ImageBitmap

      expect(
        cache.upgradeSprite({
          map,
          signature,
          avatarBitmaps: [avatar],
        }),
      ).toEqual({
        imageId: signature.imageId,
        signature: signature.signature,
        status: "missing",
        changed: false,
      })
      expect(map.updateImage).not.toHaveBeenCalled()

      cache.ensureFallbackSprite({ map, signature })
      expect(
        cache.upgradeSprite({
          map,
          signature,
          avatarBitmaps: [avatar],
        }),
      ).toEqual({
        imageId: signature.imageId,
        signature: signature.signature,
        status: "updated",
        changed: true,
      })
      expect(map.updateImage).toHaveBeenCalledTimes(1)
      expect(map.updateImage).toHaveBeenCalledWith(
        signature.imageId,
        expect.objectContaining({
          height: 64,
          width: 64,
        }),
      )
    } finally {
      restoreCanvasMocks()
    }
  })

  it("evicts only cluster sprite cache metadata without removing Mapbox images", () => {
    const restoreCanvasMocks = installPublicMapImageCanvasMocks()
    try {
      const cache = createPublicMapClusterSpriteCache({ limit: 1 })
      const map = createImageMapMock()
      const first = buildPublicMapClusterSignature({
        totalCount: 3,
        imageKeys: ["org-a"],
        zoom: 9,
      })
      const second = buildPublicMapClusterSignature({
        totalCount: 12,
        imageKeys: ["org-b", "org-c"],
        zoom: 9,
      })

      cache.ensureFallbackSprite({ map, signature: first })
      cache.ensureFallbackSprite({ map, signature: second })

      expect(cache.has(first)).toBe(false)
      expect(cache.has(second)).toBe(true)
      expect(cache.size).toBe(1)
      expect(map.addImage).toHaveBeenCalledTimes(2)
      expect("removeImage" in map).toBe(false)
    } finally {
      restoreCanvasMocks()
    }
  })

  it("enriches cluster features with fallback sprite ids before source data is applied", async () => {
    const restoreCanvasMocks = installPublicMapImageCanvasMocks()
    try {
      const client = createPublicMapClusterClient()
      const map = createImageMapMock()
      const spriteCache = createPublicMapClusterSpriteCache()
      const organizations = [
        buildOrganization({ id: "org-a", longitude: -87.6298, latitude: 41.8781 }),
        buildOrganization({ id: "org-b", longitude: -87.6299, latitude: 41.8782 }),
        buildOrganization({ id: "org-c", longitude: -87.63, latitude: 41.8783 }),
      ]
      const dataVersion = buildPublicMapDataVersion(organizations)
      const features = buildPublicMapPointFeatures(organizations)

      await client.build(features, dataVersion)
      const result = await client.getClusters({
        bbox: [-180, -85, 180, 85],
        zoom: 3,
        dataVersion,
        querySeq: 1,
      })
      const enriched = await enrichPublicMapClusterSourceDataWithSprites({
        clusterClient: client,
        dataVersion,
        map,
        sourceData: result.sourceData,
        spriteCache,
        zoom: 3,
      })
      const cluster = enriched.features.find(
        (feature) => "cluster" in feature.properties,
      )

      expect(cluster?.properties.clusterImageId).toMatch(/^public-map-cluster-sprite-/)
      expect(cluster?.properties.clusterSignature).toContain("zoom:3")
      expect(map.addImage).toHaveBeenCalledTimes(1)
      expect(map.updateImage).not.toHaveBeenCalled()
      expect(result.sourceData.features[0]?.properties).not.toHaveProperty("clusterImageId")
      client.destroy()
    } finally {
      restoreCanvasMocks()
    }
  })

  it("keeps cluster sprite ids stable and avoids duplicate addImage calls", async () => {
    const restoreCanvasMocks = installPublicMapImageCanvasMocks()
    try {
      const client = createPublicMapClusterClient()
      const map = createImageMapMock()
      const spriteCache = createPublicMapClusterSpriteCache()
      const organizations = [
        buildOrganization({ id: "org-a", longitude: -87.6298, latitude: 41.8781 }),
        buildOrganization({ id: "org-b", longitude: -87.7, latitude: 41.92 }),
        buildOrganization({ id: "org-c", longitude: -87.59, latitude: 41.84 }),
        buildOrganization({ id: "org-d", longitude: -87.67, latitude: 41.81 }),
        buildOrganization({ id: "org-e", longitude: -87.57, latitude: 41.9 }),
      ]
      const dataVersion = buildPublicMapDataVersion(organizations)
      const features = buildPublicMapPointFeatures(organizations)

      await client.build(features, dataVersion)
      const result = await client.getClusters({
        bbox: [-180, -85, 180, 85],
        zoom: 3,
        dataVersion,
        querySeq: 1,
      })
      const first = await enrichPublicMapClusterSourceDataWithSprites({
        clusterClient: client,
        dataVersion,
        map,
        sourceData: result.sourceData,
        spriteCache,
        zoom: 3,
      })
      const second = await enrichPublicMapClusterSourceDataWithSprites({
        clusterClient: client,
        dataVersion,
        map,
        sourceData: result.sourceData,
        spriteCache,
        zoom: 3,
      })
      const firstCluster = first.features.find(
        (feature) => "cluster" in feature.properties,
      )
      const secondCluster = second.features.find(
        (feature) => "cluster" in feature.properties,
      )

      expect(firstCluster?.properties.clusterImageId).toBe(
        secondCluster?.properties.clusterImageId,
      )
      expect(firstCluster?.properties.clusterSignature).toBe(
        secondCluster?.properties.clusterSignature,
      )
      expect(map.addImage).toHaveBeenCalledTimes(1)
      client.destroy()
    } finally {
      restoreCanvasMocks()
    }
  })

  it("renders fallback cluster sprites synchronously before avatar fetch begins", async () => {
    resetPublicMapMarkerImageCachesForTest()
    const restoreCanvasMocks = installPublicMapImageCanvasMocks()
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      blob: vi.fn(async () => new Blob(["image"])),
      ok: true,
    } as unknown as Response)
    try {
      const client = createPublicMapClusterClient()
      const map = createImageMapMock()
      const spriteCache = createPublicMapClusterSpriteCache()
      const organizations = [
        buildOrganization({
          id: "org-a",
          longitude: -87.6298,
          latitude: 41.8781,
          logoUrl: "https://cdn.example.com/a.png",
        }),
        buildOrganization({
          id: "org-b",
          longitude: -87.7,
          latitude: 41.92,
          logoUrl: "https://cdn.example.com/b.png",
        }),
        buildOrganization({
          id: "org-c",
          longitude: -87.59,
          latitude: 41.84,
          logoUrl: "https://cdn.example.com/c.png",
        }),
        buildOrganization({
          id: "org-d",
          longitude: -87.67,
          latitude: 41.81,
          logoUrl: "https://cdn.example.com/d.png",
        }),
        buildOrganization({
          id: "org-e",
          longitude: -87.57,
          latitude: 41.9,
          logoUrl: "https://cdn.example.com/e.png",
        }),
      ]
      const dataVersion = buildPublicMapDataVersion(organizations)
      const features = buildPublicMapPointFeatures(organizations)

      await client.build(features, dataVersion)
      const result = await client.getClusters({
        bbox: [-180, -85, 180, 85],
        zoom: 3,
        dataVersion,
        querySeq: 1,
      })
      const enriched = await enrichPublicMapClusterSourceDataWithSprites({
        clusterClient: client,
        dataVersion,
        map,
        sourceData: result.sourceData,
        spriteCache,
        zoom: 3,
      })
      const cluster = enriched.features.find(
        (feature) => "cluster" in feature.properties,
      )

      expect(cluster?.properties.clusterImageId).toMatch(/^public-map-cluster-sprite-/)
      expect(map.addImage).toHaveBeenCalledTimes(1)
      expect(map.updateImage).not.toHaveBeenCalled()
      expect(fetchSpy).not.toHaveBeenCalled()
      client.destroy()
    } finally {
      fetchSpy.mockRestore()
      restoreCanvasMocks()
    }
  })

  it("upgrades cluster sprites with avatar bitmaps without touching source data", async () => {
    resetPublicMapMarkerImageCachesForTest()
    const restoreCanvasMocks = installPublicMapImageCanvasMocks()
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      blob: vi.fn(async () => new Blob(["image"])),
      ok: true,
    } as unknown as Response)
    try {
      const client = createPublicMapClusterClient()
      const map = createImageMapMock()
      const source = {
        setData: vi.fn(),
      }
      const spriteCache = createPublicMapClusterSpriteCache()
      const organizations = [
        buildOrganization({
          id: "org-a",
          longitude: -87.6298,
          latitude: 41.8781,
          logoUrl: "https://cdn.example.com/a.png",
        }),
        buildOrganization({
          id: "org-b",
          longitude: -87.7,
          latitude: 41.92,
          logoUrl: "https://cdn.example.com/b.png",
        }),
        buildOrganization({
          id: "org-c",
          longitude: -87.59,
          latitude: 41.84,
          logoUrl: "https://cdn.example.com/c.png",
        }),
        buildOrganization({
          id: "org-d",
          longitude: -87.67,
          latitude: 41.81,
          logoUrl: "https://cdn.example.com/d.png",
        }),
        buildOrganization({
          id: "org-e",
          longitude: -87.57,
          latitude: 41.9,
          logoUrl: "https://cdn.example.com/e.png",
        }),
      ]
      const dataVersion = buildPublicMapDataVersion(organizations)
      const features = buildPublicMapPointFeatures(organizations)

      await client.build(features, dataVersion)
      const result = await client.getClusters({
        bbox: [-180, -85, 180, 85],
        zoom: 3,
        dataVersion,
        querySeq: 1,
      })
      const enriched = await enrichPublicMapClusterSourceDataWithSprites({
        clusterClient: client,
        dataVersion,
        map,
        sourceData: result.sourceData,
        spriteCache,
        zoom: 3,
      })

      await expect(
        upgradePublicMapClusterSpritesWithAvatars({
          clusterClient: client,
          dataVersion,
          map,
          sourceData: enriched,
          spriteCache,
          zoom: 3,
        }),
      ).resolves.toEqual([
        expect.objectContaining({
          status: "updated",
          changed: true,
        }),
      ])

      expect(fetchSpy).toHaveBeenCalledTimes(2)
      expect(map.updateImage).toHaveBeenCalledTimes(1)
      expect(source.setData).not.toHaveBeenCalled()
      await expect(
        upgradePublicMapClusterSpritesWithAvatars({
          clusterClient: client,
          dataVersion,
          map,
          sourceData: enriched,
          spriteCache,
          zoom: 3,
        }),
      ).resolves.toEqual([
        expect.objectContaining({
          status: "cached",
          changed: false,
        }),
      ])
      expect(map.updateImage).toHaveBeenCalledTimes(1)
      client.destroy()
    } finally {
      fetchSpy.mockRestore()
      restoreCanvasMocks()
    }
  })

  it("uses fallback avatar bitmaps when cluster avatar loading fails", async () => {
    resetPublicMapMarkerImageCachesForTest()
    const restoreCanvasMocks = installPublicMapImageCanvasMocks()
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue({ ok: false, blob: vi.fn() } as unknown as Response)
    try {
      const client = createPublicMapClusterClient()
      const map = createImageMapMock()
      const source = {
        setData: vi.fn(),
      }
      const spriteCache = createPublicMapClusterSpriteCache()
      const organizations = [
        buildOrganization({
          id: "org-a",
          longitude: -87.6298,
          latitude: 41.8781,
          logoUrl: "https://cdn.example.com/a.png",
        }),
        buildOrganization({
          id: "org-b",
          longitude: -87.7,
          latitude: 41.92,
          logoUrl: "https://cdn.example.com/b.png",
        }),
        buildOrganization({
          id: "org-c",
          longitude: -87.59,
          latitude: 41.84,
          logoUrl: "https://cdn.example.com/c.png",
        }),
        buildOrganization({
          id: "org-d",
          longitude: -87.67,
          latitude: 41.81,
          logoUrl: "https://cdn.example.com/d.png",
        }),
        buildOrganization({
          id: "org-e",
          longitude: -87.57,
          latitude: 41.9,
          logoUrl: "https://cdn.example.com/e.png",
        }),
      ]
      const dataVersion = buildPublicMapDataVersion(organizations)
      const features = buildPublicMapPointFeatures(organizations)

      await client.build(features, dataVersion)
      const result = await client.getClusters({
        bbox: [-180, -85, 180, 85],
        zoom: 3,
        dataVersion,
        querySeq: 1,
      })
      const enriched = await enrichPublicMapClusterSourceDataWithSprites({
        clusterClient: client,
        dataVersion,
        map,
        sourceData: result.sourceData,
        spriteCache,
        zoom: 3,
      })

      await expect(
        upgradePublicMapClusterSpritesWithAvatars({
          clusterClient: client,
          dataVersion,
          map,
          sourceData: enriched,
          spriteCache,
          zoom: 3,
        }),
      ).resolves.toEqual([
        expect.objectContaining({
          status: "updated",
          changed: true,
        }),
      ])

      expect(fetchSpy).toHaveBeenCalledTimes(2)
      expect(map.updateImage).toHaveBeenCalledTimes(1)
      expect(source.setData).not.toHaveBeenCalled()
      client.destroy()
    } finally {
      fetchSpy.mockRestore()
      restoreCanvasMocks()
    }
  })

  it("skips stale async cluster sprite upgrades before updateImage", async () => {
    resetPublicMapMarkerImageCachesForTest()
    const restoreCanvasMocks = installPublicMapImageCanvasMocks()
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      blob: vi.fn(async () => new Blob(["image"])),
      ok: true,
    } as unknown as Response)
    try {
      const client = createPublicMapClusterClient()
      const map = createImageMapMock()
      const spriteCache = createPublicMapClusterSpriteCache()
      const organizations = [
        buildOrganization({
          id: "org-a",
          longitude: -87.6298,
          latitude: 41.8781,
          logoUrl: "https://cdn.example.com/a.png",
        }),
        buildOrganization({
          id: "org-b",
          longitude: -87.7,
          latitude: 41.92,
          logoUrl: "https://cdn.example.com/b.png",
        }),
        buildOrganization({
          id: "org-c",
          longitude: -87.59,
          latitude: 41.84,
          logoUrl: "https://cdn.example.com/c.png",
        }),
        buildOrganization({
          id: "org-d",
          longitude: -87.67,
          latitude: 41.81,
          logoUrl: "https://cdn.example.com/d.png",
        }),
        buildOrganization({
          id: "org-e",
          longitude: -87.57,
          latitude: 41.9,
          logoUrl: "https://cdn.example.com/e.png",
        }),
      ]
      const dataVersion = buildPublicMapDataVersion(organizations)
      const features = buildPublicMapPointFeatures(organizations)

      await client.build(features, dataVersion)
      const result = await client.getClusters({
        bbox: [-180, -85, 180, 85],
        zoom: 3,
        dataVersion,
        querySeq: 1,
      })
      const enriched = await enrichPublicMapClusterSourceDataWithSprites({
        clusterClient: client,
        dataVersion,
        map,
        sourceData: result.sourceData,
        spriteCache,
        zoom: 3,
      })
      let current = true

      const upgrade = upgradePublicMapClusterSpritesWithAvatars({
        clusterClient: client,
        dataVersion,
        map,
        shouldContinue: () => current,
        sourceData: enriched,
        spriteCache,
        zoom: 3,
      })
      current = false

      await expect(upgrade).resolves.toEqual([
        expect.objectContaining({
          status: "skipped",
          changed: false,
        }),
      ])
      expect(map.updateImage).not.toHaveBeenCalled()
      client.destroy()
    } finally {
      fetchSpy.mockRestore()
      restoreCanvasMocks()
    }
  })

  it("groups exact same-location organizations into one clusterable point", () => {
    const features = buildPublicMapPointFeatures([
      buildOrganization({
        id: "org-a",
        name: "Alpha Org",
        logoUrl: "https://example.com/logo.png",
      }),
      buildOrganization({
        id: "org-b",
        name: "Beta Org",
        logoUrl: "https://example.com/beta.png",
      }),
      buildOrganization({
        id: "org-c",
        longitude: -90,
        latitude: 42,
      }),
      buildOrganization({
        id: "profile-only",
        longitude: null,
        latitude: null,
      }),
    ])

    expect(features).toHaveLength(2)
    expect(features[0]?.properties.sameLocationCount).toBe(2)
    expect(parsePublicMapOrganizationIds(features[0]?.properties.organizationIds)).toEqual([
      "org-a",
      "org-b",
    ])
    expect(features[0]?.properties.markerImageKey).toBe(resolvePublicMapMarkerImageKey("org-a"))
    expect(features[0]?.properties.markerImageUrl).toBe("https://example.com/logo.png")
    expect(features[1]?.properties.sameLocationCount).toBe(1)
  })

  it("derives a stable cluster data version from normalized marker inputs", () => {
    const organizations = [
      buildOrganization({
        id: "org-b",
        longitude: -87.7,
        latitude: 41.9,
        publicSlug: "beta",
      }),
      buildOrganization({
        id: "org-a",
        longitude: -87.6,
        latitude: 41.8,
        publicSlug: "alpha",
      }),
    ]

    const reordered = [organizations[1]!, organizations[0]!]
    expect(buildPublicMapDataVersion(organizations)).toBe(
      buildPublicMapDataVersion(reordered),
    )
    expect(
      buildPublicMapDataVersion([
        organizations[0]!,
        buildOrganization({
          id: "org-a",
          longitude: -87.61,
          latitude: 41.8,
          publicSlug: "alpha",
        }),
      ]),
    ).not.toBe(buildPublicMapDataVersion(organizations))
    expect(
      buildPublicMapDataVersion([
        organizations[0]!,
        buildOrganization({
          id: "org-a",
          longitude: -87.6,
          latitude: 41.8,
          publicSlug: "alpha-renamed",
        }),
      ]),
    ).not.toBe(buildPublicMapDataVersion(organizations))
  })

  it("falls back to a full-world bbox when padded bounds cross the dateline", () => {
    const map = {
      getZoom: vi.fn().mockReturnValue(12.7),
      getBounds: vi.fn().mockReturnValue({
        getWest: () => 170,
        getEast: () => -170,
        getSouth: () => -80,
        getNorth: () => 80,
      }),
    } as unknown as mapboxgl.Map

    const bbox = resolvePublicMapClusterBbox(map)
    expect(resolvePublicMapClusterZoom(map)).toBe(12)
    expect(bbox[0]).toBe(-180)
    expect(bbox[2]).toBe(180)
    expect(bbox[1]).toBe(-85)
    expect(bbox[3]).toBe(85)
  })

  it("keeps low-zoom western hemisphere bounds queryable when padding exceeds -180", () => {
    const map = {
      getZoom: vi.fn().mockReturnValue(3.15),
      getBounds: vi.fn().mockReturnValue({
        getWest: () => -189.7,
        getEast: () => -3.29,
        getSouth: () => -11.78,
        getNorth: () => 68.07,
      }),
    } as unknown as mapboxgl.Map

    expect(resolvePublicMapClusterBbox(map)).toEqual([
      -180,
      expect.any(Number),
      180,
      expect.any(Number),
    ])
  })

  it("returns clusters for the current viewport bounds", async () => {
    const client = createPublicMapClusterClient()
    const organizations = [
      buildOrganization({ id: "org-a", longitude: -87.6298, latitude: 41.8781 }),
      buildOrganization({ id: "org-b", longitude: -87.62, latitude: 41.88 }),
      buildOrganization({ id: "org-c", longitude: -118.2437, latitude: 34.0522 }),
    ]
    const dataVersion = buildPublicMapDataVersion(organizations)
    const features = buildPublicMapPointFeatures(organizations)
    const map = {
      getZoom: vi.fn().mockReturnValue(10.2),
      getBounds: vi.fn().mockReturnValue({
        getWest: () => -88,
        getEast: () => -87,
        getSouth: () => 41,
        getNorth: () => 42,
      }),
    } as unknown as mapboxgl.Map

    await client.build(features, dataVersion)
    const result = await client.getClusters({
      bbox: resolvePublicMapClusterBbox(map),
      zoom: resolvePublicMapClusterZoom(map),
      dataVersion,
      querySeq: 1,
    })

    expect(result.sourceData.features.length).toBeGreaterThan(0)
    expect(
      result.sourceData.features.every((feature) => {
        const [longitude] = feature.geometry.coordinates
        return longitude > -88.3 && longitude < -86.7
      }),
    ).toBe(true)
    client.destroy()
  })

  it("skips repeated same viewport queries so setData is not called twice", () => {
    const state = createPublicMapClusterViewportQueryState()
    const setData = vi.fn()
    const bbox: [number, number, number, number] = [-88, 41, -87, 42]
    const first = preparePublicMapClusterViewportQuery({
      state,
      bbox,
      zoom: 10,
      dataVersion: "version-a",
    })
    if (first.shouldQuery) {
      setData({
        type: "FeatureCollection",
        features: [],
      })
    }

    const second = preparePublicMapClusterViewportQuery({
      state,
      bbox,
      zoom: 10,
      dataVersion: "version-a",
    })
    if (second.shouldQuery) {
      setData({
        type: "FeatureCollection",
        features: [],
      })
    }

    expect(first.shouldQuery).toBe(true)
    expect(second.shouldQuery).toBe(false)
    expect(setData).toHaveBeenCalledTimes(1)
  })

  it("treats Mapbox vector tile auth failures as recoverable marker-layer noise", () => {
    expect(
      isRecoverablePublicMapTileError({
        status: 403,
        url: "https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/3/2/3.vector.pbf",
      }),
    ).toBe(true)

    expect(
      isRecoverablePublicMapTileError({
        status: 403,
        url: "https://api.mapbox.com/styles/v1/example/private-style",
      }),
    ).toBe(false)
  })

  it("returns clusters when the browser worker path is unavailable", async () => {
    const client = createPublicMapClusterClient()
    const features = buildPublicMapPointFeatures([
      buildOrganization({ id: "org-a" }),
      buildOrganization({ id: "org-b", longitude: -87.7 }),
    ])
    const dataVersion = "test-version"

    await expect(client.build(features, dataVersion)).resolves.toEqual({
      dataVersion,
      featureCount: 2,
      reused: false,
    })
    const result = await client.getClusters({
      bbox: [-180, -85, 180, 85],
      zoom: 3,
      dataVersion,
      querySeq: 1,
    })

    expect(result.sourceData.features.length).toBeGreaterThan(0)
    client.destroy()
  })

  it("returns guarded cluster leaves only for the active data version", async () => {
    const client = createPublicMapClusterClient()
    const organizations = [
      buildOrganization({ id: "org-a", longitude: -87.6298, latitude: 41.8781 }),
      buildOrganization({ id: "org-b", longitude: -87.6299, latitude: 41.8782 }),
      buildOrganization({ id: "org-c", longitude: -87.63, latitude: 41.8783 }),
    ]
    const dataVersion = buildPublicMapDataVersion(organizations)
    const features = buildPublicMapPointFeatures(organizations)

    await client.build(features, dataVersion)
    const result = await client.getClusters({
      bbox: [-180, -85, 180, 85],
      zoom: 3,
      dataVersion,
      querySeq: 1,
    })
    const cluster = result.sourceData.features.find(
      (feature) => "cluster" in feature.properties,
    )
    const clusterId =
      typeof cluster?.properties.cluster_id === "number"
        ? cluster.properties.cluster_id
        : null

    expect(clusterId).not.toBeNull()
    const leaves = clusterId === null
      ? []
      : await client.getLeaves(clusterId, 2, dataVersion)
    const staleLeaves = clusterId === null
      ? []
      : await client.getLeaves(clusterId, 2, "stale-version")

    expect(leaves).toHaveLength(2)
    expect(leaves.every((leaf) => !("cluster" in leaf.properties))).toBe(true)
    expect(staleLeaves).toEqual([])
    client.destroy()
  })

  it("does not build the worker index twice for the same data version", async () => {
    const workerApi = {
      build: vi.fn(async (_features, dataVersion: string) => ({
        dataVersion,
        featureCount: 2,
        reused: false,
      })),
      getClusters: vi.fn(async ({ dataVersion, querySeq }) => ({
        dataVersion,
        querySeq,
        sourceData: {
          type: "FeatureCollection" as const,
          features: [],
        },
      })),
      getExpansionZoom: vi.fn(),
      getLeaves: vi.fn(),
    }
    const client = createPublicMapClusterClient({ workerApi })
    const features = buildPublicMapPointFeatures([
      buildOrganization({ id: "org-a" }),
      buildOrganization({ id: "org-b", longitude: -87.7 }),
    ])

    await client.build(features, "same-version")
    await client.build(features, "same-version")

    expect(workerApi.build).toHaveBeenCalledTimes(1)
    client.destroy()
  })

  it("passes cluster leaf requests through the worker with the active data version", async () => {
    const workerApi = {
      build: vi.fn(async (_features, dataVersion: string) => ({
        dataVersion,
        featureCount: 1,
        reused: false,
      })),
      getClusters: vi.fn(),
      getExpansionZoom: vi.fn(),
      getLeaves: vi.fn(async (_clusterId: number, _limit: number, dataVersion: string) =>
        dataVersion === "active-version"
          ? buildPublicMapPointFeatures([buildOrganization({ id: "org-a" })])
          : [],
      ),
    }
    const client = createPublicMapClusterClient({ workerApi })

    await client.build(
      buildPublicMapPointFeatures([buildOrganization({ id: "org-a" })]),
      "active-version",
    )

    await expect(client.getLeaves(42, 4, "active-version")).resolves.toHaveLength(1)
    await expect(client.getLeaves(42, 4, "stale-version")).resolves.toEqual([])
    expect(workerApi.getLeaves).toHaveBeenCalledTimes(1)
    expect(workerApi.getLeaves).toHaveBeenCalledWith(42, 4, "active-version")
    client.destroy()
  })

  it("ignores stale cluster query results by data version and query sequence", () => {
    expect(
      shouldUsePublicMapClusterResult(
        {
          dataVersion: "v1",
          querySeq: 1,
        },
        {
          dataVersion: "v1",
          querySeq: 2,
        },
      ),
    ).toBe(false)
    expect(
      shouldUsePublicMapClusterResult(
        {
          dataVersion: "v1",
          querySeq: 2,
        },
        {
          dataVersion: "v2",
          querySeq: 2,
        },
      ),
    ).toBe(false)
    expect(
      shouldUsePublicMapClusterResult(
        {
          dataVersion: "v2",
          querySeq: 3,
        },
        {
          dataVersion: "v2",
          querySeq: 3,
        },
      ),
    ).toBe(true)
  })

  it("prevents an older fallback result from overwriting a newer worker result", () => {
    const latestWorkerResult = {
      dataVersion: "v2",
      querySeq: 8,
    }
    const olderFallbackResult = {
      dataVersion: "v1",
      querySeq: 7,
    }

    expect(
      shouldUsePublicMapClusterResult(olderFallbackResult, latestWorkerResult),
    ).toBe(false)
  })

  it("keeps fallback marker images when a remote marker image fails", async () => {
    resetPublicMapMarkerImageCachesForTest()
    const restoreCanvasMocks = installPublicMapImageCanvasMocks()
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue({ ok: false, blob: vi.fn() } as unknown as Response)
    const map = createImageMapMock()
    const [feature] = buildPublicMapPointFeatures([
      buildOrganization({
        id: "remote-failure",
        logoUrl: "https://cdn.example.com/failure.png",
      }),
    ])
    const onImagesChanged = vi.fn()

    const loads = ensurePublicMapMarkerImages({
      map,
      features: feature ? [feature] : [],
      onImagesChanged,
    })
    await expect(Promise.all(loads)).resolves.toEqual([
      expect.objectContaining({
        key: "public-map-marker-remote-failure",
        status: "failed",
        changed: false,
      }),
    ])

    expect(map.hasImage("public-map-marker-remote-failure")).toBe(true)
    expect(map.hasImage("public-map-marker-remote-failure-selected")).toBe(true)
    expect(onImagesChanged).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
    restoreCanvasMocks()
  })

  it("loads marker bitmaps once per image key for future cluster avatar sprites", async () => {
    resetPublicMapMarkerImageCachesForTest()
    const restoreCanvasMocks = installPublicMapImageCanvasMocks()
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      blob: vi.fn(async () => new Blob(["image"])),
      ok: true,
    } as unknown as Response)

    const first = getPublicMapMarkerImageBitmap({
      imageKey: "public-map-marker-avatar-cache",
      imageUrl: "https://cdn.example.com/avatar.png",
      fallbackLabel: "Avatar Cache",
    })
    const second = getPublicMapMarkerImageBitmap({
      imageKey: "public-map-marker-avatar-cache",
      imageUrl: "https://cdn.example.com/avatar.png",
      fallbackLabel: "Avatar Cache",
    })

    await expect(first).resolves.toEqual({
      key: "public-map-marker-avatar-cache",
      status: "ready",
      bitmap: expect.objectContaining({
        height: 8,
        width: 8,
      }),
    })
    await expect(second).resolves.toEqual(await first)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    fetchSpy.mockRestore()
    restoreCanvasMocks()
  })

  it("returns a cached fallback bitmap when marker bitmap loading fails", async () => {
    resetPublicMapMarkerImageCachesForTest()
    const restoreCanvasMocks = installPublicMapImageCanvasMocks()
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue({ ok: false, blob: vi.fn() } as unknown as Response)

    const first = await getPublicMapMarkerImageBitmap({
      imageKey: "public-map-marker-avatar-fallback",
      imageUrl: "https://cdn.example.com/fallback.png",
      fallbackLabel: "Fallback Org",
    })
    const second = await getPublicMapMarkerImageBitmap({
      imageKey: "public-map-marker-avatar-fallback",
      imageUrl: "https://cdn.example.com/fallback.png",
      fallbackLabel: "Fallback Org",
    })

    expect(first).toEqual({
      key: "public-map-marker-avatar-fallback",
      status: "failed",
      bitmap: expect.objectContaining({
        height: 8,
        width: 8,
      }),
    })
    expect(second).toBe(first)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    fetchSpy.mockRestore()
    restoreCanvasMocks()
  })

  it("refreshes the existing source with the last non-empty collection after an image loads", async () => {
    resetPublicMapMarkerImageCachesForTest()
    const restoreCanvasMocks = installPublicMapImageCanvasMocks()
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      blob: vi.fn(async () => new Blob(["image"])),
      ok: true,
    } as unknown as Response)
    const map = createImageMapMock()
    const source = {
      setData: vi.fn(),
    }
    const features = buildPublicMapPointFeatures([
      buildOrganization({
        id: "remote-success",
        logoUrl: "https://cdn.example.com/success.png",
      }),
    ])
    const latestSourceData = {
      type: "FeatureCollection" as const,
      features,
    }

    const loads = ensurePublicMapMarkerImages({
      map,
      features,
      onImagesChanged: () => source.setData(latestSourceData),
    })
    await expect(Promise.all(loads)).resolves.toEqual([
      expect.objectContaining({
        key: "public-map-marker-remote-success",
        status: "ready",
        changed: true,
      }),
    ])

    expect(source.setData).toHaveBeenCalledWith(latestSourceData)
    expect(source.setData).not.toHaveBeenCalledWith({
      type: "FeatureCollection",
      features: [],
    })
    fetchSpy.mockRestore()
    restoreCanvasMocks()
  })

  it("does not duplicate remote marker image loads while a key is already loading", async () => {
    resetPublicMapMarkerImageCachesForTest()
    const restoreCanvasMocks = installPublicMapImageCanvasMocks()
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      blob: vi.fn(async () => new Blob(["image"])),
      ok: true,
    } as unknown as Response)
    const map = createImageMapMock()
    const features = buildPublicMapPointFeatures([
      buildOrganization({
        id: "remote-cache",
        logoUrl: "https://cdn.example.com/cache.png",
      }),
    ])

    const firstLoads = ensurePublicMapMarkerImages({ map, features })
    const secondLoads = ensurePublicMapMarkerImages({ map, features })

    expect(secondLoads).toEqual([])
    expect(fetchSpy).toHaveBeenCalledTimes(2)
    await Promise.all(firstLoads)
    fetchSpy.mockRestore()
    restoreCanvasMocks()
  })
})
