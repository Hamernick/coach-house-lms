"use client"

import React from "react"
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left"
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right"
import DownloadIcon from "lucide-react/dist/esm/icons/download"
import ExternalLink from "lucide-react/dist/esm/icons/external-link"
import Loader2 from "lucide-react/dist/esm/icons/loader-2"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type DeckPresentationProps = {
  page: number
  pageCount: number | null
  maxPage: number
  pageLabel: string
  loadingDoc: boolean
  isRendering: boolean
  error: string | null
  supportsCanvas: boolean
  shellActions?: React.ReactNode
  variant?: "dialog" | "inline"
  className?: string
  onNavigate: (delta: number) => void
  onTouchStart: React.TouchEventHandler<HTMLDivElement>
  onTouchEnd: React.TouchEventHandler<HTMLDivElement>
  onWheel: React.WheelEventHandler<HTMLDivElement>
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  containerRef: React.RefObject<HTMLDivElement | null>
  viewportRef: React.RefObject<HTMLDivElement | null>
  deckUrl: string
  downloadUrl: string
  hasCacheForPage: boolean
  closeControl?: React.ReactNode
}

export function DeckPresentation({
  page,
  pageCount,
  maxPage,
  pageLabel,
  loadingDoc,
  isRendering,
  error,
  supportsCanvas,
  shellActions,
  variant = "dialog",
  className,
  onNavigate,
  onTouchStart,
  onTouchEnd,
  onWheel,
  canvasRef,
  containerRef,
  viewportRef,
  deckUrl,
  downloadUrl,
  hasCacheForPage,
  closeControl,
}: DeckPresentationProps) {
  const [isDownloading, setIsDownloading] = React.useState(false)
  const [downloadError, setDownloadError] = React.useState<string | null>(null)
  const isInline = variant === "inline"

  const handleDownload = React.useCallback(async () => {
    if (isDownloading) return
    setDownloadError(null)
    setIsDownloading(true)
    try {
      const response = await fetch(downloadUrl)
      if (!response.ok) {
        throw new Error("Download failed")
      }
      const blob = await response.blob()
      const disposition = response.headers.get("content-disposition") ?? ""
      const match = disposition.match(/filename\\*?=([^;]+)/i)
      const filename = match ? match[1].replace(/(^UTF-8'')|['"]/g, "").trim() : "slide-deck.pdf"
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = objectUrl
      link.download = filename || "slide-deck.pdf"
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(objectUrl)
    } catch {
      setDownloadError("Download failed. Try again.")
    } finally {
      setIsDownloading(false)
    }
  }, [downloadUrl, isDownloading])

  const headerControls = (
    <div className="pointer-events-none absolute left-4 right-4 top-4 flex items-center justify-end gap-3">
      <div className="pointer-events-auto inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 shadow-sm ring-1 ring-border/40">
        {shellActions ? <div className="flex items-center gap-1">{shellActions}</div> : null}
        {shellActions ? <span className="mx-1 h-4 w-px bg-border/60" /> : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          aria-label="Download PDF"
          onClick={handleDownload}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <DownloadIcon className="h-4 w-4" />
          )}
        </Button>
        {closeControl}
      </div>
    </div>
  )

  const ControlsOverlay = (
    <>
      {headerControls}
      <div className="pointer-events-none absolute bottom-3 right-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <span className="inline-flex rounded-full bg-background/90 px-2 py-1 shadow-sm ring-1 ring-border/40">
          {pageLabel}
        </span>
      </div>

      <div className="pointer-events-none absolute left-1/2 bottom-4 -translate-x-1/2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <div className="pointer-events-auto inline-flex items-center gap-1 rounded-full bg-background/90 px-1 py-1 shadow-sm ring-1 ring-border/40">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Previous slide"
            disabled={page === 1 || loadingDoc || isRendering}
            onClick={() => onNavigate(-1)}
            className="h-9 w-9 rounded-full"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Next slide"
            disabled={page >= maxPage || loadingDoc || isRendering}
            onClick={() => onNavigate(1)}
            className="h-9 w-9 rounded-full"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {downloadError ? (
        <div className="pointer-events-none absolute right-4 top-16 flex justify-end">
          <span className="pointer-events-auto rounded-full bg-background/90 px-2 py-1 text-[11px] font-medium text-rose-500 shadow-sm ring-1 ring-border/40">
            {downloadError}
          </span>
        </div>
      ) : null}
    </>
  )

  const ViewerBody = (
    <div
      className={cn(
        "group relative w-full touch-pan-x overscroll-none overflow-hidden",
        isInline ? "h-full rounded-none border-0 bg-transparent shadow-none" : "rounded-2xl border border-border/40 bg-card/80 shadow-lg",
        className,
      )}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onWheel={onWheel}
      ref={containerRef}
      style={isInline ? { height: "100%" } : { aspectRatio: "16 / 9" }}
    >
      <div
        className="relative w-full"
        ref={viewportRef}
        style={isInline ? { height: "100%" } : { aspectRatio: "16 / 9" }}
      >
        <canvas
          ref={canvasRef}
          className={cn(
            "absolute inset-0 transition-opacity duration-150",
            isRendering && !hasCacheForPage ? "opacity-70" : "opacity-100",
          )}
        />
        {(loadingDoc || (isRendering && !hasCacheForPage)) && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            Loading slide…
          </div>
        )}
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 text-center text-sm text-muted-foreground">
            <p>{error}</p>
            <Button asChild size="sm">
              <a href={downloadUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" /> Open PDF
              </a>
            </Button>
          </div>
        ) : null}
      </div>
      {ControlsOverlay}
    </div>
  )

  if (!supportsCanvas) {
    return (
      <div
        className={cn(
          "relative w-full overflow-hidden",
          isInline ? "h-full rounded-none border-0 bg-transparent shadow-none" : "rounded-2xl border border-border/40 bg-card/80 shadow-sm",
          className,
        )}
        style={isInline ? { height: "100%" } : { aspectRatio: "16 / 9" }}
      >
        <iframe
          src={`${deckUrl}#page=${page}&view=FitH&toolbar=0&navpanes=0&scrollbar=0&statusbar=0`}
          title="Slide deck"
          className="h-full w-full border-0 bg-white"
          scrolling="no"
        />
        {ControlsOverlay}
      </div>
    )
  }

  return ViewerBody
}
