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
      <Button
        variant="outline"
        size="icon"
        className="rounded-full"
        aria-label="Toggle theme"
        title="Toggle theme"
      >
        <DeviceDesktopIcon className="h-4 w-4" />
      </Button>
    )
  }

  const current = (theme as "system" | "light" | "dark") ?? "system"
  const idx = ORDER.indexOf(current)
  const next = ORDER[(idx + 1) % ORDER.length]

  const Icon = current === "dark" ? MoonIcon : current === "light" ? SunIcon : DeviceDesktopIcon
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(next)}
      className="rounded-full"
      aria-label={`Toggle theme (currently ${current})`}
      title={`Theme: ${current}`}
    >
      <Icon className="h-4 w-4" />
    </Button>
  )
}
