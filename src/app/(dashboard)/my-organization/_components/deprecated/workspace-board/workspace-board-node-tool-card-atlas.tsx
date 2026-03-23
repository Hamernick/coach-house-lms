"use client"

import { WorkspaceMapCardPanel } from "@/features/workspace-map-card"
import type { WorkspaceCanvasTutorialStepId } from "@/features/workspace-canvas-tutorial"
import type { OrgProfile } from "@/components/organization/org-profile-card/types"

import type { WorkspaceCardSize, WorkspaceSeedData } from "../../workspace-board/workspace-board-types"

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
        companyHref: "/workspace?view=editor&tab=company",
        presentationMode,
        tutorialStepId,
      }}
    />
  )
}
