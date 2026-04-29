"use client"

import type { RoadmapSection } from "@/lib/roadmap"
import { RoadmapRailCard, type RoadmapTimelineModule } from "@/components/roadmap/roadmap-rail-card"
import { WORKSPACE_ROADMAP_PATH } from "@/lib/workspace/routes"

type RoadmapOutlineCardProps = {
  sections: RoadmapSection[]
  modules?: RoadmapTimelineModule[]
}

export function RoadmapOutlineCard({ sections, modules = [] }: RoadmapOutlineCardProps) {
  return (
    <RoadmapRailCard
      sections={sections}
      title="The Accelerator"
      subtitle="Track classes and deliverables as you move through the accelerator."
      hrefBase={WORKSPACE_ROADMAP_PATH}
      layout="snake-grid"
      modules={modules}
    />
  )
}
