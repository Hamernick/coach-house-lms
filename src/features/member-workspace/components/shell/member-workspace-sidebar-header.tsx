import { OrganizationWorkspaceSupportPanel } from "@/features/organization-workspace-support"
import type { MemberWorkspaceHeaderState } from "../../types"
import { MemberWorkspaceOrgSwitcher } from "./member-workspace-org-switcher"

export function MemberWorkspaceSidebarHeader({
  state,
}: {
  state: MemberWorkspaceHeaderState | null
}) {
  if (!state) return null

  return (
    <>
    <MemberWorkspaceOrgSwitcher
      canSearchSupport={state.canSearchSupport}
      activeOrganization={state.activeOrganization}
      organizations={state.accessibleOrganizations}
    />
    <OrganizationWorkspaceSupportPanel organizationId={state.activeOrganization.orgId} supportAccess={state.activeOrganization.supportAccess} />
    </>
  )
}
