"use client"

import { useEffect, useState } from "react"

import type { LinkPreviewMeta, LinkPreviewMetaMap } from "../types"

export function useLinkPreviews(links: string[]): LinkPreviewMetaMap {
  const [linkMeta, setLinkMeta] = useState<LinkPreviewMetaMap>({})

  useEffect(() => {
    let cancelled = false

    const loadMeta = async () => {
      const missing = links.filter((href) => !linkMeta[href])
      if (missing.length === 0) return

      const updates: Record<string, LinkPreviewMeta> = {}
      await Promise.all(
        missing.map(async (href) => {
          try {
            const res = await fetch(
              `/api/link-preview?url=${encodeURIComponent(href)}`,
              { cache: "no-store" },
            )
            if (!res.ok) throw new Error("preview failed")
            const data = (await res.json()) as LinkPreviewMeta
            updates[href] = data
          } catch {
            updates[href] = {}
          }
        }),
      )

      if (!cancelled && Object.keys(updates).length > 0) {
        setLinkMeta((prev) => ({ ...prev, ...updates }))
      }
    }

    void loadMeta()
    return () => {
      cancelled = true
    }
  }, [links, linkMeta])

  return linkMeta
}
