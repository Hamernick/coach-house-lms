"use client"

import { useEffect, useRef } from "react"
import { useTheme } from "next-themes"

type BodyStyles = {
  backgroundColor: string
  backgroundImage: string
  backgroundSize: string
  backgroundRepeat: string
}

export function PublicOrgBodyBackground() {
  const { resolvedTheme } = useTheme()
  const initialRef = useRef<BodyStyles | null>(null)

  useEffect(() => {
    const body = typeof document !== "undefined" ? document.body : null
    if (!body) return

    if (!initialRef.current) {
      initialRef.current = {
        backgroundColor: body.style.backgroundColor,
        backgroundImage: body.style.backgroundImage,
        backgroundSize: body.style.backgroundSize,
        backgroundRepeat: body.style.backgroundRepeat,
      }
    }

    return () => {
      if (!body || !initialRef.current) return
      body.style.backgroundColor = initialRef.current.backgroundColor
      body.style.backgroundImage = initialRef.current.backgroundImage
      body.style.backgroundSize = initialRef.current.backgroundSize
      body.style.backgroundRepeat = initialRef.current.backgroundRepeat
    }
  }, [])

  useEffect(() => {
    const body = typeof document !== "undefined" ? document.body : null
    if (!body) return

    const isDark = resolvedTheme === "dark"
    body.style.backgroundColor = isDark ? "#151517" : "#f9f9f9"
    body.style.backgroundImage = isDark
      ? "radial-gradient(#2a2a2c 0.8px, transparent 0)"
      : "radial-gradient(#dadada 0.9px, transparent 0)"
    body.style.backgroundSize = isDark ? "36px 36px" : "34px 34px"
    body.style.backgroundRepeat = "repeat"
  }, [resolvedTheme])

  return null
}
