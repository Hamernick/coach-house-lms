import { useCallback, useEffect, useState } from "react"

type UseDeckSourceArgs = {
  moduleId: string
  hasDeck: boolean
}

export function useDeckSource({ moduleId, hasDeck }: UseDeckSourceArgs) {
  const [deckUrl, setDeckUrl] = useState<string | null>(null)
  const [loadingUrl, setLoadingUrl] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

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

  const retry = useCallback(() => {
    setReloadToken((prev) => prev + 1)
  }, [])

  return {
    deckUrl,
    loadingUrl,
    fetchError,
    retry,
  }
}
