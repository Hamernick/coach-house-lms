"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

export function useDeckPageNavigation(pageCount: number | null) {
  const [page, setPage] = useState(1)

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

  const pageLabel = useMemo(
    () => (pageCount ? `${page}/${pageCount}` : `${page}/?`),
    [page, pageCount],
  )

  return { page, setPage, effectiveMaxPage, pageLabel, navigate }
}
