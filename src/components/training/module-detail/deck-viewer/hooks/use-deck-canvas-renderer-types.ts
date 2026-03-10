import type { Dispatch, RefObject, SetStateAction } from "react"

export type PdfViewportLike = {
  width: number
  height: number
}

export type PdfRenderTaskLike = {
  promise: Promise<void>
  cancel?: () => void
}

export type PdfPageLike = {
  getViewport: (args: { scale: number }) => PdfViewportLike
  render: (args: {
    canvasContext: CanvasRenderingContext2D
    viewport: PdfViewportLike
  }) => PdfRenderTaskLike
}

export type PdfDocumentLike = {
  getPage: (pageNumber: number) => Promise<PdfPageLike>
}

export type UseDeckCanvasRendererArgs = {
  deckUrl: string | null
  showPreviewTrigger: boolean
  viewerActive: boolean
  page: number
  pageCount: number | null
  setPage: Dispatch<SetStateAction<number>>
  setPageCount: Dispatch<SetStateAction<number | null>>
}

export type UseDeckCanvasRendererResult = {
  loadingDoc: boolean
  isRendering: boolean
  error: string | null
  supportsCanvas: boolean
  previewReady: boolean
  previewError: string | null
  canvasRef: RefObject<HTMLCanvasElement | null>
  previewCanvasRef: RefObject<HTMLCanvasElement | null>
  containerRef: RefObject<HTMLDivElement | null>
  viewportRef: RefObject<HTMLDivElement | null>
  previewContainerRef: RefObject<HTMLDivElement | null>
  hasCacheForPage: boolean
}
