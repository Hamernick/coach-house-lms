import type { WorkspaceFinanceStripeConnectionInput } from "../types"

type WorkspaceFinanceSyncStatus = NonNullable<
  WorkspaceFinanceStripeConnectionInput["lastSyncStatus"]
>

export function formatWorkspaceFinanceSyncFreshness({
  lastSyncedAt,
  status,
  locale,
}: {
  lastSyncedAt?: string | null
  status?: WorkspaceFinanceSyncStatus | null
  locale?: string
}) {
  const syncedAt = lastSyncedAt ? new Date(lastSyncedAt) : null
  const hasValidSync = syncedAt && !Number.isNaN(syncedAt.getTime())
  const lastSyncLabel = hasValidSync
    ? `Last synced ${new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(syncedAt)}`
    : "Not synced yet"

  if (status === "running") return `Sync in progress · ${lastSyncLabel}`
  if (status === "failed") return `Sync failed · ${lastSyncLabel}`
  return lastSyncLabel
}
