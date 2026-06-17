"use client"

import { memo } from "react"

import { RoadmapNavigatorSection } from "@/components/roadmap/roadmap-navigator-section"
import { RightRailSlot } from "@/components/app-shell/right-rail"
import type { RoadmapSection } from "@/lib/roadmap"
import { WORKSPACE_ROADMAP_PATH } from "@/lib/workspace/routes"

import { WorkspaceBoardTeamAccessSection } from "./workspace-board-team-access-section"
import type {
  WorkspaceCollaborationInvite,
  WorkspaceMemberOption,
} from "./workspace-board-types"
import type { WorkspaceBoardUiPreferenceScope } from "./workspace-board-ui-preferences"

const RAIL_SECTION_CLASSNAME = "space-y-2 px-0.5"
const WORKSPACE_RIGHT_RAIL_CONTENT_CLASSNAME =
  "space-y-4 pt-10 md:-mt-2 md:pt-0"

export const WorkspaceBoardRightRail = memo(function WorkspaceBoardRightRail({
  canInvite,
  members,
  invites,
  realtimeState,
  currentUser,
  uiPreferencesScope,
  roadmapSections,
  tutorialTeamAccessCallout,
  onInvitesChange,
}: {
  canInvite: boolean
  members: WorkspaceMemberOption[]
  invites: WorkspaceCollaborationInvite[]
  realtimeState: "connecting" | "live" | "degraded"
  currentUser: {
    id: string
    name: string
    avatarUrl: string | null
  }
  uiPreferencesScope: WorkspaceBoardUiPreferenceScope
  roadmapSections: RoadmapSection[]
  tutorialTeamAccessCallout?: {
    title: string
    instruction: string
  } | null
  onInvitesChange: (nextInvites: WorkspaceCollaborationInvite[]) => void
}) {
  return (
    <RightRailSlot priority={10}>
      <WorkspaceBoardRightRailContent
        canInvite={canInvite}
        members={members}
        invites={invites}
        realtimeState={realtimeState}
        currentUser={currentUser}
        uiPreferencesScope={uiPreferencesScope}
        roadmapSections={roadmapSections}
        tutorialTeamAccessCallout={tutorialTeamAccessCallout}
        onInvitesChange={onInvitesChange}
      />
    </RightRailSlot>
  )
})

WorkspaceBoardRightRail.displayName = "WorkspaceBoardRightRail"

export function WorkspaceBoardRightRailContent({
  canInvite,
  members,
  invites,
  realtimeState,
  currentUser,
  uiPreferencesScope,
  roadmapSections,
  tutorialTeamAccessCallout,
  onInvitesChange,
}: {
  canInvite: boolean
  members: WorkspaceMemberOption[]
  invites: WorkspaceCollaborationInvite[]
  realtimeState: "connecting" | "live" | "degraded"
  currentUser: {
    id: string
    name: string
    avatarUrl: string | null
  }
  uiPreferencesScope: WorkspaceBoardUiPreferenceScope
  roadmapSections: RoadmapSection[]
  tutorialTeamAccessCallout?: {
    title: string
    instruction: string
  } | null
  onInvitesChange: (nextInvites: WorkspaceCollaborationInvite[]) => void
}) {
  return (
    <div className={WORKSPACE_RIGHT_RAIL_CONTENT_CLASSNAME}>
      <div className={RAIL_SECTION_CLASSNAME}>
        <WorkspaceBoardTeamAccessSection
          canInvite={canInvite}
          members={members}
          invites={invites}
          realtimeState={realtimeState}
          currentUser={currentUser}
          uiPreferencesScope={uiPreferencesScope}
          tutorialCallout={tutorialTeamAccessCallout}
          onInvitesChange={onInvitesChange}
        />
      </div>

      <div className={RAIL_SECTION_CLASSNAME}>
        <RoadmapNavigatorSection
          sections={roadmapSections}
          basePath={WORKSPACE_ROADMAP_PATH}
          tocRailOffset="0.25rem"
        />
      </div>
    </div>
  )
}
