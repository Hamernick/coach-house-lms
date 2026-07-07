type MarkerShapeContext =
  | CanvasRenderingContext2D
  | OffscreenCanvasRenderingContext2D

export function drawPublicMapRoundedRect({
  context,
  x,
  y,
  width,
  height,
  radius,
}: {
  context: MarkerShapeContext
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
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - boundedRadius,
    y + height
  )
  context.lineTo(x + boundedRadius, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - boundedRadius)
  context.lineTo(x, y + boundedRadius)
  context.quadraticCurveTo(x, y, x + boundedRadius, y)
  context.closePath()
}
