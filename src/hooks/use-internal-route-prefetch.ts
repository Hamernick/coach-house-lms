"use client"

import { useCallback, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"

import {
  isInternalPrefetchHref,
  uniqueInternalPrefetchHrefs,
} from "@/lib/navigation/internal-route-prefetch"

type IdleWindow = Window & {
  requestIdleCallback?: (
    callback: IdleRequestCallback,
    options?: IdleRequestOptions,
  ) => number
  cancelIdleCallback?: (handle: number) => void
}

export function useInternalRoutePrefetch(
  hrefs: readonly (string | null | undefined)[],
) {
  const router = useRouter()
  const hrefKey = hrefs.join("|")
  const internalHrefs = useMemo(
    () => uniqueInternalPrefetchHrefs(hrefs),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hrefKey],
  )

  useEffect(() => {
    if (internalHrefs.length === 0) return

    let cancelled = false
    const prefetch = () => {
      if (cancelled) return
      for (const href of internalHrefs) {
        router.prefetch(href)
      }
    }
    const idleWindow = window as IdleWindow

    if (idleWindow.requestIdleCallback) {
      const idleId = idleWindow.requestIdleCallback(prefetch, { timeout: 900 })
      return () => {
        cancelled = true
        idleWindow.cancelIdleCallback?.(idleId)
      }
    }

    const timeoutId = window.setTimeout(prefetch, 120)
    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [internalHrefs, router])

  return useCallback(
    (href: string | null | undefined) => {
      if (!isInternalPrefetchHref(href)) return
      router.prefetch(href)
    },
    [router],
  )
}
