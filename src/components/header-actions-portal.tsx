"use client"

import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"

export function HeaderActionsPortal({ children }: { children: React.ReactNode }) {
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null)
  const content = useMemo(() => children, [children])

  useEffect(() => {
    const el = document.getElementById("site-header-actions")
    setMountNode(el as HTMLElement | null)
  }, [])

  if (!mountNode) return null
  return createPortal(content, mountNode)
}

