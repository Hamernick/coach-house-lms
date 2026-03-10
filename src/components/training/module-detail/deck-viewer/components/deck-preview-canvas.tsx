import type { RefObject } from "react"

type DeckPreviewCanvasProps = {
  isFrame: boolean
  previewReady: boolean
  previewError: string | null
  previewCanvasRef: RefObject<HTMLCanvasElement | null>
  previewContainerRef: RefObject<HTMLDivElement | null>
}

export function DeckPreviewCanvas({
  isFrame,
  previewReady,
  previewError,
  previewCanvasRef,
  previewContainerRef,
}: DeckPreviewCanvasProps) {
  const framePreviewClass = "flex-1 rounded-none border-0"

  return (
    <div
      ref={previewContainerRef}
      className={`relative w-full overflow-hidden bg-muted/40 ${
        isFrame ? framePreviewClass : "aspect-[16/9] rounded-xl border border-border/40"
      }`}
    >
      <div
        className={`absolute inset-0 rounded-xl bg-muted/30 animate-pulse transition-opacity ${
          previewReady || previewError ? "opacity-0" : "opacity-100"
        }`}
        aria-hidden
      />
      <canvas ref={previewCanvasRef} className="absolute inset-0" />
      {!previewReady && !previewError ? (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
          Loading preview…
        </div>
      ) : null}
      {previewError ? (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
          Preview unavailable
        </div>
      ) : null}
    </div>
  )
}
