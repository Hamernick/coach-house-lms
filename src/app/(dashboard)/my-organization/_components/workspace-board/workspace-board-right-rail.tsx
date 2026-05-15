"use client"

import { memo } from "react"

import { RightRailSlot } from "@/components/app-shell/right-rail"

import { WorkspaceBoardTeamAccessSection } from "./workspace-board-team-access-section"
import type {
  WorkspaceCollaborationInvite,
  WorkspaceMemberOption,
} from "./workspace-board-types"

const RAIL_SECTION_CLASSNAME = "space-y-2 px-0.5"
const WORKSPACE_RIGHT_RAIL_CONTENT_CLASSNAME = "-mt-2 space-y-4"

export const WorkspaceBoardRightRail = memo(function WorkspaceBoardRightRail({
  canInvite,
  members,
  invites,
  realtimeState,
  currentUser,
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
          tutorialCallout={tutorialTeamAccessCallout}
          onInvitesChange={onInvitesChange}
        />
      </div>
    </div>
  )
}
