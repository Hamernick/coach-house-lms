"use client"

import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"

type ShellContentPortalProps = {
  children: React.ReactNode
  slot?: "header" | "footer"
}

export function ShellContentPortal({ children, slot = "header" }: ShellContentPortalProps) {
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null)
  const content = useMemo(() => children, [children])

  useEffect(() => {
    const targetId = slot === "footer" ? "shell-content-footer" : "shell-content-header"
    const el = document.getElementById(targetId)
    setMountNode(el as HTMLElement | null)
  }, [slot])

  if (!mountNode) return null
  return createPortal(content, mountNode)
}

export function ShellContentHeaderPortal({ children }: { children: React.ReactNode }) {
  return <ShellContentPortal slot="header">{children}</ShellContentPortal>
}

export function ShellContentFooterPortal({ children }: { children: React.ReactNode }) {
  return <ShellContentPortal slot="footer">{children}</ShellContentPortal>
}
