import type {
  PublicMapClusterSignature,
  PublicMapClusterSpriteInput,
  PublicMapClusterSpriteResult,
} from "./public-map-cluster-sprites"

const PUBLIC_MAP_CLUSTER_SPRITE_PIXEL_RATIO = 2
const PUBLIC_MAP_CLUSTER_FALLBACK_COLORS = [
  "#0A84FF",
  "#34C759",
  "#AF52DE",
  "#FF9F0A",
] as const

export function buildPublicMapClusterSprite({
  signature,
  avatarBitmaps = [],
}: PublicMapClusterSpriteInput): PublicMapClusterSpriteResult | null {
  const canvas = createClusterSpriteCanvas(signature.tier.size)
  const context = getClusterSpriteContext(canvas)
  if (!context) return null

  const scale = PUBLIC_MAP_CLUSTER_SPRITE_PIXEL_RATIO
  const canvasSize = signature.tier.size * scale
  context.clearRect(0, 0, canvasSize, canvasSize)
  context.scale(scale, scale)

  drawClusterChrome({ context, size: signature.tier.size })
  drawClusterAvatars({ context, signature, avatarBitmaps })

  if (signature.overflowCount > 0) {
    drawClusterOverflowBadge({
      context,
      overflowCount: signature.overflowCount,
      size: signature.tier.size,
    })
  }

  const image = context.getImageData(0, 0, canvasSize, canvasSize)
  return {
    image,
    key: signature.imageId,
    pixelRatio: PUBLIC_MAP_CLUSTER_SPRITE_PIXEL_RATIO,
    size: signature.tier.size,
  }
}

function createClusterSpriteCanvas(size: number) {
  const canvasSize = size * PUBLIC_MAP_CLUSTER_SPRITE_PIXEL_RATIO
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(canvasSize, canvasSize)
  }
  const canvas = document.createElement("canvas")
  canvas.width = canvasSize
  canvas.height = canvasSize
  return canvas
}

function getClusterSpriteContext(canvas: HTMLCanvasElement | OffscreenCanvas) {
  return canvas.getContext("2d", { willReadFrequently: true })
}

function drawClusterChrome({
  context,
  size,
}: {
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
  size: number
}) {
  const center = size / 2
  const radius = center - 2

  context.save()
  context.shadowColor = "rgba(0, 0, 0, 0.2)"
  context.shadowBlur = 3
  context.shadowOffsetY = 1
  context.fillStyle = "#FFFFFF"
  context.beginPath()
  context.arc(center, center, radius, 0, Math.PI * 2)
  context.fill()
  context.restore()

  context.save()
  context.strokeStyle = "rgba(0, 0, 0, 0.08)"
  context.lineWidth = 1
  context.beginPath()
  context.arc(center, center, radius, 0, Math.PI * 2)
  context.stroke()
  context.restore()
}

function drawClusterAvatars({
  context,
  signature,
  avatarBitmaps,
}: {
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
  signature: PublicMapClusterSignature
  avatarBitmaps: ImageBitmap[]
}) {
  const layout = resolveClusterAvatarLayout(signature)

  for (let index = 0; index < layout.length; index += 1) {
    const slot = layout[index]!
    const bitmap = avatarBitmaps[index] ?? null
    context.save()
    context.beginPath()
    context.arc(slot.x, slot.y, slot.radius, 0, Math.PI * 2)
    context.clip()

    if (bitmap) {
      drawClusterAvatarBitmap({ context, bitmap, slot })
    } else {
      drawClusterFallbackAvatar({ context, index, slot })
    }
    context.restore()

    context.save()
    context.strokeStyle = "#FFFFFF"
    context.lineWidth = 1.5
    context.beginPath()
    context.arc(slot.x, slot.y, slot.radius, 0, Math.PI * 2)
    context.stroke()
    context.restore()
  }
}

function resolveClusterAvatarLayout(signature: PublicMapClusterSignature) {
  const size = signature.tier.size
  const center = size / 2
  const visibleCount = Math.max(1, signature.visibleImageKeys.length)

  if (visibleCount === 1) {
    return [{ x: center, y: center, radius: size * 0.31 }]
  }

  if (visibleCount === 2) {
    return [
      { x: size * 0.38, y: center, radius: size * 0.24 },
      { x: size * 0.62, y: center, radius: size * 0.24 },
    ]
  }

  if (visibleCount === 3) {
    return [
      { x: center, y: size * 0.36, radius: size * 0.22 },
      { x: size * 0.37, y: size * 0.61, radius: size * 0.22 },
      { x: size * 0.63, y: size * 0.61, radius: size * 0.22 },
    ]
  }

  return [
    { x: size * 0.38, y: size * 0.38, radius: size * 0.19 },
    { x: size * 0.62, y: size * 0.38, radius: size * 0.19 },
    { x: size * 0.38, y: size * 0.62, radius: size * 0.19 },
    { x: size * 0.62, y: size * 0.62, radius: size * 0.19 },
  ]
}

function drawClusterAvatarBitmap({
  context,
  bitmap,
  slot,
}: {
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
  bitmap: ImageBitmap
  slot: { x: number; y: number; radius: number }
}) {
  const sourceSize = Math.min(bitmap.width, bitmap.height)
  const sourceX = Math.max(0, (bitmap.width - sourceSize) / 2)
  const sourceY = Math.max(0, (bitmap.height - sourceSize) / 2)
  const targetSize = slot.radius * 2
  context.drawImage(
    bitmap,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    slot.x - slot.radius,
    slot.y - slot.radius,
    targetSize,
    targetSize,
  )
}

function drawClusterFallbackAvatar({
  context,
  index,
  slot,
}: {
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
  index: number
  slot: { x: number; y: number; radius: number }
}) {
  context.fillStyle =
    PUBLIC_MAP_CLUSTER_FALLBACK_COLORS[index % PUBLIC_MAP_CLUSTER_FALLBACK_COLORS.length]
  context.fillRect(
    slot.x - slot.radius,
    slot.y - slot.radius,
    slot.radius * 2,
    slot.radius * 2,
  )
}

function drawClusterOverflowBadge({
  context,
  overflowCount,
  size,
}: {
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
  overflowCount: number
  size: number
}) {
  const label = `+${overflowCount.toLocaleString("en-US")}`
  const height = Math.max(12, Math.round(size * 0.31))
  const width = Math.min(size - 8, Math.max(height, 7 + label.length * 5.2))
  const x = size - width - 1.5
  const y = size - height - 1.5
  const radius = height / 2

  drawRoundedRect({ context, x, y, width, height, radius })
  context.fillStyle = "rgba(28, 28, 30, 0.92)"
  context.fill()

  context.fillStyle = "#FFFFFF"
  context.font = `700 ${Math.max(8, Math.round(size * 0.2))}px -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif`
  context.textAlign = "center"
  context.textBaseline = "middle"
  context.fillText(label, x + width / 2, y + height / 2 + 0.25)
}

function drawRoundedRect({
  context,
  x,
  y,
  width,
  height,
  radius,
}: {
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
  x: number
  y: number
  width: number
  height: number
  radius: number
}) {
  const boundedRadius = Math.min(radius, width / 2, height / 2)
  context.beginPath()
  context.moveTo(x + boundedRadius, y)
  context.lineTo(x + width - boundedRadius, y)
  context.quadraticCurveTo(x + width, y, x + width, y + boundedRadius)
  context.lineTo(x + width, y + height - boundedRadius)
  context.quadraticCurveTo(x + width, y + height, x + width - boundedRadius, y + height)
  context.lineTo(x + boundedRadius, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - boundedRadius)
  context.lineTo(x, y + boundedRadius)
  context.quadraticCurveTo(x, y, x + boundedRadius, y)
  context.closePath()
}
