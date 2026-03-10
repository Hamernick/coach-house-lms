"use client"

import React, { useState } from "react"

import {
  DeckDialogShell,
  DeckPreviewCanvas,
  DeckPreviewTrigger,
  DeckUnavailableState,
} from "./deck-viewer/components"
import { DECK_SWIPE_THRESHOLD } from "./deck-viewer/constants"
import {
  useDeckCanvasRenderer,
  useDeckGestures,
  useDeckKeyboardNavigation,
  useDeckPageNavigation,
  useDeckSource,
} from "./deck-viewer/hooks"

type DeckViewerProps = {
  moduleId: string
  hasDeck?: boolean
  variant?: "card" | "frame"
  className?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  showPreviewTrigger?: boolean
  inlinePreview?: boolean
  shellActions?: React.ReactNode
  openExternally?: boolean
}

export function DeckViewer({
  moduleId,
  hasDeck = false,
  variant = "card",
  className,
  open,
  onOpenChange,
  showPreviewTrigger = true,
  inlinePreview = true,
  shellActions,
  openExternally = false,
}: DeckViewerProps) {
  const isFrame = variant === "frame"
  const { deckUrl, loadingUrl, fetchError, retry } = useDeckSource({ moduleId, hasDeck })
  const [pageCount, setPageCount] = useState<number | null>(null)
  const [internalDialogOpen, setInternalDialogOpen] = useState(false)
  const dialogOpen = open ?? internalDialogOpen
  const setDialogOpen = onOpenChange ?? setInternalDialogOpen
  const inlineViewer = inlinePreview && !showPreviewTrigger
  const viewerActive = dialogOpen || inlineViewer
  const { page, setPage, effectiveMaxPage, pageLabel, navigate } =
    useDeckPageNavigation(pageCount)
  const { handleTouchStart, handleTouchEnd, handleWheel } = useDeckGestures({
    swipeThreshold: DECK_SWIPE_THRESHOLD,
    onNavigate: navigate,
  })

  const {
    loadingDoc,
    isRendering,
    error,
    supportsCanvas,
    previewReady,
    previewError,
    canvasRef,
    previewCanvasRef,
    containerRef,
    viewportRef,
    previewContainerRef,
    hasCacheForPage,
  } = useDeckCanvasRenderer({
    deckUrl,
    showPreviewTrigger,
    viewerActive,
    page,
    pageCount,
    setPage,
    setPageCount,
  })

  const downloadUrl = `/api/modules/${moduleId}/deck`

  useDeckKeyboardNavigation({ navigate })

  if (!hasDeck) {
    return null
  }

  if (!deckUrl) {
    const message = loadingUrl ? "Loading deck..." : fetchError ?? "Deck unavailable"
    return (
      <DeckUnavailableState
        isFrame={isFrame}
        className={className}
        message={message}
        loadingUrl={loadingUrl}
        onRetry={retry}
      />
    )
  }

  const preview = (
    <DeckPreviewCanvas
      isFrame={isFrame}
      previewReady={previewReady}
      previewError={previewError}
      previewCanvasRef={previewCanvasRef}
      previewContainerRef={previewContainerRef}
    />
  )

  const triggerButton = (
    <DeckPreviewTrigger
      isFrame={isFrame}
      className={className}
      pageCount={pageCount}
      preview={preview}
      openExternally={openExternally}
      deckUrl={deckUrl}
    />
  )

  if (openExternally) {
    return triggerButton
  }

  return (
    <DeckDialogShell
      dialogOpen={dialogOpen}
      setDialogOpen={setDialogOpen}
      showPreviewTrigger={showPreviewTrigger}
      triggerButton={triggerButton}
      inlineViewer={inlineViewer}
      className={className}
      page={page}
      pageCount={pageCount}
      maxPage={effectiveMaxPage}
      pageLabel={pageLabel}
      loadingDoc={loadingDoc}
      isRendering={isRendering}
      error={error}
      supportsCanvas={supportsCanvas}
      onNavigate={navigate}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      canvasRef={canvasRef}
      containerRef={containerRef}
      viewportRef={viewportRef}
      deckUrl={deckUrl}
      downloadUrl={downloadUrl}
      hasCacheForPage={hasCacheForPage}
      shellActions={shellActions}
    />
  )
}
