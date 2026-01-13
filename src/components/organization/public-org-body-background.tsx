"use client"

import { useEffect, useRef } from "react"
import { useTheme } from "next-themes"

type BodyStyles = {
  backgroundColor: string
  backgroundImage: string
  backgroundSize: string
  backgroundRepeat: string
  backgroundAttachment: string
  backgroundPosition: string
}

export function PublicOrgBodyBackground() {
  const { resolvedTheme } = useTheme()
  const initialRef = useRef<{ body: BodyStyles; html: BodyStyles } | null>(null)

  useEffect(() => {
    const body = typeof document !== "undefined" ? document.body : null
    const html = typeof document !== "undefined" ? document.documentElement : null
    if (!body || !html) return

    if (!initialRef.current) {
      initialRef.current = {
        body: {
          backgroundColor: body.style.backgroundColor,
          backgroundImage: body.style.backgroundImage,
          backgroundSize: body.style.backgroundSize,
          backgroundRepeat: body.style.backgroundRepeat,
          backgroundAttachment: body.style.backgroundAttachment,
          backgroundPosition: body.style.backgroundPosition,
        },
        html: {
          backgroundColor: html.style.backgroundColor,
          backgroundImage: html.style.backgroundImage,
          backgroundSize: html.style.backgroundSize,
          backgroundRepeat: html.style.backgroundRepeat,
          backgroundAttachment: html.style.backgroundAttachment,
          backgroundPosition: html.style.backgroundPosition,
        },
      }
    }

    return () => {
      if (!body || !html || !initialRef.current) return
      body.style.backgroundColor = initialRef.current.body.backgroundColor
      body.style.backgroundImage = initialRef.current.body.backgroundImage
      body.style.backgroundSize = initialRef.current.body.backgroundSize
      body.style.backgroundRepeat = initialRef.current.body.backgroundRepeat
      body.style.backgroundAttachment = initialRef.current.body.backgroundAttachment
      body.style.backgroundPosition = initialRef.current.body.backgroundPosition
      html.style.backgroundColor = initialRef.current.html.backgroundColor
      html.style.backgroundImage = initialRef.current.html.backgroundImage
      html.style.backgroundSize = initialRef.current.html.backgroundSize
      html.style.backgroundRepeat = initialRef.current.html.backgroundRepeat
      html.style.backgroundAttachment = initialRef.current.html.backgroundAttachment
      html.style.backgroundPosition = initialRef.current.html.backgroundPosition
    }
  }, [])

  useEffect(() => {
    const body = typeof document !== "undefined" ? document.body : null
    const html = typeof document !== "undefined" ? document.documentElement : null
    if (!body || !html) return

    const isDark = resolvedTheme === "dark"
    const backgroundColor = isDark ? "#151517" : "#f9f9f9"
    const backgroundImage = isDark
      ? "radial-gradient(#2a2a2c 0.8px, transparent 0)"
      : "radial-gradient(#dadada 0.9px, transparent 0)"
    const backgroundSize = isDark ? "36px 36px" : "34px 34px"

    ;[body, html].forEach((node) => {
      node.style.backgroundColor = backgroundColor
      node.style.backgroundImage = backgroundImage
      node.style.backgroundSize = backgroundSize
      node.style.backgroundRepeat = "repeat"
      node.style.backgroundAttachment = "fixed"
      node.style.backgroundPosition = "0 0"
    })
  }, [resolvedTheme])

  return null
}
