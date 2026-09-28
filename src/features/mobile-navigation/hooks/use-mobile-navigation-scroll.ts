"use client"

import { useEffect, useState } from "react"

export function useMobileNavigationScroll() {
  const [keyboardOpen, setKeyboardOpen] = useState(false)

  useEffect(() => {
    const viewport = window.visualViewport
    function onViewportChange() {
      const editing = document.activeElement?.matches(
        "input, textarea, [contenteditable='true']"
      )
      setKeyboardOpen(
        Boolean(
          editing && viewport && window.innerHeight - viewport.height > 150
        )
      )
    }
    viewport?.addEventListener("resize", onViewportChange)
    document.addEventListener("focusin", onViewportChange)
    document.addEventListener("focusout", onViewportChange)
    return () => {
      viewport?.removeEventListener("resize", onViewportChange)
      document.removeEventListener("focusin", onViewportChange)
      document.removeEventListener("focusout", onViewportChange)
    }
  }, [])

  return keyboardOpen
}
