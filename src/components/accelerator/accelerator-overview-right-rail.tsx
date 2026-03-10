"use client"

import Link from "next/link"
import WaypointsIcon from "lucide-react/dist/esm/icons/waypoints"

import { RightRailSlot } from "@/components/app-shell/right-rail"
import type { RoadmapSectionStatus } from "@/lib/roadmap"
import { cn } from "@/lib/utils"

type AcceleratorOverviewRightRailProps = {
  sections: Array<{
    id: string
    title: string
    slug: string
    status: RoadmapSectionStatus
  }>
}

export function AcceleratorOverviewRightRail({ sections }: AcceleratorOverviewRightRailProps) {
  return (
    <>
      <RightRailSlot priority={1}>
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <WaypointsIcon className="h-4 w-4" aria-hidden />
            Strategic Roadmap
          </p>
          <div className="relative w-full min-w-0 space-y-1.5 pl-4 pr-2 text-sm">
            <span aria-hidden className="absolute left-1 top-0 h-full w-px rounded-full bg-border/60" />
            {sections.map((section) => {
              const statusClass =
                section.status === "complete"
                  ? "bg-emerald-500"
                  : section.status === "in_progress"
                    ? "bg-amber-500"
                    : "bg-border"

              return (
                <Link
                  key={section.id}
                  href={`/workspace/roadmap/${section.slug}`}
                  className="group flex min-w-0 items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span className="min-w-0 truncate text-sm font-medium">{section.title}</span>
                  <span aria-hidden className={cn("h-2 w-2 shrink-0 rounded-full", statusClass)} />
                </Link>
              )
            })}
          </div>
        </div>
      </RightRailSlot>
    </>
  )
}
