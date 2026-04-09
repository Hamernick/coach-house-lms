import { Skeleton } from "@/features/platform-admin-dashboard"

import styles from "./member-workspace-projects-surface-theme.module.css"

export function MemberWorkspaceProjectDetailLoading() {
  return (
    <div
      className={`${styles.surface} -mx-[var(--shell-content-pad)] -mb-[var(--shell-content-pad)] -mt-[var(--shell-content-pad)] flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background`}
    >
      <div className="px-4 py-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-48" />
        </div>

        <div className="mt-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-3 h-8 w-[360px]" />
          <Skeleton className="mt-3 h-5 w-[520px]" />
          <Skeleton className="mt-5 h-px w-full" />
          <Skeleton className="mt-5 h-16 w-full" />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-8">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>

          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-52 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
