export function hasOpenInteractionLayer(doc: Document) {
  return Boolean(
    doc.querySelector(
      [
        '[data-slot="dialog-content"][data-state="open"]',
        '[data-slot="sheet-content"][data-state="open"]',
        '[data-slot="alert-dialog-content"][data-state="open"]',
        '[data-slot="drawer-content"][data-state="open"]',
        '[data-slot="drawer-overlay"][data-state="open"]',
      ].join(", "),
    ),
  )
}

export function releaseStaleInteractionLocks() {
  if (typeof document === "undefined") return

  if (hasOpenInteractionLayer(document)) return

  const body = document.body
  const html = document.documentElement

  body.style.overflow = ""
  body.style.pointerEvents = ""
  body.style.removeProperty("padding-right")
  body.removeAttribute("data-scroll-locked")

  html.style.overflow = ""
  html.style.removeProperty("padding-right")
  html.removeAttribute("data-scroll-locked")
}

export function scheduleInteractionLockGuard() {
  if (typeof window === "undefined") return
  window.setTimeout(releaseStaleInteractionLocks, 0)
  window.requestAnimationFrame(releaseStaleInteractionLocks)
}

export function scheduleInteractionLockGuardOnClose({
  open,
  onOpenChange,
  schedule = scheduleInteractionLockGuard,
}: {
  open: boolean
  onOpenChange?: (open: boolean) => void
  schedule?: () => void
}) {
  onOpenChange?.(open)
  if (!open) {
    schedule()
  }
}
