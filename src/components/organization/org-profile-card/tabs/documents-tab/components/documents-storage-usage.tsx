import { formatBytes } from "../helpers"

type DocumentsStorageUsageProps = {
  usedBytes: number
  limitBytes: number
  loading: boolean
}

export function DocumentsStorageUsage({
  usedBytes,
  limitBytes,
  loading,
}: DocumentsStorageUsageProps) {
  const percentage =
    limitBytes > 0 ? Math.min(100, (usedBytes / limitBytes) * 100) : 0

  return (
    <div className="mt-3 flex items-center justify-end gap-2">
      <div
        className="bg-muted h-1.5 w-20 overflow-hidden rounded-full"
        role="meter"
        aria-label="Document storage used"
        aria-valuemin={0}
        aria-valuemax={limitBytes}
        aria-valuenow={usedBytes}
      >
        <div
          className="bg-foreground/60 h-full rounded-full transition-[width]"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-muted-foreground min-w-0 text-xs tabular-nums">
        {loading
          ? "Loading storage…"
          : `${usedBytes === 0 ? "0" : formatBytes(usedBytes)} of ${formatBytes(limitBytes)} used`}
      </span>
    </div>
  )
}
