"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import type { ToasterProps } from "sonner"

type SonnerToaster = typeof import("sonner") extends { Toaster: infer T }
  ? T
  : never

export function Toaster(props: ToasterProps) {
  const { theme = "system" } = useTheme()
  const [SonnerComponent, setSonnerComponent] = useState<SonnerToaster | null>(
    null
  )

  useEffect(() => {
    let mounted = true
    const load = () => {
      void import("sonner")
        .then((mod) => {
          if (mounted) setSonnerComponent(() => mod.Toaster)
        })
        .catch(() => {
          // A cold offline visit may not have this optional UI chunk cached.
          // Retry when connectivity returns; document state stays usable.
        })
    }
    load()
    window.addEventListener("online", load)
    return () => {
      mounted = false
      window.removeEventListener("online", load)
    }
  }, [])

  if (!SonnerComponent) {
    return null
  }

  return (
    <SonnerComponent
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as Record<string, string>
      }
      {...props}
    />
  )
}
