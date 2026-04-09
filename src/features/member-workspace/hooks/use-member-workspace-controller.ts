import { useCallback, useMemo, useState } from "react"

import type {
  PlatformAdminDashboardLabPriority,
  PlatformAdminDashboardLabStatus,
  PlatformAdminDashboardLabViewType,
} from "@/features/platform-admin-dashboard"

type MemberWorkspaceProjectsSearchState = {
  query: string
  status: PlatformAdminDashboardLabStatus | null
  priority: PlatformAdminDashboardLabPriority | null
  viewType: PlatformAdminDashboardLabViewType
}

const DEFAULT_STATE: MemberWorkspaceProjectsSearchState = {
  query: "",
  status: null,
  priority: null,
  viewType: "list",
}

export function useMemberWorkspaceController() {
  const [state, setState] = useState<MemberWorkspaceProjectsSearchState>(DEFAULT_STATE)

  const replaceSearch = useCallback(
    (next: {
      query?: string
      status?: PlatformAdminDashboardLabStatus | null
      priority?: PlatformAdminDashboardLabPriority | null
      view?: PlatformAdminDashboardLabViewType
    }) => {
      setState((current) => ({
        query: next.query ?? current.query,
        status: next.status ?? current.status,
        priority: next.priority ?? current.priority,
        viewType: next.view ?? current.viewType,
      }))
    },
    [],
  )

  return useMemo(
    () => ({
      state,
      replaceSearch,
    }),
    [replaceSearch, state],
  )
}
