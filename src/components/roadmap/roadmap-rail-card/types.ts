import type { ModuleCard } from "@/lib/accelerator/progress"
import type { RoadmapSection } from "@/lib/roadmap"

export type RoadmapTimelineModule = ModuleCard & {
  groupTitle?: string
  sequence?: number
}

export type RoadmapRailItem = RoadmapSection & {
  displayTitle: string
  displaySubtitle: string
  href: string
  idx: number
}

export type TimelineCard =
  | { kind: "deliverable"; key: string; item: RoadmapRailItem }
  | { kind: "module"; key: string; module: RoadmapTimelineModule }

export type LessonGroupOption = {
  key: string
  label: string
  moduleIds: Set<string>
  moduleIndexes: Set<number>
}
