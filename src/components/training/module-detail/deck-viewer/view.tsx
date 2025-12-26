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
  onNavigate: (delta: number) => void
  onTouchStart: React.TouchEventHandler<HTMLDivElement>
  onTouchEnd: React.TouchEventHandler<HTMLDivElement>
  onWheel: React.WheelEventHandler<HTMLDivElement>
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  containerRef: React.RefObject<HTMLDivElement | null>
  viewportRef: React.RefObject<HTMLDivElement | null>
  deckUrl: string
  hasCacheForPage: boolean
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
  onNavigate,
  onTouchStart,
  onTouchEnd,
  onWheel,
  canvasRef,
  containerRef,
  viewportRef,
  deckUrl,
  hasCacheForPage,
}: DeckPresentationProps) {
  const ControlsOverlay = (
    <>
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

      <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-background/90 px-2 py-1 shadow-sm ring-1 ring-border/40">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <a
              href={deckUrl}
              target="_blank"
              rel="noreferrer"
              download
              aria-label="Download PDF"
            >
              <DownloadIcon className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </>
  )

  const ViewerBody = (
    <div
      className="group relative w-full touch-pan-x overscroll-none overflow-hidden rounded-2xl border border-border/40 bg-card/80 shadow-sm"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onWheel={onWheel}
      ref={containerRef}
      style={{ aspectRatio: "16 / 9" }}
    >
      <div
        className="relative w-full"
        ref={viewportRef}
        style={{ aspectRatio: "16 / 9" }}
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
              <a href={deckUrl} target="_blank" rel="noreferrer">
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
        className="relative w-full overflow-hidden rounded-2xl border border-border/40 bg-card/80 shadow-sm"
        style={{ aspectRatio: "16 / 9" }}
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
