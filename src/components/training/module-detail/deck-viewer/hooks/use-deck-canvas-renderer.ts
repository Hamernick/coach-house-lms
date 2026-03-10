"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"

import { useDeckDocumentLoader } from "./use-deck-document-loader"
import {
  applyCanvasStyles,
  cancelRenderTask,
  clearRenderCache as clearRenderCacheMap,
  resolveCoverViewport,
} from "./use-deck-canvas-renderer-helpers"
import type {
  PdfDocumentLike,
  PdfRenderTaskLike,
  UseDeckCanvasRendererArgs,
  UseDeckCanvasRendererResult,
} from "./use-deck-canvas-renderer-types"

export function useDeckCanvasRenderer({
  deckUrl,
  showPreviewTrigger,
  viewerActive,
  page,
  pageCount,
  setPage,
  setPageCount,
}: UseDeckCanvasRendererArgs): UseDeckCanvasRendererResult {
  const [loadingDoc, setLoadingDoc] = useState(true)
  const [isRendering, setIsRendering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [supportsCanvas, setSupportsCanvas] = useState(true)
  const [previewReady, setPreviewReady] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const previewContainerRef = useRef<HTMLDivElement>(null)

  const pdfRef = useRef<PdfDocumentLike | null>(null)
  const renderTaskRef = useRef<PdfRenderTaskLike | null>(null)
  const renderCacheRef = useRef<Map<number, ImageBitmap>>(new Map())
  const preloadingRef = useRef<Set<number>>(new Set())

  const clearRenderCache = useCallback(() => {
    clearRenderCacheMap(renderCacheRef.current)
  }, [])

  useEffect(() => {
    clearRenderCache()
    preloadingRef.current.clear()
    pdfRef.current = null
    setPage(1)
    setPageCount(null)
    setError(null)
    setSupportsCanvas(true)
    setPreviewReady(false)
    setPreviewError(null)
  }, [clearRenderCache, deckUrl, setPage, setPageCount])

  useEffect(() => {
    return () => {
      clearRenderCache()
      cancelRenderTask(renderTaskRef.current)
    }
  }, [clearRenderCache])

  const renderPage = useCallback(async () => {
    if (!supportsCanvas) return

    const pdfDoc = pdfRef.current
    const canvas = canvasRef.current
    const container = viewportRef.current ?? containerRef.current
    if (!pdfDoc || !canvas || !container) return

    const cachedBitmap = renderCacheRef.current.get(page)
    if (cachedBitmap) {
      const context = canvas.getContext("2d")
      if (context) {
        const containerWidth = container.clientWidth || cachedBitmap.width
        const containerHeight = container.clientHeight || cachedBitmap.height
        applyCanvasStyles(canvas, { width: containerWidth, height: containerHeight })
        context.clearRect(0, 0, canvas.width, canvas.height)
        context.drawImage(cachedBitmap, 0, 0, canvas.width, canvas.height)
      }
      setIsRendering(false)
      setError(null)
      return
    }

    let task: PdfRenderTaskLike | null = null
    try {
      setIsRendering(true)
      const pdfPage = await pdfDoc.getPage(page)
      const baseViewport = pdfPage.getViewport({ scale: 1 })
      const targetHeight = container.clientHeight || baseViewport.height
      const targetWidth = container.clientWidth || baseViewport.width
      const viewport = resolveCoverViewport({
        pdfPage,
        targetHeight,
        targetWidth,
      })
      const context = canvas.getContext("2d")
      if (!context) {
        throw new Error("Canvas context unavailable")
      }

      applyCanvasStyles(canvas, {
        width: viewport.width,
        height: viewport.height,
      })
      canvas.style.opacity = "1"
      canvas.style.transition = ""
      canvas.style.willChange = "auto"

      cancelRenderTask(renderTaskRef.current)

      task = pdfPage.render({ canvasContext: context, viewport })
      renderTaskRef.current = task
      await task.promise

      const bitmap = await createImageBitmap(canvas)
      renderCacheRef.current.set(page, bitmap)
      setError(null)
    } catch (renderError: any) {
      if (renderError?.name === "RenderingCancelledException") {
        return
      }
      console.error("Failed to render slide", renderError)
      setError("Unable to render slide")
    } finally {
      if (renderTaskRef.current === task) {
        renderTaskRef.current = null
      }
      setIsRendering(false)
    }
  }, [page, supportsCanvas])

  const renderPreview = useCallback(async () => {
    if (!supportsCanvas) return

    const pdfDoc = pdfRef.current
    const canvas = previewCanvasRef.current
    const container = previewContainerRef.current
    if (!pdfDoc || !canvas || !container) return

    try {
      setPreviewError(null)
      const pdfPage = await pdfDoc.getPage(1)
      const baseViewport = pdfPage.getViewport({ scale: 1 })
      const targetHeight = container.clientHeight || baseViewport.height
      const targetWidth = container.clientWidth || baseViewport.width
      const viewport = resolveCoverViewport({
        pdfPage,
        targetHeight,
        targetWidth,
      })
      const context = canvas.getContext("2d")
      if (!context) return

      const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
      canvas.width = Math.max(1, Math.floor(viewport.width * dpr))
      canvas.height = Math.max(1, Math.floor(viewport.height * dpr))
      canvas.style.width = `${targetWidth}px`
      canvas.style.height = `${targetHeight}px`
      canvas.style.position = "absolute"
      canvas.style.top = "0"
      canvas.style.left = "0"
      canvas.style.transform = ""
      canvas.style.borderRadius = "inherit"
      canvas.style.pointerEvents = "none"
      context.clearRect(0, 0, canvas.width, canvas.height)
      if (dpr !== 1) {
        context.scale(dpr, dpr)
      }
      await pdfPage.render({ canvasContext: context, viewport }).promise
      setPreviewReady(true)
    } catch (previewRenderError) {
      console.error("Failed to render deck preview", previewRenderError)
      setPreviewError("Unable to render preview")
      setPreviewReady(false)
    }
  }, [supportsCanvas])

  useEffect(() => {
    if (!supportsCanvas || !pdfRef.current || !viewerActive) return
    void renderPage()
  }, [pageCount, renderPage, supportsCanvas, viewerActive])

  const preloadPage = useCallback(
    async (targetPage: number) => {
      if (!pdfRef.current || targetPage < 1 || (pageCount && targetPage > pageCount)) {
        return
      }
      if (renderCacheRef.current.has(targetPage) || preloadingRef.current.has(targetPage)) {
        return
      }

      preloadingRef.current.add(targetPage)
      try {
        const pdfPage = await pdfRef.current.getPage(targetPage)
        const viewport = pdfPage.getViewport({ scale: 1 })
        const preloadCanvas = document.createElement("canvas")
        preloadCanvas.width = viewport.width
        preloadCanvas.height = viewport.height
        const context = preloadCanvas.getContext("2d")
        if (!context) return

        await pdfPage.render({ canvasContext: context, viewport }).promise
        const bitmap = await createImageBitmap(preloadCanvas)
        renderCacheRef.current.set(targetPage, bitmap)
      } catch (preloadError) {
        console.error("Failed to preload slide", preloadError)
      } finally {
        preloadingRef.current.delete(targetPage)
      }
    },
    [pageCount],
  )

  useEffect(() => {
    if (!viewerActive) return
    void preloadPage(page + 1)
    void preloadPage(page - 1)
  }, [page, preloadPage, viewerActive])

  useEffect(() => {
    if (!viewerActive) return

    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            void renderPage()
          })
        : null

    if (observer && containerRef.current) {
      observer.observe(containerRef.current)
      return () => observer.disconnect()
    }

    const handleResize = () => void renderPage()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [renderPage, viewerActive])

  useDeckDocumentLoader({
    deckUrl,
    showPreviewTrigger,
    viewerActive,
    renderPage,
    renderPreview,
    setLoadingDoc,
    setError,
    setSupportsCanvas,
    setPageCount,
    pdfRef,
  })

  useEffect(() => {
    if (!deckUrl || !supportsCanvas || !pdfRef.current || !showPreviewTrigger) return
    if (previewReady || previewError) return
    void renderPreview()
  }, [deckUrl, previewError, previewReady, renderPreview, showPreviewTrigger, supportsCanvas])

  useEffect(() => {
    if (!supportsCanvas && deckUrl && showPreviewTrigger) {
      setPreviewError("Preview unavailable")
      setPreviewReady(false)
    }
  }, [deckUrl, showPreviewTrigger, supportsCanvas])

  return {
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
    hasCacheForPage: renderCacheRef.current.has(page),
  }
}
