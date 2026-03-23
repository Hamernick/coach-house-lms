"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { RoadmapEditorToc } from "@/components/roadmap/roadmap-editor/components/roadmap-editor-toc"
import { ROADMAP_TOC_GROUP_PARENT_BY_CHILD } from "@/components/roadmap/roadmap-editor/constants"
import {
  buildRoadmapTocItems,
  createDraftMap,
  isFrameworkSection,
  resolveRoadmapSectionStatus,
} from "@/components/roadmap/roadmap-editor/helpers"
import { useRoadmapEditorLayoutMetrics } from "@/components/roadmap/roadmap-editor/hooks/use-roadmap-editor-layout-metrics"
import type { RoadmapDraft } from "@/components/roadmap/roadmap-editor/types"
import type { RoadmapSection } from "@/lib/roadmap"

export type RoadmapNavigatorSectionProps = {
  sections: RoadmapSection[]
  basePath: string
  activeSectionId?: string | null
  drafts?: Record<string, RoadmapDraft>
  onSectionSelect?: (next: { id: string; slug: string }) => void
}

const DEFAULT_OPEN_GROUPS = {
  fundraising: true,
  board_strategy: true,
} as const

export function RoadmapNavigatorSection({
  sections,
  basePath,
  activeSectionId = null,
  drafts,
  onSectionSelect,
}: RoadmapNavigatorSectionProps) {
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [openGroups, setOpenGroups] =
    useState<Record<string, boolean>>(DEFAULT_OPEN_GROUPS)
  const tocItems = useMemo(() => buildRoadmapTocItems(sections), [sections])
  const resolvedDrafts = useMemo(
    () => drafts ?? createDraftMap(sections),
    [drafts, sections],
  )
  const { tocIndicator, sectionsListRef } = useRoadmapEditorLayoutMetrics({
    activeId: activeSectionId ?? "",
    openGroups,
    sections,
    headerTitle: "",
    headerSubtitle: "",
  })

  useEffect(() => {
    const parentId = ROADMAP_TOC_GROUP_PARENT_BY_CHILD.get(activeSectionId ?? "")
    if (!parentId) return
    setOpenGroups((previous) =>
      previous[parentId] ? previous : { ...previous, [parentId]: true },
    )
  }, [activeSectionId])

  const handleToggleGroup = useCallback((groupId: string) => {
    setOpenGroups((previous) => ({
      ...previous,
      [groupId]: !(previous[groupId] ?? true),
    }))
  }, [])

  const handleSectionClick = useCallback(
    (next: { id: string; slug: string }) => {
      if (onSectionSelect) {
        onSectionSelect(next)
        return
      }
      router.push(`${basePath}/${next.slug}`)
    },
    [basePath, onSectionSelect, router],
  )

  return (
    <section className="space-y-2 px-0.5" aria-label="Strategic roadmap">
      <RoadmapEditorToc
        tocItems={tocItems}
        activeSectionId={activeSectionId ?? ""}
        drafts={resolvedDrafts}
        openGroups={openGroups}
        tocIndicator={tocIndicator}
        sectionsListRef={sectionsListRef}
        onSectionSelect={handleSectionClick}
        onToggleGroup={handleToggleGroup}
        isFrameworkSection={isFrameworkSection}
        resolveSectionStatus={resolveRoadmapSectionStatus}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
      />
    </section>
  )
}
