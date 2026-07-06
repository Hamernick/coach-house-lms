"use client"

import type { CSSProperties, ReactNode } from "react"
import { Glass, type GlassOptics } from "@samasante/liquid-glass"

import { cn } from "@/lib/utils"

const PUBLIC_MAP_LIQUID_GLASS_OPTICS: Partial<GlassOptics> = {
  bend: 0.08,
  brightness: 0.08,
  curvature: 0.24,
  depth: 0.42,
  dispersion: 0.14,
  frost: 0.72,
  glow: 0.08,
  sheen: 0.16,
  strength: 0.035,
}

type PublicMapLiquidGlassShellProps = {
  children: ReactNode
  className?: string
  radius?: number
  style?: CSSProperties
}

export function PublicMapLiquidGlassShell({
  children,
  className,
  radius = 0,
  style,
}: PublicMapLiquidGlassShellProps) {
  return (
    <Glass
      className={cn("relative overflow-hidden", className)}
      optics={PUBLIC_MAP_LIQUID_GLASS_OPTICS}
      radius={radius}
      style={{ height: "100%", width: "100%", ...style }}
    >
      {children}
    </Glass>
  )
}
