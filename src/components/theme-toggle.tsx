"use client"

import { useTheme } from "next-themes"
import { IconMoon, IconSun, IconDeviceDesktop } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import * as React from "react"

const ORDER: Array<"system" | "light" | "dark"> = ["system", "light", "dark"]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const current = (theme as "system" | "light" | "dark") ?? "system"
  const idx = ORDER.indexOf(current)
  const next = ORDER[(idx + 1) % ORDER.length]

  const Icon = current === "dark" ? IconMoon : current === "light" ? IconSun : IconDeviceDesktop

  return (
    <Button variant="ghost" size="icon" onClick={() => setTheme(next)} aria-label={`Theme: ${current}`}>
      <Icon className="size-4" />
    </Button>
  )
}

