"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"

export function FiscalSponsorshipSignatureCanvas({
  disabled,
  onChange,
  value,
}: {
  disabled?: boolean
  onChange: (value: string) => void
  value: string
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const drawingRef = React.useRef(false)

  const configureCanvas = React.useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ratio = window.devicePixelRatio || 1
    const width = Math.max(canvas.clientWidth, 320)
    const height = 160
    canvas.width = width * ratio
    canvas.height = height * ratio
    const context = canvas.getContext("2d")
    if (!context) return
    context.scale(ratio, ratio)
    context.lineCap = "round"
    context.lineJoin = "round"
    context.lineWidth = 2
    context.strokeStyle = "#0f1421"

    if (value.startsWith("data:image/png;base64,")) {
      const image = new Image()
      image.onload = () => context.drawImage(image, 0, 0, width, height)
      image.src = value
    }
  }, [value])

  React.useEffect(() => {
    configureCanvas()
    window.addEventListener("resize", configureCanvas)
    return () => window.removeEventListener("resize", configureCanvas)
  }, [configureCanvas])

  function getPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const bounds = canvas.getBoundingClientRect()
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top }
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled) return
    const canvas = canvasRef.current
    const context = canvas?.getContext("2d")
    if (!canvas || !context) return
    canvas.setPointerCapture(event.pointerId)
    const point = getPoint(event)
    context.beginPath()
    context.moveTo(point.x, point.y)
    drawingRef.current = true
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current || disabled) return
    const context = canvasRef.current?.getContext("2d")
    if (!context) return
    const point = getPoint(event)
    context.lineTo(point.x, point.y)
    context.stroke()
  }

  function finishDrawing() {
    if (!drawingRef.current) return
    drawingRef.current = false
    const canvas = canvasRef.current
    if (canvas) onChange(canvas.toDataURL("image/png"))
  }

  function clear() {
    const canvas = canvasRef.current
    const context = canvas?.getContext("2d")
    if (!canvas || !context) return
    context.clearRect(0, 0, canvas.width, canvas.height)
    onChange("")
  }

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        aria-label="Drawn signature area. Use the typed signature tab if you need a keyboard-accessible alternative."
        className="border-input bg-background h-40 w-full touch-none rounded-lg border"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrawing}
        onPointerCancel={finishDrawing}
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs">
          Draw with a mouse, trackpad, or touch. Typed signature is the keyboard
          alternative.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || !value}
          onClick={clear}
        >
          Clear
        </Button>
      </div>
    </div>
  )
}
