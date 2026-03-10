import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from "react"

import { loadPdfJs } from "@/components/training/module-detail/deck-viewer/helpers"
import type { PdfDocumentLike } from "./use-deck-canvas-renderer-types"

type UseDeckDocumentLoaderArgs = {
  deckUrl: string | null
  showPreviewTrigger: boolean
  viewerActive: boolean
  renderPage: () => Promise<void>
  renderPreview: () => Promise<void>
  setLoadingDoc: Dispatch<SetStateAction<boolean>>
  setError: Dispatch<SetStateAction<string | null>>
  setSupportsCanvas: Dispatch<SetStateAction<boolean>>
  setPageCount: Dispatch<SetStateAction<number | null>>
  pdfRef: MutableRefObject<PdfDocumentLike | null>
}

export function useDeckDocumentLoader({
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
}: UseDeckDocumentLoaderArgs) {
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
  }, [
    deckUrl,
    pdfRef,
    renderPage,
    renderPreview,
    setError,
    setLoadingDoc,
    setPageCount,
    setSupportsCanvas,
    showPreviewTrigger,
    viewerActive,
  ])
}
