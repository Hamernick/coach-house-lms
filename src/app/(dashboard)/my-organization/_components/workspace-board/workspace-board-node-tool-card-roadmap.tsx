"use client"

import { RoadmapNavigatorSection } from "@/components/roadmap/roadmap-navigator-section"
import type { RoadmapSection } from "@/lib/roadmap"
import { WORKSPACE_ROADMAP_PATH } from "@/lib/workspace/routes"

type WorkspaceBoardRoadmapCardProps = {
  sections: RoadmapSection[]
}

export function WorkspaceBoardRoadmapCard({
  sections,
}: WorkspaceBoardRoadmapCardProps) {
  return (
    <div className="px-1 pb-1">
      <RoadmapNavigatorSection
        sections={sections}
        basePath={WORKSPACE_ROADMAP_PATH}
      />
    </div>
  )
}
