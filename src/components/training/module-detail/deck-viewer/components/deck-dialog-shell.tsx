import React from "react"
import X from "lucide-react/dist/esm/icons/x"

import { DeckPresentation } from "@/components/training/module-detail/deck-viewer/view"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type DeckDialogShellProps = {
  dialogOpen: boolean
  setDialogOpen: (open: boolean) => void
  showPreviewTrigger: boolean
  triggerButton: React.ReactNode
  inlineViewer: boolean
  className?: string
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
  downloadUrl: string
  hasCacheForPage: boolean
  shellActions?: React.ReactNode
}

export function DeckDialogShell({
  dialogOpen,
  setDialogOpen,
  showPreviewTrigger,
  triggerButton,
  inlineViewer,
  className,
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
  downloadUrl,
  hasCacheForPage,
  shellActions,
}: DeckDialogShellProps) {
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {showPreviewTrigger ? <DialogTrigger asChild>{triggerButton}</DialogTrigger> : null}
      {inlineViewer ? (
        <DeckPresentation
          variant="inline"
          className={cn("h-full", className)}
          page={page}
          pageCount={pageCount}
          maxPage={maxPage}
          pageLabel={pageLabel}
          loadingDoc={loadingDoc}
          isRendering={isRendering}
          error={error}
          supportsCanvas={supportsCanvas}
          onNavigate={onNavigate}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onWheel={onWheel}
          canvasRef={canvasRef}
          containerRef={containerRef}
          viewportRef={viewportRef}
          deckUrl={deckUrl}
          downloadUrl={downloadUrl}
          hasCacheForPage={hasCacheForPage}
        />
      ) : null}

      <DialogContent
        className="max-w-[min(94vw,1200px)] w-[min(94vw,1200px)] border-none bg-transparent p-0 shadow-none"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Slide deck</DialogTitle>
        <DeckPresentation
          page={page}
          pageCount={pageCount}
          maxPage={maxPage}
          pageLabel={pageLabel}
          loadingDoc={loadingDoc}
          isRendering={isRendering}
          error={error}
          supportsCanvas={supportsCanvas}
          onNavigate={onNavigate}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onWheel={onWheel}
          canvasRef={canvasRef}
          containerRef={containerRef}
          viewportRef={viewportRef}
          deckUrl={deckUrl}
          downloadUrl={downloadUrl}
          hasCacheForPage={hasCacheForPage}
          shellActions={shellActions}
          closeControl={
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                aria-label="Close deck"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          }
        />
      </DialogContent>
    </Dialog>
  )
}
