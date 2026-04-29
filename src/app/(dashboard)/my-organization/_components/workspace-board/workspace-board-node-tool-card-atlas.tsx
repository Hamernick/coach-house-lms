"use client"

import type { OrgProfile } from "@/components/organization/org-profile-card/types"
import type { WorkspaceCanvasTutorialStepId } from "@/features/workspace-canvas-tutorial"
import { WorkspaceMapCardPanel } from "@/features/workspace-map-card"
import { getWorkspaceEditorPath } from "@/lib/workspace/routes"

import type { WorkspaceCardSize, WorkspaceSeedData } from "./workspace-board-types"

export function WorkspaceBoardAtlasCard({
  presentationMode,
  seed,
  profile,
  tutorialStepId,
}: {
  size: WorkspaceCardSize
  presentationMode: boolean
  seed: WorkspaceSeedData
  profile: OrgProfile
  tutorialStepId?: WorkspaceCanvasTutorialStepId | null
}) {
  return (
    <WorkspaceMapCardPanel
      input={{
        orgId: seed.orgId,
        title: "Map",
        profile,
        companyHref: getWorkspaceEditorPath({ tab: "company" }),
        presentationMode,
        tutorialStepId,
      }}
    />
  )
}
