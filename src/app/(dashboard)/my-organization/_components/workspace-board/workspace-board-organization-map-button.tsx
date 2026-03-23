"use client"

import type { OrgProfile } from "@/components/organization/org-profile-card/types"
import { WorkspaceMapPreviewButton } from "@/features/workspace-map-card"

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
        companyHref: "/workspace?view=editor&tab=company",
        presentationMode: false,
      }}
      highlighted={highlighted}
      onOpen={onPress}
    />
  )
}
