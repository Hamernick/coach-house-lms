"use client"

import type { RoadmapSection } from "@/lib/roadmap"
import { RoadmapRailCard, type RoadmapTimelineModule } from "@/components/roadmap/roadmap-rail-card"

type RoadmapOutlineCardProps = {
  sections: RoadmapSection[]
  modules?: RoadmapTimelineModule[]
}

export function RoadmapOutlineCard({ sections, modules = [] }: RoadmapOutlineCardProps) {
  return (
    <RoadmapRailCard
      sections={sections}
      title="The Framework"
      subtitle="Track lessons and deliverables as you move through the accelerator."
      hrefBase="/accelerator/roadmap"
      layout="snake-grid"
      modules={modules}
    />
  )
}
