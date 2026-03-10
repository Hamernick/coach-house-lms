import type { PdfPageLike, PdfRenderTaskLike, PdfViewportLike } from "./use-deck-canvas-renderer-types"

type CanvasDimensions = { width: number; height: number }

type CanvasPositioning = {
  top: string
  left: string
  transform: string
}

export function applyCanvasStyles(
  canvas: HTMLCanvasElement,
  dimensions: CanvasDimensions,
  positioning?: CanvasPositioning,
) {
  canvas.width = dimensions.width
  canvas.height = dimensions.height
  canvas.style.width = `${dimensions.width}px`
  canvas.style.height = `${dimensions.height}px`
  canvas.style.position = "absolute"
  canvas.style.top = positioning?.top ?? "50%"
  canvas.style.left = positioning?.left ?? "50%"
  canvas.style.transform = positioning?.transform ?? "translate(-50%, -50%)"
  canvas.style.borderRadius = "inherit"
  canvas.style.pointerEvents = "none"
}

export function resolveCoverViewport({
  pdfPage,
  targetHeight,
  targetWidth,
}: {
  pdfPage: PdfPageLike
  targetHeight: number
  targetWidth: number
}): PdfViewportLike {
  const baseViewport = pdfPage.getViewport({ scale: 1 })
  const coverScale = Math.max(
    targetHeight / baseViewport.height,
    targetWidth / baseViewport.width,
  )
  return pdfPage.getViewport({ scale: coverScale })
}

export function clearRenderCache(cache: Map<number, ImageBitmap>) {
  for (const bitmap of cache.values()) {
    try {
      bitmap.close()
    } catch {
      // ignore cleanup errors
    }
  }
  cache.clear()
}

export function cancelRenderTask(task: PdfRenderTaskLike | null) {
  if (!task?.cancel) return
  try {
    task.cancel()
  } catch {
    // ignore cancelled render errors
  }
}
