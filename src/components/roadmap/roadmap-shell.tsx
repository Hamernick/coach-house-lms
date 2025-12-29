"use client"

import { useState } from "react"

import WaypointsIcon from "lucide-react/dist/esm/icons/waypoints"

import { RoadmapEditor } from "@/components/roadmap/roadmap-editor"
import type { RoadmapSection } from "@/lib/roadmap"

type RoadmapShellProps = {
  sections: RoadmapSection[]
  publicSlug: string | null
  initialPublic: boolean
}

export function RoadmapShell({ sections, publicSlug, initialPublic }: RoadmapShellProps) {
  const [isPublic, setIsPublic] = useState(initialPublic)

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <div className="space-y-3 sm:max-w-2xl">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border/60 bg-muted/40 text-muted-foreground">
            <WaypointsIcon className="h-5 w-5" aria-hidden />
          </span>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Strategic roadmap</h1>
            <p className="text-sm text-muted-foreground">
              A pitch-ready snapshot of what you are building. Use it to show funders a clear path, proof of progress,
              and what comes next.
            </p>
          </div>
        </div>
      </header>

      <RoadmapEditor
        sections={sections}
        publicSlug={publicSlug}
        roadmapIsPublic={isPublic}
        onRoadmapPublicChange={setIsPublic}
      />
    </div>
  )
}
