"use client"

import { useTheme } from "next-themes"
import DeviceDesktopIcon from "lucide-react/dist/esm/icons/monitor"
import MoonIcon from "lucide-react/dist/esm/icons/moon"
import SunIcon from "lucide-react/dist/esm/icons/sun"
import { Button } from "@/components/ui/button"
import * as React from "react"

const ORDER: Array<"system" | "light" | "dark"> = ["system", "light", "dark"]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  // During SSR and the initial client render, render a stable UI
  // to avoid hydration mismatches due to system theme resolution.
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label="Theme">
        <DeviceDesktopIcon className="size-4" />
      </Button>
    )
  }

  const current = (theme as "system" | "light" | "dark") ?? "system"
  const idx = ORDER.indexOf(current)
  const next = ORDER[(idx + 1) % ORDER.length]
  const Icon = current === "dark" ? MoonIcon : current === "light" ? SunIcon : DeviceDesktopIcon

  return (
    <Button variant="ghost" size="icon" onClick={() => setTheme(next)} aria-label={`Theme: ${current}`}>
      <Icon className="size-4" />
    </Button>
  )
}
