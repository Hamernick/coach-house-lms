import type mapboxgl from "mapbox-gl"

import {
  PUBLIC_MAP_MARKER_IMAGE_FALLBACK_KEY,
  PUBLIC_MAP_MARKER_IMAGE_SELECTED_FALLBACK_KEY,
  type PublicMapFeatureCollection,
} from "./public-map-geojson"
import {
  PUBLIC_MAP_CLUSTER_BADGE_LARGE_KEY,
  PUBLIC_MAP_CLUSTER_BADGE_MEDIUM_KEY,
  PUBLIC_MAP_CLUSTER_BADGE_SHADOW_LARGE_KEY,
  PUBLIC_MAP_CLUSTER_BADGE_SHADOW_MEDIUM_KEY,
  PUBLIC_MAP_CLUSTER_BADGE_SHADOW_SMALL_KEY,
  PUBLIC_MAP_CLUSTER_BADGE_SMALL_KEY,
  PUBLIC_MAP_POINT_SHADOW_KEY,
} from "./public-map-marker-style"

const MARKER_CANVAS_SIZE = 72
const POINT_SHADOW_CANVAS_SIZE = 80
const MARKER_IMAGE_CACHE_LIMIT = 240
const ADDED_IMAGE_CACHE_LIMIT = 360
const MARKER_BITMAP_CACHE_LIMIT = 240

type MarkerImageStatus = "loading" | "ready" | "failed"
export type PublicMapMarkerImageLoadResult = {
  key: string
  status: MarkerImageStatus | "cached"
  changed: boolean
}
export type PublicMapMarkerImageBitmapResult = {
  key: string
  status: "ready" | "failed"
  bitmap: ImageBitmap | null
}
export type PublicMapMarkerImageBitmapRequest = {
  imageKey: string
  imageUrl: string | null
  fallbackLabel: string
}

const markerImageStatusByKey = new Map<string, MarkerImageStatus>()
const markerImageBitmapByKey = new Map<string, Promise<PublicMapMarkerImageBitmapResult>>()
const addedImageKeys = new Set<string>()

type MarkerChromeGeometry = {
  centerX: number
  centerY: number
  contentRadius: number
  outerRadius: number
  pointerBaseY: number | null
  pointerHalfWidth: number
  pointerTipY: number | null
}

export function resetPublicMapMarkerImageCachesForTest() {
  markerImageStatusByKey.clear()
  markerImageBitmapByKey.clear()
  addedImageKeys.clear()
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
    const oldest = markerImageStatusByKey.keys().next().value as string | undefined
    if (!oldest) return
    markerImageStatusByKey.delete(oldest)
  }
}

function touchMarkerImageBitmapLoad(
  key: string,
  load: Promise<PublicMapMarkerImageBitmapResult>,
) {
  if (markerImageBitmapByKey.has(key)) {
    markerImageBitmapByKey.delete(key)
  }
  markerImageBitmapByKey.set(key, load)

  while (markerImageBitmapByKey.size > MARKER_BITMAP_CACHE_LIMIT) {
    const oldest = markerImageBitmapByKey.keys().next().value as string | undefined
    if (!oldest) return
    markerImageBitmapByKey.delete(oldest)
  }
}

function createCanvas() {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(MARKER_CANVAS_SIZE, MARKER_CANVAS_SIZE)
  }
  const canvas = document.createElement("canvas")
  canvas.width = MARKER_CANVAS_SIZE
  canvas.height = MARKER_CANVAS_SIZE
  return canvas
}

function createSizedCanvas(size: number) {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(size, size)
  }
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  return canvas
}

function getCanvasContext(canvas: HTMLCanvasElement | OffscreenCanvas) {
  return canvas.getContext("2d", {
    willReadFrequently: true,
  })
}

function buildInitials(value: string) {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  const letters = parts.length > 1 ? [parts[0]?.[0], parts[1]?.[0]] : [parts[0]?.[0]]
  return letters
    .filter((entry): entry is string => Boolean(entry))
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function resolveMarkerChromeGeometry(selected: boolean): MarkerChromeGeometry {
  return {
    centerX: MARKER_CANVAS_SIZE / 2,
    centerY: selected ? 31 : MARKER_CANVAS_SIZE / 2,
    contentRadius: selected ? 17 : 15.5,
    outerRadius: selected ? 21 : 18,
    pointerBaseY: selected ? 48.5 : null,
    pointerHalfWidth: selected ? 8 : 0,
    pointerTipY: selected ? 59.5 : null,
  }
}

function drawSelectedPointerPath({
  context,
  geometry,
}: {
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
  geometry: MarkerChromeGeometry
}) {
  if (geometry.pointerBaseY === null || geometry.pointerTipY === null) return

  context.beginPath()
  context.moveTo(geometry.centerX - geometry.pointerHalfWidth, geometry.pointerBaseY)
  context.quadraticCurveTo(
    geometry.centerX - 4.25,
    geometry.pointerTipY - 1.75,
    geometry.centerX - 1.4,
    geometry.pointerTipY - 0.65,
  )
  context.quadraticCurveTo(
    geometry.centerX,
    geometry.pointerTipY,
    geometry.centerX + 1.4,
    geometry.pointerTipY - 0.65,
  )
  context.quadraticCurveTo(
    geometry.centerX + 4.25,
    geometry.pointerTipY - 1.75,
    geometry.centerX + geometry.pointerHalfWidth,
    geometry.pointerBaseY,
  )
  context.closePath()
}

function drawMarkerChrome({
  context,
  selected,
}: {
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
  selected: boolean
}) {
  const geometry = resolveMarkerChromeGeometry(selected)

  context.clearRect(0, 0, MARKER_CANVAS_SIZE, MARKER_CANVAS_SIZE)
  context.save()
  context.shadowColor = selected ? "rgba(15, 23, 42, 0.28)" : "rgba(15, 23, 42, 0.2)"
  context.shadowBlur = selected ? 10 : 6
  context.shadowOffsetY = selected ? 3 : 1.5
  context.fillStyle = "rgba(255, 255, 255, 0.98)"
  if (selected) {
    drawSelectedPointerPath({ context, geometry })
    context.fill()
  }
  context.beginPath()
  context.arc(
    geometry.centerX,
    geometry.centerY,
    geometry.outerRadius,
    0,
    Math.PI * 2,
  )
  context.fill()
  context.restore()

  if (selected) {
    context.save()
    context.strokeStyle = "rgba(60, 60, 67, 0.24)"
    context.lineWidth = 1
    drawSelectedPointerPath({ context, geometry })
    context.stroke()
    context.beginPath()
    context.arc(
      geometry.centerX,
      geometry.centerY,
      geometry.outerRadius,
      0,
      Math.PI * 2,
    )
    context.stroke()
    context.restore()
  }

  context.save()
  context.beginPath()
  context.arc(
    geometry.centerX,
    geometry.centerY,
    geometry.contentRadius,
    0,
    Math.PI * 2,
  )
  context.clip()
}

function finishMarkerChrome({
  context,
  selected,
}: {
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
  selected: boolean
}) {
  const geometry = resolveMarkerChromeGeometry(selected)
  context.restore()
  context.save()
  context.strokeStyle = "#FFFFFF"
  context.lineWidth = selected ? 2.25 : 2
  context.beginPath()
  context.arc(
    geometry.centerX,
    geometry.centerY,
    geometry.contentRadius,
    0,
    Math.PI * 2,
  )
  context.stroke()
  context.restore()
}

function fillMarkerFallback({
  context,
  label,
  selected,
}: {
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
  label: string
  selected: boolean
}) {
  const geometry = resolveMarkerChromeGeometry(selected)
  context.fillStyle = selected ? "#1C1C1E" : "#0A84FF"
  context.fillRect(0, 0, MARKER_CANVAS_SIZE, MARKER_CANVAS_SIZE)
  context.fillStyle = "#FFFFFF"
  context.font = `700 ${selected ? 12 : 13}px -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif`
  context.textAlign = "center"
  context.textBaseline = "middle"
  context.fillText(
    buildInitials(label) || "CH",
    geometry.centerX,
    geometry.centerY + 0.5,
  )
}

function createFallbackMarkerImage({
  label,
  selected,
}: {
  label: string
  selected: boolean
}) {
  const canvas = createCanvas()
  const context = getCanvasContext(canvas)
  if (!context) return null

  drawMarkerChrome({ context, selected })
  fillMarkerFallback({ context, label, selected })
  finishMarkerChrome({ context, selected })

  return context.getImageData(0, 0, MARKER_CANVAS_SIZE, MARKER_CANVAS_SIZE)
}

function drawImageCover({
  context,
  bitmap,
}: {
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
  bitmap: ImageBitmap
}) {
  const sourceSize = Math.min(bitmap.width, bitmap.height)
  const sourceX = Math.max(0, (bitmap.width - sourceSize) / 2)
  const sourceY = Math.max(0, (bitmap.height - sourceSize) / 2)
  context.drawImage(
    bitmap,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    0,
    0,
    MARKER_CANVAS_SIZE,
    MARKER_CANVAS_SIZE,
  )
}

async function createRemoteMarkerImage({
  imageUrl,
  fallbackLabel,
  selected,
}: {
  imageUrl: string
  fallbackLabel: string
  selected: boolean
}) {
  const response = await fetch(imageUrl, {
    cache: "force-cache",
    mode: "cors",
  })
  if (!response.ok) throw new Error("Marker image request failed.")

  const blob = await response.blob()
  const bitmap = await createImageBitmap(blob)
  const canvas = createCanvas()
  const context = getCanvasContext(canvas)
  if (!context) return createFallbackMarkerImage({ label: fallbackLabel, selected })

  drawMarkerChrome({ context, selected })
  drawImageCover({ context, bitmap })
  finishMarkerChrome({ context, selected })
  bitmap.close()

  return context.getImageData(0, 0, MARKER_CANVAS_SIZE, MARKER_CANVAS_SIZE)
}

async function createFallbackMarkerBitmap(label: string) {
  const image = createFallbackMarkerImage({ label, selected: false })
  if (!image) return null
  try {
    return await createImageBitmap(image)
  } catch {
    return null
  }
}

async function loadPublicMapMarkerImageBitmap({
  imageKey,
  imageUrl,
  fallbackLabel,
}: PublicMapMarkerImageBitmapRequest): Promise<PublicMapMarkerImageBitmapResult> {
  if (!imageUrl) {
    return {
      key: imageKey,
      status: "failed",
      bitmap: await createFallbackMarkerBitmap(fallbackLabel),
    }
  }

  try {
    const response = await fetch(imageUrl, {
      cache: "force-cache",
      mode: "cors",
    })
    if (!response.ok) throw new Error("Marker bitmap request failed.")

    const blob = await response.blob()
    const bitmap = await createImageBitmap(blob)
    return {
      key: imageKey,
      status: "ready",
      bitmap,
    }
  } catch {
    return {
      key: imageKey,
      status: "failed",
      bitmap: await createFallbackMarkerBitmap(fallbackLabel),
    }
  }
}

export function getPublicMapMarkerImageBitmap(
  request: PublicMapMarkerImageBitmapRequest,
) {
  const cached = markerImageBitmapByKey.get(request.imageKey)
  if (cached) return cached

  const load = loadPublicMapMarkerImageBitmap(request)
  touchMarkerImageBitmapLoad(request.imageKey, load)
  return load
}

function mapHasImage(map: mapboxgl.Map, key: string) {
  return typeof map.hasImage === "function" && map.hasImage(key)
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
    map.addImage(key, image, { pixelRatio: 2 })
    touchAddedImageKey(key)
    return true
  } catch {
    return false
  }
}

function createClusterBadgeImage(size: number) {
  const canvas = createSizedCanvas(size)
  const context = getCanvasContext(canvas)
  if (!context) return null

  const center = size / 2
  const radius = center - 3
  context.clearRect(0, 0, size, size)
  context.save()
  context.fillStyle = "rgba(255, 255, 255, 0.98)"
  context.beginPath()
  context.arc(center, center, radius, 0, Math.PI * 2)
  context.fill()
  context.lineWidth = 2
  context.strokeStyle = "rgba(60, 60, 67, 0.18)"
  context.stroke()
  context.restore()

  context.save()
  context.lineWidth = 1
  context.strokeStyle = "rgba(255, 255, 255, 0.88)"
  context.beginPath()
  context.arc(center, center, radius - 2.25, 0, Math.PI * 2)
  context.stroke()
  context.restore()

  return context.getImageData(0, 0, size, size)
}

function createSoftShadowImage(size: number, radius: number, opacity = 0.2) {
  const canvas = createSizedCanvas(size)
  const context = getCanvasContext(canvas)
  if (!context) return null

  const center = size / 2
  context.clearRect(0, 0, size, size)
  context.save()
  context.shadowColor = `rgba(15, 23, 42, ${opacity})`
  context.shadowBlur = 10
  context.shadowOffsetY = 3
  context.fillStyle = `rgba(15, 23, 42, ${opacity * 0.46})`
  context.beginPath()
  context.arc(center, center - 1, radius, 0, Math.PI * 2)
  context.fill()
  context.restore()

  return context.getImageData(0, 0, size, size)
}

export function ensurePublicMapBadgeImages(map: mapboxgl.Map) {
  const badges = [
    [PUBLIC_MAP_CLUSTER_BADGE_SMALL_KEY, 68],
    [PUBLIC_MAP_CLUSTER_BADGE_MEDIUM_KEY, 80],
    [PUBLIC_MAP_CLUSTER_BADGE_LARGE_KEY, 96],
  ] as const
  const shadows = [
    [PUBLIC_MAP_CLUSTER_BADGE_SHADOW_SMALL_KEY, 76, 28],
    [PUBLIC_MAP_CLUSTER_BADGE_SHADOW_MEDIUM_KEY, 88, 34],
    [PUBLIC_MAP_CLUSTER_BADGE_SHADOW_LARGE_KEY, 104, 42],
  ] as const

  for (const [key, size] of badges) {
    const image = createClusterBadgeImage(size)
    if (image) {
      addImageSafely({ map, key, image })
    }
  }

  for (const [key, size, radius] of shadows) {
    const image = createSoftShadowImage(size, radius)
    if (image) {
      addImageSafely({ map, key, image })
    }
  }

  const pointShadow = createSoftShadowImage(POINT_SHADOW_CANVAS_SIZE, 22, 0.18)
  if (pointShadow) {
    addImageSafely({
      map,
      key: PUBLIC_MAP_POINT_SHADOW_KEY,
      image: pointShadow,
    })
  }
}

export function ensurePublicMapFallbackMarkerImages(map: mapboxgl.Map) {
  ensurePublicMapBadgeImages(map)

  const fallback = createFallbackMarkerImage({ label: "CH", selected: false })
  if (fallback) {
    addImageSafely({
      map,
      key: PUBLIC_MAP_MARKER_IMAGE_FALLBACK_KEY,
      image: fallback,
    })
  }

  const selectedFallback = createFallbackMarkerImage({ label: "CH", selected: true })
  if (selectedFallback) {
    addImageSafely({
      map,
      key: PUBLIC_MAP_MARKER_IMAGE_SELECTED_FALLBACK_KEY,
      image: selectedFallback,
    })
  }
}

export function registerPublicMapStyleImageMissingHandler(map: mapboxgl.Map) {
  const handler = (event: { id?: string }) => {
    if (
      event.id?.startsWith("public-map-marker-") ||
      event.id?.startsWith("cluster-badge") ||
      event.id === PUBLIC_MAP_POINT_SHADOW_KEY
    ) {
      ensurePublicMapFallbackMarkerImages(map)
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
}: {
  map: mapboxgl.Map
  features: PublicMapFeatureCollection["features"]
  onImagesChanged?: () => void
}) {
  ensurePublicMapFallbackMarkerImages(map)
  const loads: Array<Promise<PublicMapMarkerImageLoadResult>> = []

  for (const feature of features) {
    if ("cluster" in feature.properties) continue

    const { markerImageKey, markerImageUrl, name } = feature.properties
    if (mapHasImage(map, markerImageKey) && mapHasImage(map, `${markerImageKey}-selected`)) {
      touchMarkerImageStatus(markerImageKey, "ready")
      continue
    }
    if (markerImageStatusByKey.get(markerImageKey) === "loading") continue

    touchMarkerImageStatus(markerImageKey, "loading")
    const load = markerImageUrl
      ? createRemoteMarkerImage({
          imageUrl: markerImageUrl,
          fallbackLabel: name,
          selected: false,
        })
      : Promise.resolve(createFallbackMarkerImage({ label: name, selected: false }))
    const selectedLoad = markerImageUrl
      ? createRemoteMarkerImage({
          imageUrl: markerImageUrl,
          fallbackLabel: name,
          selected: true,
        })
      : Promise.resolve(createFallbackMarkerImage({ label: name, selected: true }))

    const markerLoad = Promise.all([load, selectedLoad])
      .then(([image, selectedImage]) => {
        if (!image || !selectedImage) throw new Error("Marker image decode failed.")
        const added = addImageSafely({ map, key: markerImageKey, image })
        const selectedAdded = addImageSafely({
          map,
          key: `${markerImageKey}-selected`,
          image: selectedImage,
        })
        const ready = added && selectedAdded
        touchMarkerImageStatus(markerImageKey, ready ? "ready" : "failed")
        if (ready) {
          onImagesChanged?.()
        }
        return {
          key: markerImageKey,
          status: ready ? "ready" : "failed",
          changed: ready,
        } satisfies PublicMapMarkerImageLoadResult
      })
      .catch(() => {
        const image = createFallbackMarkerImage({ label: name, selected: false })
        const selectedImage = createFallbackMarkerImage({ label: name, selected: true })
        if (image) addImageSafely({ map, key: markerImageKey, image })
        if (selectedImage) {
          addImageSafely({
            map,
            key: `${markerImageKey}-selected`,
            image: selectedImage,
          })
        }
        touchMarkerImageStatus(markerImageKey, "failed")
        return {
          key: markerImageKey,
          status: "failed",
          changed: false,
        } satisfies PublicMapMarkerImageLoadResult
      })
    loads.push(markerLoad)
  }

  return loads
}
