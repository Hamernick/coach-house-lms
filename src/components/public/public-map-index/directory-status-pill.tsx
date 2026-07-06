"use client"

import StatusIndicator from "@/components/8starlabs-ui/status-indicator"

export function resolvePublicMapDirectoryStatusCount(count: number) {
  const normalizedCount = Number.isFinite(count) ? Math.max(0, count) : 0
  return normalizedCount.toLocaleString()
}

export function PublicMapDirectoryStatusHeader({
  count,
  label = "Resources",
}: {
  count: number
  label?: string
}) {
  const countLabel = resolvePublicMapDirectoryStatusCount(count)

  return (
    <div
      data-public-map-directory-status-header="true"
      className="flex shrink-0 items-center justify-between gap-2"
    >
      <p className="text-muted-foreground min-w-0 truncate text-xs font-medium tracking-[0.08em] uppercase">
        {label}
      </p>
      <span
        className="border-border/70 bg-card/92 text-foreground dark:border-input dark:bg-input/30 dark:text-foreground inline-flex h-7 shrink-0 items-center gap-2 rounded-full border px-2.5 text-xs font-medium backdrop-blur"
        aria-label={`${label} directory status: active, ${countLabel}`}
      >
        <span aria-hidden="true" className="inline-flex shrink-0">
          <StatusIndicator
            state="active"
            size="sm"
            className="shrink-0 gap-0"
          />
        </span>
        <span>Active</span>
        <span className="tabular-nums">{countLabel}</span>
      </span>
    </div>
  )
}
