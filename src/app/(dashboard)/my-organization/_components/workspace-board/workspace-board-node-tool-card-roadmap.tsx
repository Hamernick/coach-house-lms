"use client"

import { useMemo } from "react"

import { RoadmapNavigatorSection } from "@/components/roadmap/roadmap-navigator-section"
import { resolveRoadmapSections } from "@/lib/roadmap"

type WorkspaceBoardRoadmapCardProps = {
  profile: Parameters<typeof resolveRoadmapSections>[0]
}

export function WorkspaceBoardRoadmapCard({
  profile,
}: WorkspaceBoardRoadmapCardProps) {
  const roadmapSections = useMemo(() => resolveRoadmapSections(profile), [profile])

  return (
    <div className="px-1 pb-1">
      <RoadmapNavigatorSection
        sections={roadmapSections}
        basePath="/workspace/roadmap"
      />
    </div>
  )
}
