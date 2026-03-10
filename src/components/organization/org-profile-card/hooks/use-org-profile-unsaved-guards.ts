import { useEffect, type MutableRefObject } from "react"

type UseOrgProfileUnsavedGuardsArgs = {
  canEdit: boolean
  hasUnsavedChanges: boolean
  pendingNavigationRef: MutableRefObject<string | null>
  setConfirmDiscardOpen: (open: boolean) => void
}

export function useOrgProfileUnsavedGuards({
  canEdit,
  hasUnsavedChanges,
  pendingNavigationRef,
  setConfirmDiscardOpen,
}: UseOrgProfileUnsavedGuardsArgs) {
  useEffect(() => {
    if (!canEdit || typeof window === "undefined") return

    const handler = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return
      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [hasUnsavedChanges, canEdit])

  useEffect(() => {
    if (!hasUnsavedChanges || typeof window === "undefined") return

    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return
      if (!(event.target instanceof Element)) return
      const anchor = event.target.closest("a[href]") as HTMLAnchorElement | null
      if (!anchor) return
      if (anchor.target && anchor.target !== "_self") return
      if (anchor.hasAttribute("download")) return
      const href = anchor.getAttribute("href")
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return
      event.preventDefault()
      event.stopPropagation()
      pendingNavigationRef.current = anchor.href
      setConfirmDiscardOpen(true)
    }

    document.addEventListener("click", handleClick, true)
    return () => document.removeEventListener("click", handleClick, true)
  }, [hasUnsavedChanges, pendingNavigationRef, setConfirmDiscardOpen])
}
