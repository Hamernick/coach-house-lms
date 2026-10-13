"use client"

import { useEffect } from "react"
import { WORKSPACE_MUTATION_EVENT } from "@/lib/with-save-feedback"

/** Keep shared data current while visible, and refresh after returning to the tab. */
export function useVisibleRefresh(refresh: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") refresh()
    }
    window.addEventListener(WORKSPACE_MUTATION_EVENT, refreshIfVisible)
    window.addEventListener("focus", refreshIfVisible)
    document.addEventListener("visibilitychange", refreshIfVisible)
    const timer = window.setInterval(refreshIfVisible, 30_000)
    return () => {
      window.removeEventListener(WORKSPACE_MUTATION_EVENT, refreshIfVisible)
      window.removeEventListener("focus", refreshIfVisible)
      document.removeEventListener("visibilitychange", refreshIfVisible)
      window.clearInterval(timer)
    }
  }, [enabled, refresh])
}
