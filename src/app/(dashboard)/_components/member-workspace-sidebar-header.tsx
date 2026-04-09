import {
  MemberWorkspaceOrgSwitcher,
  setActiveOrganizationAction,
  type MemberWorkspaceHeaderState,
} from "@/features/member-workspace"

export function MemberWorkspaceSidebarHeader({
  state,
}: {
  state: MemberWorkspaceHeaderState | null
}) {
  if (!state) return null

  return (
    <MemberWorkspaceOrgSwitcher
      activeOrganization={state.activeOrganization}
      organizations={state.accessibleOrganizations}
      setActiveOrganizationAction={setActiveOrganizationAction}
    />
  )
}
