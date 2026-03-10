"use client"

import { memo, useMemo } from "react"
import LayoutIcon from "lucide-react/dist/esm/icons/layout"
import WaypointsIcon from "lucide-react/dist/esm/icons/waypoints"

import { RightRailSlot } from "@/components/app-shell/right-rail"
import { RoadmapRightRailSection } from "@/components/roadmap/roadmap-right-rail-section"
import { Button } from "@/components/ui/button"
import { resolveRoadmapSections } from "@/lib/roadmap"

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
  profile,
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
  profile: Parameters<typeof resolveRoadmapSections>[0]
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
  const roadmapSections = useMemo(() => resolveRoadmapSections(profile), [profile])

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
            <p className="px-1 text-[11px] text-muted-foreground">
              Dagre Tree arranges the workspace as a horizontal tree. Linear guides the next move from left to right.
            </p>
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

          <RoadmapRightRailSection
            sections={roadmapSections}
            basePath="/workspace/roadmap"
          />
        </div>
      </RightRailSlot>

    </>
  )
})

WorkspaceBoardRightRail.displayName = "WorkspaceBoardRightRail"
