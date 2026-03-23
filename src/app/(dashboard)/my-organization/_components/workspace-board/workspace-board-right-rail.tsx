"use client"

import { memo } from "react"
import LayoutIcon from "lucide-react/dist/esm/icons/layout"
import WaypointsIcon from "lucide-react/dist/esm/icons/waypoints"

import { RightRailSlot } from "@/components/app-shell/right-rail"
import { Button } from "@/components/ui/button"

import { WorkspaceBoardTeamAccessSection } from "./workspace-board-team-access-section"
import type {
  WorkspaceAutoLayoutMode,
  WorkspaceCollaborationInvite,
  WorkspaceMemberOption,
} from "./workspace-board-types"

const RAIL_SECTION_CLASSNAME = "space-y-2 px-0.5"

export const WorkspaceBoardRightRail = memo(function WorkspaceBoardRightRail({
  autoLayoutMode,
  canEdit,
  canInvite,
  members,
  invites,
  realtimeState,
  currentUser,
  tutorialTeamAccessCallout,
  onAutoLayoutModeChange,
  onInvitesChange,
}: {
  autoLayoutMode: WorkspaceAutoLayoutMode
  canEdit: boolean
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
  onAutoLayoutModeChange: (nextMode: WorkspaceAutoLayoutMode) => void
  onInvitesChange: (nextInvites: WorkspaceCollaborationInvite[]) => void
}) {
  return (
    <>
      <RightRailSlot priority={10}>
        <div className="space-y-4">
          <section className={RAIL_SECTION_CLASSNAME} aria-label="Layout controls">
            <p className="px-1 text-sm font-medium text-foreground">Layout</p>
            <div className="grid grid-cols-2 gap-1.5">
              <Button
                type="button"
                variant={autoLayoutMode === "dagre-tree" ? "secondary" : "outline"}
                size="sm"
                className="h-8 justify-start px-2 text-xs"
                disabled={!canEdit}
                onClick={() => onAutoLayoutModeChange("dagre-tree")}
              >
                <LayoutIcon className="h-3.5 w-3.5" aria-hidden />
                Dagre Tree
              </Button>
              <Button
                type="button"
                variant={autoLayoutMode === "timeline" ? "secondary" : "outline"}
                size="sm"
                className="h-8 justify-start px-2 text-xs"
                disabled={!canEdit}
                onClick={() => onAutoLayoutModeChange("timeline")}
              >
                <WaypointsIcon className="h-3.5 w-3.5" aria-hidden />
                Linear
              </Button>
            </div>
          </section>

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
      </RightRailSlot>

    </>
  )
})

WorkspaceBoardRightRail.displayName = "WorkspaceBoardRightRail"
