"use client"

import { RoadmapEditor } from "@/components/roadmap/roadmap-editor"
import type { RoadmapSection } from "@/lib/roadmap"

import type { WorkspaceDataDrawerRequest } from "./workspace-canvas-overlay-drawer-tabs"

export function WorkspaceCanvasOverlayRoadmapPanel({
  sections,
  publicSlug,
  canEdit,
  request,
}: {
  sections: RoadmapSection[]
  publicSlug: string | null
  canEdit: boolean
  request: WorkspaceDataDrawerRequest | null
}) {
  const requestedSectionSlug =
    request?.tab === "roadmap" ? request.roadmapSectionSlug : null
  const initialSectionId =
    sections.find(
      (section) =>
        section.slug === requestedSectionSlug ||
        section.id === requestedSectionSlug
    )?.id ?? null

  return (
    <div
      data-workspace-roadmap-drawer-panel="true"
      data-workspace-roadmap-section={requestedSectionSlug ?? undefined}
      className="box-border flex h-full min-h-0 w-full min-w-0 p-2 sm:p-3"
    >
      <RoadmapEditor
        sections={sections}
        publicSlug={publicSlug}
        canEdit={canEdit}
        navigationMode="embedded"
        showRightRail={false}
        initialSectionId={initialSectionId}
      />
    </div>
  )
}
