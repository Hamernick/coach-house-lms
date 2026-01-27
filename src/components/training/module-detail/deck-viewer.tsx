"use client"

import React, { useCallback, useEffect, useRef, useState, type TouchEvent } from "react"
import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right"
import X from "lucide-react/dist/esm/icons/x"

import { DeckPresentation } from "./deck-viewer/view"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

const DECK_SWIPE_THRESHOLD = 45
const PDF_JS_SRC = "/vendor/pdfjs/pdf.min.js"
const PDF_JS_WORKER_SRC = "/vendor/pdfjs/pdf.worker.min.js"

declare global {
  interface Window {
    pdfjsLib?: {
      GlobalWorkerOptions: { workerSrc: string }
      getDocument: (params: { url: string }) => { promise: Promise<any> }
    }
  }
}

let pdfJsLoaderPromise: Promise<any | null> | null = null

async function loadPdfJs() {
  if (typeof window === "undefined") {
    return null
  }
  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_JS_WORKER_SRC
    return window.pdfjsLib
  }
  if (!pdfJsLoaderPromise) {
    pdfJsLoaderPromise = new Promise((resolve) => {
      const handleReady = () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_JS_WORKER_SRC
          resolve(window.pdfjsLib)
        } else {
          pdfJsLoaderPromise = null
          resolve(null)
        }
      }

      const handleError = () => {
        pdfJsLoaderPromise = null
        resolve(null)
      }

      const existing = document.querySelector<HTMLScriptElement>(`script[src="${PDF_JS_SRC}"]`)
      if (existing) {
        existing.addEventListener("load", handleReady, { once: true })
        existing.addEventListener("error", handleError, { once: true })
        return
      }

      const script = document.createElement("script")
      script.src = PDF_JS_SRC
      // pdf.min.js references import.meta, so load it as an ES module to avoid syntax errors in classic scripts.
      script.type = "module"
      script.async = true
      script.addEventListener("load", handleReady, { once: true })
      script.addEventListener("error", handleError, { once: true })
      document.head.appendChild(script)
    })
  }
  return pdfJsLoaderPromise
}

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
  const [deckUrl, setDeckUrl] = useState<string | null>(null)
  const [loadingUrl, setLoadingUrl] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const [page, setPage] = useState(1)
  const [pageCount, setPageCount] = useState<number | null>(null)
  const [loadingDoc, setLoadingDoc] = useState(true)
  const [isRendering, setIsRendering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [supportsCanvas, setSupportsCanvas] = useState(true)
  const [internalDialogOpen, setInternalDialogOpen] = useState(false)
  const [previewReady, setPreviewReady] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const touchStart = useRef<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const previewContainerRef = useRef<HTMLDivElement>(null)
  const pdfRef = useRef<any>(null)
  const renderTaskRef = useRef<any>(null)
  const renderCacheRef = useRef<Map<number, ImageBitmap>>(new Map())
  const preloadingRef = useRef<Set<number>>(new Set())

  const dialogOpen = open ?? internalDialogOpen
  const setDialogOpen = onOpenChange ?? setInternalDialogOpen
  const inlineViewer = inlinePreview && !showPreviewTrigger
  const viewerActive = dialogOpen || inlineViewer

  const downloadUrl = `/api/modules/${moduleId}/deck`

  useEffect(() => {
    if (!hasDeck) {
      setDeckUrl(null)
      setFetchError(null)
      setLoadingUrl(false)
      return
    }

    let cancelled = false
    const controller = new AbortController()

    setLoadingUrl(true)
    setFetchError(null)
    setDeckUrl(null)

    fetch(`/api/modules/${moduleId}/deck?format=json`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json().catch(() => null)
          throw new Error(typeof data?.error === "string" ? data.error : "Deck unavailable")
        }
        return response.json()
      })
      .then((data) => {
        if (cancelled) return
        if (typeof data?.url === "string" && data.url.length > 0) {
          setDeckUrl(data.url)
        } else {
          setFetchError("Deck unavailable")
        }
      })
      .catch((err) => {
        if (cancelled || err?.name === "AbortError") return
        setFetchError(err?.message ?? "Deck unavailable")
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingUrl(false)
        }
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [moduleId, hasDeck, reloadToken])

  const clampPage = useCallback((value: number, max: number) => {
    return Math.max(1, Math.min(max, value))
  }, [])

  const effectiveMaxPage = pageCount ?? 1

  const navigate = useCallback(
    (delta: number) => {
      setPage((prev) => {
        const next = clampPage(prev + delta, effectiveMaxPage)
        return next === prev ? prev : next
      })
    },
    [clampPage, effectiveMaxPage],
  )

  useEffect(() => {
    setPage((prev) => clampPage(prev, effectiveMaxPage))
  }, [clampPage, effectiveMaxPage])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = (event.target as HTMLElement | null)?.closest(
        "input, textarea, [contenteditable=true]",
      )
      if (target) return
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        if (event.altKey) return
        const delta = event.key === "ArrowRight" ? 1 : -1
        event.preventDefault()
        navigate(delta)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [navigate])

  useEffect(() => {
    renderCacheRef.current.clear()
    preloadingRef.current.clear()
    pdfRef.current = null
    setPage(1)
    setPageCount(null)
    setError(null)
    setSupportsCanvas(true)
    setPreviewReady(false)
    setPreviewError(null)
  }, [deckUrl])

  const renderPage = useCallback(async () => {
    if (!supportsCanvas) {
      return
    }
    const pdfDoc = pdfRef.current
    const canvas = canvasRef.current
    const container = viewportRef.current ?? containerRef.current
    if (!pdfDoc || !canvas || !container) {
      return
    }

    const existing = renderCacheRef.current.get(page)
    if (existing) {
      const context = canvas.getContext("2d")
      if (context) {
        const containerWidth = container.clientWidth || existing.width
        const containerHeight = container.clientHeight || existing.height
        canvas.width = containerWidth
        canvas.height = containerHeight
        canvas.style.width = `${containerWidth}px`
        canvas.style.height = `${containerHeight}px`
        canvas.style.position = "absolute"
        canvas.style.top = "50%"
        canvas.style.left = "50%"
        canvas.style.transform = "translate(-50%, -50%)"
        canvas.style.borderRadius = "inherit"
        canvas.style.pointerEvents = "none"
        context.clearRect(0, 0, canvas.width, canvas.height)
        context.drawImage(existing, 0, 0, canvas.width, canvas.height)
      }
      setIsRendering(false)
      setError(null)
      return
    }

    let task: any | null = null
    try {
      setIsRendering(true)
      const pdfPage = await pdfDoc.getPage(page)
      const baseViewport = pdfPage.getViewport({ scale: 1 })
      const targetHeight = container.clientHeight || baseViewport.height
      const targetWidth = container.clientWidth || baseViewport.width
      const coverScale = Math.max(
        targetHeight / baseViewport.height,
        targetWidth / baseViewport.width,
      )
      const scale = coverScale
      const viewport = pdfPage.getViewport({ scale })
      const context = canvas.getContext("2d")
      if (!context) {
        throw new Error("Canvas context unavailable")
      }
      canvas.width = viewport.width
      canvas.height = viewport.height
      canvas.style.width = `${viewport.width}px`
      canvas.style.height = `${viewport.height}px`
      canvas.style.position = "absolute"
      canvas.style.top = "50%"
      canvas.style.left = "50%"
      canvas.style.transform = "translate(-50%, -50%)"
      canvas.style.borderRadius = "inherit"
      canvas.style.pointerEvents = "none"
      canvas.style.opacity = "1"
      canvas.style.transition = ""
      canvas.style.willChange = "auto"
      if (renderTaskRef.current?.cancel) {
        try {
          renderTaskRef.current.cancel()
        } catch {
          // ignore
        }
      }
      task = pdfPage.render({ canvasContext: context, viewport })
      renderTaskRef.current = task
      await task.promise
      const bitmap = await createImageBitmap(canvas)
      renderCacheRef.current.set(page, bitmap)
      setError(null)
    } catch (err: any) {
      if (err?.name === "RenderingCancelledException") {
        return
      }
      console.error("Failed to render slide", err)
      setError("Unable to render slide")
    } finally {
      if (renderTaskRef.current === task) {
        renderTaskRef.current = null
      }
      setIsRendering(false)
    }
  }, [page, supportsCanvas])

  const renderPreview = useCallback(async () => {
    if (!supportsCanvas) {
      return
    }
    const pdfDoc = pdfRef.current
    const canvas = previewCanvasRef.current
    const container = previewContainerRef.current
    if (!pdfDoc || !canvas || !container) {
      return
    }

    try {
      setPreviewError(null)
      const pdfPage = await pdfDoc.getPage(1)
      const baseViewport = pdfPage.getViewport({ scale: 1 })
      const targetHeight = container.clientHeight || baseViewport.height
      const targetWidth = container.clientWidth || baseViewport.width
      const coverScale = Math.max(
        targetHeight / baseViewport.height,
        targetWidth / baseViewport.width,
      )
      const viewport = pdfPage.getViewport({ scale: coverScale })
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
    } catch (err) {
      console.error("Failed to render deck preview", err)
      setPreviewError("Unable to render preview")
      setPreviewReady(false)
    }
  }, [supportsCanvas])

  useEffect(() => {
    if (!supportsCanvas || !pdfRef.current || !viewerActive) {
      return
    }
    void renderPage()
  }, [renderPage, supportsCanvas, pageCount, viewerActive])

  const preloadPage = useCallback(
    async (target: number) => {
      if (!pdfRef.current || target < 1 || (pageCount && target > pageCount)) {
        return
      }
      if (renderCacheRef.current.has(target) || preloadingRef.current.has(target)) {
        return
      }
      preloadingRef.current.add(target)
      try {
        const pdfPage = await pdfRef.current.getPage(target)
        const viewport = pdfPage.getViewport({ scale: 1 })
        const canvas = document.createElement("canvas")
        canvas.width = viewport.width
        canvas.height = viewport.height
        const context = canvas.getContext("2d")
        if (!context) return
        await pdfPage.render({ canvasContext: context, viewport }).promise
        const bitmap = await createImageBitmap(canvas)
        renderCacheRef.current.set(target, bitmap)
      } catch (err) {
        console.error("Failed to preload slide", err)
      } finally {
        preloadingRef.current.delete(target)
      }
    },
    [pageCount],
  )

  useEffect(() => {
    if (!viewerActive) {
      return
    }
    void preloadPage(page + 1)
    void preloadPage(page - 1)
  }, [page, preloadPage, viewerActive])

  useEffect(() => {
    if (!viewerActive) {
      return
    }
    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            void renderPage()
          })
        : null
    if (observer && containerRef.current) {
      observer.observe(containerRef.current)
    } else {
      const handler = () => void renderPage()
      window.addEventListener("resize", handler)
      return () => window.removeEventListener("resize", handler)
    }
    return () => {
      observer?.disconnect()
    }
  }, [renderPage, viewerActive])

  // Intentional one-time load; re-running would refetch the PDF on every page change.
  useEffect(() => {
    let cancelled = false
    const loadDocument = async () => {
      if (!deckUrl) {
        setLoadingDoc(false)
        return
      }
      try {
        setLoadingDoc(true)
        setError(null)
        const pdfjsLib = await loadPdfJs()
        if (!pdfjsLib || cancelled) {
          setSupportsCanvas(false)
          return
        }
        const instance = await pdfjsLib.getDocument({ url: deckUrl }).promise
        if (cancelled) return
        pdfRef.current = instance
        setPageCount(instance.numPages ?? null)
        if (showPreviewTrigger) {
          await renderPreview()
        }
        if (viewerActive) {
          await renderPage()
        }
      } catch (err) {
        console.error("Failed to load PDF deck", err)
        if (!cancelled) {
          setSupportsCanvas(false)
          setError("Unable to load deck preview")
        }
      } finally {
        if (!cancelled) {
          setLoadingDoc(false)
        }
      }
    }
    void loadDocument()
    return () => {
      cancelled = true
    }
  }, [deckUrl, renderPage, renderPreview, showPreviewTrigger, viewerActive])

  useEffect(() => {
    if (!deckUrl || !supportsCanvas || !pdfRef.current || !showPreviewTrigger) {
      return
    }
    if (previewReady || previewError) {
      return
    }
    void renderPreview()
  }, [deckUrl, supportsCanvas, previewReady, previewError, renderPreview, showPreviewTrigger])

  useEffect(() => {
  if (!supportsCanvas && deckUrl && showPreviewTrigger) {
    setPreviewError("Preview unavailable")
    setPreviewReady(false)
  }
  }, [supportsCanvas, deckUrl, showPreviewTrigger])

  const pageLabel = pageCount ? `${page}/${pageCount}` : `${page}/?`

  const handleTouchStart = useCallback((event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length > 0) {
      touchStart.current = event.touches[0].clientX
    }
  }, [])

  const handleTouchEnd = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (touchStart.current === null || event.changedTouches.length === 0) {
        touchStart.current = null
        return
      }
      const delta = event.changedTouches[0].clientX - touchStart.current
      touchStart.current = null
      if (Math.abs(delta) < DECK_SWIPE_THRESHOLD) {
        return
      }
      if (delta > 0) {
        navigate(-1)
      } else {
        navigate(1)
      }
    },
    [navigate],
  )

  const handleWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault()
  }, [])

  if (!hasDeck) {
    return null
  }

  if (!deckUrl) {
    const message = loadingUrl ? "Loading deck..." : fetchError ?? "Deck unavailable"
    if (isFrame) {
      return (
        <div className={`relative h-full w-full ${className ?? ""}`}>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center text-xs text-muted-foreground">
            <div className="h-10 w-10 rounded-full border border-border/60 bg-muted/50" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Slide deck</p>
              <p>{message}</p>
            </div>
            {!loadingUrl ? (
              <button
                type="button"
                onClick={() => setReloadToken((prev) => prev + 1)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
              >
                Retry <ArrowUpRight className="h-3 w-3" />
              </button>
            ) : null}
          </div>
        </div>
      )
    }
    return (
      <div className="w-full rounded-2xl border border-border/40 bg-card/80 p-3 shadow-sm">
        <div className="flex flex-col gap-3">
          <div className="aspect-[16/9] w-full overflow-hidden rounded-xl border border-border/40 bg-muted/50" />
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Slide deck</p>
            <p className="text-xs text-muted-foreground">{message}</p>
            {!loadingUrl ? (
              <button
                type="button"
                onClick={() => setReloadToken((prev) => prev + 1)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
              >
                Retry <ArrowUpRight className="h-3 w-3" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  const framePreviewClass = "flex-1 rounded-none border-0"
  const preview = (
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

  const triggerButton = (
    <button
      type="button"
      className={`group relative w-full text-left transition ${
        isFrame
          ? "h-full overflow-hidden rounded-2xl"
          : "rounded-2xl border border-border/40 bg-card/80 px-3 py-2.5 shadow-sm hover:shadow-md"
      } ${className ?? ""}`}
      onClick={
        openExternally && deckUrl
          ? (event) => {
              event.preventDefault()
              window.open(deckUrl!, "_blank", "noopener")
            }
          : undefined
      }
      disabled={openExternally && !deckUrl}
    >
      <div className={`flex flex-col gap-1.5 ${isFrame ? "h-full" : ""}`}>
        {preview}
        {!isFrame ? (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Slide deck</p>
            <p className="text-xs text-muted-foreground">
              {pageCount
                ? `${pageCount} slides · Open the full PDF for details.`
                : "Open the full PDF for details."}
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground transition group-hover:text-foreground">
              Open full deck <ArrowUpRight className="h-3 w-3" />
            </span>
          </div>
        ) : null}
      </div>
    </button>
  )

  if (openExternally) {
    return triggerButton
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {showPreviewTrigger ? <DialogTrigger asChild>{triggerButton}</DialogTrigger> : null}
      {inlineViewer ? (
        <DeckPresentation
          variant="inline"
          className={cn("h-full", className)}
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
          hasCacheForPage={renderCacheRef.current.has(page)}
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
          hasCacheForPage={renderCacheRef.current.has(page)}
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
