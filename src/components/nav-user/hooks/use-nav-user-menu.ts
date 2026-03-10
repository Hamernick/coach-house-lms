"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import type { CSSProperties, RefObject } from "react"

type UseNavUserMenuResult = {
  menuOpen: boolean
  setMenuOpen: (open: boolean | ((prev: boolean) => boolean)) => void
  containerRef: RefObject<HTMLDivElement | null>
  triggerRef: RefObject<HTMLButtonElement | null>
  menuRef: RefObject<HTMLDivElement | null>
  menuStyle: CSSProperties | null
}

export function useNavUserMenu(): UseNavUserMenuResult {
  const [menuOpen, setMenuOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null)

  useEffect(() => {
    if (!menuOpen) {
      return
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (containerRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return
      }
      setMenuOpen(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [menuOpen])

  useLayoutEffect(() => {
    if (!menuOpen) {
      setMenuStyle(null)
      return
    }

    const updatePosition = () => {
      if (!triggerRef.current || !menuRef.current) return
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const menuRect = menuRef.current.getBoundingClientRect()
      const gap = 8
      const menuWidth = menuRect.width
      const menuHeight = menuRect.height
      const spaceAbove = triggerRect.top
      const spaceBelow = window.innerHeight - triggerRect.bottom
      const openBelow = spaceAbove < menuHeight + gap && spaceBelow >= spaceAbove

      let top = openBelow ? triggerRect.bottom + gap : triggerRect.top - gap
      let left = triggerRect.right
      let transform = openBelow ? "translate(-100%, 0)" : "translate(-100%, -100%)"

      const minLeft = gap + menuWidth
      const maxLeft = window.innerWidth - gap
      if (left < minLeft) {
        left = minLeft
      } else if (left > maxLeft) {
        left = maxLeft
      }

      setMenuStyle({
        position: "fixed",
        top,
        left,
        transform,
        zIndex: 60,
      })
    }

    const frame = requestAnimationFrame(updatePosition)
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [menuOpen])

  return {
    menuOpen,
    setMenuOpen,
    containerRef,
    triggerRef,
    menuRef,
    menuStyle,
  }
}
