"use client"

import { useEffect, useState } from "react"

type PreviewResult = { key: string; url: string | null; error: string | null }

export function useDocumentPreviewUrl(
  path: string | undefined,
  version: string | undefined,
  enabled: boolean
) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<PreviewResult | null>(null)
  const key = JSON.stringify([path, version, attempt])

  useEffect(() => {
    if (!enabled || !path) return
    const controller = new AbortController()
    async function load() {
      try {
        const response = await fetch(path!, {
          cache: "no-store",
          signal: controller.signal,
        })
        const payload = await response.json()
        if (!response.ok || typeof payload.url !== "string") {
          throw new Error("The document could not be loaded. Try again.")
        }
        const url = new URL(payload.url, window.location.origin)
        if (!["https:", "http:"].includes(url.protocol))
          throw new Error("Invalid document link.")
        if (!controller.signal.aborted)
          setResult({ key, url: url.href, error: null })
      } catch {
        if (!controller.signal.aborted)
          setResult({
            key,
            url: null,
            error: "The document could not be loaded. Try again.",
          })
      }
    }
    void load()
    return () => controller.abort()
  }, [enabled, key, path])

  return {
    url: result?.key === key ? result.url : null,
    error: result?.key === key ? result.error : null,
    retry: () => setAttempt((current) => current + 1),
  }
}
