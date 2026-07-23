"use client"

import { memo } from "react"

import { RoadmapNavigatorSection } from "@/components/roadmap/roadmap-navigator-section"
import { RightRailSlot } from "@/components/app-shell/right-rail"
import type { RoadmapSection } from "@/lib/roadmap"
import { WORKSPACE_ROADMAP_PATH } from "@/lib/workspace/routes"

const RAIL_SECTION_CLASSNAME = "space-y-2 px-0.5"
const WORKSPACE_RIGHT_RAIL_CONTENT_CLASSNAME =
  "space-y-4 pt-10 md:-mt-2 md:pt-0"

export const WorkspaceBoardRightRail = memo(function WorkspaceBoardRightRail({
  roadmapSections,
}: {
  roadmapSections: RoadmapSection[]
}) {
  return (
    <RightRailSlot priority={10}>
      <WorkspaceBoardRightRailContent roadmapSections={roadmapSections} />
    </RightRailSlot>
  )
})

WorkspaceBoardRightRail.displayName = "WorkspaceBoardRightRail"

export function WorkspaceBoardRightRailContent({
  roadmapSections,
}: {
  roadmapSections: RoadmapSection[]
}) {
  return (
    <div className={WORKSPACE_RIGHT_RAIL_CONTENT_CLASSNAME}>
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
