"use client"

import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"

type HeaderActionsPortalProps = {
  children: React.ReactNode
  slot?: "center" | "right"
}

export function HeaderActionsPortal({ children, slot = "center" }: HeaderActionsPortalProps) {
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null)
  const content = useMemo(() => children, [children])

  useEffect(() => {
    const targetId = slot === "right" ? "site-header-actions-right" : "site-header-actions-center"
    const el = document.getElementById(targetId)
    setMountNode(el as HTMLElement | null)
  }, [slot])

  if (!mountNode) return null
  return createPortal(content, mountNode)
}
