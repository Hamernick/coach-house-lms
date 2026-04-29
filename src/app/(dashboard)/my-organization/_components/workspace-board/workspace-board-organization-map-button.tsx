"use client"

import type { OrgProfile } from "@/components/organization/org-profile-card/types"
import { WorkspaceMapPreviewButton } from "@/features/workspace-map-card"
import { getWorkspaceEditorPath } from "@/lib/workspace/routes"

export function WorkspaceBoardOrganizationMapButton({
  orgId,
  profile,
  highlighted = false,
  instruction: _instruction,
  onPress,
}: {
  orgId: string
  profile: OrgProfile
  highlighted?: boolean
  instruction?: string | null
  onPress: () => void
}) {
  return (
    <WorkspaceMapPreviewButton
      input={{
        orgId,
        title: "Map",
        profile,
        companyHref: getWorkspaceEditorPath({ tab: "company" }),
        presentationMode: false,
      }}
      highlighted={highlighted}
      onOpen={onPress}
    />
  )
}
