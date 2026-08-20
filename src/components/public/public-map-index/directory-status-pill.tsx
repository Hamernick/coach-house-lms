"use client"

import StatusIndicator from "@/components/8starlabs-ui/status-indicator"
import { cn } from "@/lib/utils"
import { PUBLIC_MAP_OVERLAY_GLASS_CLASSNAME } from "./sidebar-theme"

export function resolvePublicMapDirectoryStatusCount(count: number) {
  const normalizedCount = Number.isFinite(count) ? Math.max(0, count) : 0
  return normalizedCount.toLocaleString()
}

export function resolvePublicMapDirectoryCount(
  organizationCount: number,
  totalResourceCount: number | null
) {
  return totalResourceCount === null
    ? null
    : organizationCount + totalResourceCount
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
  count: number | null
  label?: string
}) {
  const countLabel =
    count === null ? null : resolvePublicMapDirectoryStatusCount(count)

  return (
    <span
      className={cn(
        PUBLIC_MAP_OVERLAY_GLASS_CLASSNAME,
        "inline-flex h-8 shrink-0 items-center gap-2 rounded-full border px-2.5 text-xs font-medium",
        className
      )}
      aria-label={
        countLabel === null
          ? `${label} directory status: loading`
          : `${label} directory status: active, ${countLabel}`
      }
    >
      <span aria-hidden="true" className="inline-flex shrink-0">
        <StatusIndicator state="active" size="sm" className="shrink-0 gap-0" />
      </span>
      <span>Active</span>
      {countLabel === null ? (
        <span
          data-public-map-directory-count-loading="true"
          className="bg-muted-foreground/20 h-3 w-8 animate-pulse rounded-full motion-reduce:animate-none"
          aria-hidden="true"
        />
      ) : (
        <span className="tabular-nums">{countLabel}</span>
      )}
    </span>
  )
}
