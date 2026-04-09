"use client"

import dynamic from "next/dynamic"

import type { MemberWorkspaceHeaderState } from "@/features/member-workspace"

const MemberWorkspaceSidebarHeader = dynamic(
  () =>
    import("./member-workspace-sidebar-header").then((mod) => ({
      default: mod.MemberWorkspaceSidebarHeader,
    })),
  {
    loading: () => null,
    ssr: false,
  },
)

export function MemberWorkspaceSidebarHeaderEntry({
  state,
}: {
  state: MemberWorkspaceHeaderState | null
}) {
  if (!state) return null

  return <MemberWorkspaceSidebarHeader state={state} />
}
