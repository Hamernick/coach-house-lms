"use client"

import { useCallback, useEffect, useState } from "react"

import {
  MARKETPLACE_RESOURCES,
  MARKETPLACE_SHORTLIST_STORAGE_KEY,
  buildMarketplaceShortlistCsv,
  sanitizeMarketplaceShortlist,
} from "../lib/marketplace-directory"

export function useMarketplaceShortlist() {
  const [ids, setIds] = useState<string[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(MARKETPLACE_SHORTLIST_STORAGE_KEY)
      setIds(sanitizeMarketplaceShortlist(raw ? JSON.parse(raw) : []))
    } catch {
      setIds([])
    } finally {
      setReady(true)
    }
  }, [])

  const save = useCallback((nextIds: string[]) => {
    const sanitized = sanitizeMarketplaceShortlist(nextIds)
    setIds(sanitized)
    try {
      window.localStorage.setItem(
        MARKETPLACE_SHORTLIST_STORAGE_KEY,
        JSON.stringify(sanitized)
      )
    } catch {
      // The working list remains usable for this session when storage is blocked.
    }
  }, [])

  const toggle = useCallback(
    (id: string) => {
      save(
        ids.includes(id) ? ids.filter((entry) => entry !== id) : [...ids, id]
      )
    },
    [ids, save]
  )

  const clear = useCallback(() => save([]), [save])

  const download = useCallback(() => {
    if (ids.length === 0) return
    const blob = new Blob([buildMarketplaceShortlistCsv(ids)], {
      type: "text/csv;charset=utf-8",
    })
    const href = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = href
    anchor.download = "coach-house-marketplace-shortlist.csv"
    anchor.click()
    URL.revokeObjectURL(href)
  }, [ids])

  return {
    clear,
    download,
    ids,
    ready,
    resources: MARKETPLACE_RESOURCES.filter((resource) =>
      ids.includes(resource.id)
    ),
    toggle,
  }
}
