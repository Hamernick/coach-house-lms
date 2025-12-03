"use client"

import { useTheme } from "next-themes"
import DeviceDesktopIcon from "lucide-react/dist/esm/icons/monitor"
import MoonIcon from "lucide-react/dist/esm/icons/moon"
import SunIcon from "lucide-react/dist/esm/icons/sun"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"

const ORDER: Array<"system" | "light" | "dark"> = ["system", "light", "dark"]

export function PublicThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" className="inline-flex items-center gap-2">
        <DeviceDesktopIcon className="h-4 w-4" /> Theme
      </Button>
    )
  }

  const current = (theme as "system" | "light" | "dark") ?? "system"
  const idx = ORDER.indexOf(current)
  const next = ORDER[(idx + 1) % ORDER.length]

  const Icon = current === "dark" ? MoonIcon : current === "light" ? SunIcon : DeviceDesktopIcon
  const label = current.charAt(0).toUpperCase() + current.slice(1)

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setTheme(next)}
      className="inline-flex items-center gap-2"
      aria-label={`Theme: ${current}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  )
}
