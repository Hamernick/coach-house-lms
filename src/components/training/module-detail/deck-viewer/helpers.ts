import { PDF_JS_SRC, PDF_JS_WORKER_SRC } from "./constants"

declare global {
  interface Window {
    pdfjsLib?: {
      GlobalWorkerOptions: { workerSrc: string }
      getDocument: (params: { url: string }) => { promise: Promise<any> }
    }
  }
}

let pdfJsLoaderPromise: Promise<any | null> | null = null

export async function loadPdfJs() {
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

      const existing = document.querySelector<HTMLScriptElement>(
        `script[src="${PDF_JS_SRC}"]`,
      )
      if (existing) {
        existing.addEventListener("load", handleReady, { once: true })
        existing.addEventListener("error", handleError, { once: true })
        return
      }

      const script = document.createElement("script")
      script.src = PDF_JS_SRC
      script.type = "module"
      script.async = true
      script.addEventListener("load", handleReady, { once: true })
      script.addEventListener("error", handleError, { once: true })
      document.head.appendChild(script)
    })
  }
  return pdfJsLoaderPromise
}
