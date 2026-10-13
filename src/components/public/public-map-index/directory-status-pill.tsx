"use client"

import StatusIndicator from "@/components/8starlabs-ui/status-indicator"
import { cn } from "@/lib/utils"
import { PUBLIC_MAP_OVERLAY_GLASS_CLASSNAME } from "./sidebar-theme"

export function resolvePublicMapDirectoryStatusCount(count: number) {
  const normalizedCount = Number.isFinite(count) ? Math.max(0, count) : 0
  return normalizedCount.toLocaleString()
}

export function PublicMapDirectoryStatusHeader({
  label = "Resources",
}: {
  label?: string
}) {
  return (
    <div
      data-public-map-directory-status-header="true"
      className="flex h-8 shrink-0 items-center"
    >
      <p className="text-muted-foreground min-w-0 truncate text-xs font-medium tracking-[0.08em] uppercase">
        {label}
      </p>
    </div>
  )
}

export function PublicMapDirectoryStatusPill({
  className,
  count,
  label = "Resources",
}: {
  className?: string
  count: number
  label?: string
}) {
  const countLabel = resolvePublicMapDirectoryStatusCount(count)

  return (
    <span
      className={cn(
        PUBLIC_MAP_OVERLAY_GLASS_CLASSNAME,
        "inline-flex h-8 shrink-0 items-center gap-2 rounded-full border px-2.5 text-xs font-medium",
        className
      )}
      aria-label={`${label} directory status: active, ${countLabel}`}
    >
      <span aria-hidden="true" className="inline-flex shrink-0">
        <StatusIndicator state="active" size="sm" className="shrink-0 gap-0" />
      </span>
      <span>Active</span>
      <span className="tabular-nums">{countLabel}</span>
    </span>
  )
}
