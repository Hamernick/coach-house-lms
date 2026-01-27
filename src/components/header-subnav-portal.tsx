"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"

export function HeaderSubnavPortal({
  children,
  onMount,
}: {
  children: React.ReactNode
  onMount?: () => void
}) {
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null)
  const content = useMemo(() => children, [children])
  const mountedRef = useRef(false)

  useEffect(() => {
    const el = document.getElementById("site-header-subnav")
    setMountNode(el as HTMLElement | null)
    if (el && onMount && !mountedRef.current) {
      mountedRef.current = true
      onMount()
    }
  }, [onMount])

  if (!mountNode) return null
  return createPortal(content, mountNode)
}
