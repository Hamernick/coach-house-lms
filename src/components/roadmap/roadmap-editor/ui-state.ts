import { type RoadmapSection, type RoadmapSectionStatus } from "@/lib/roadmap"

import { DEFAULT_PLACEHOLDER } from "./constants"
import { createDraft, isFrameworkSection } from "./helpers"
import { type RoadmapDraft } from "./types"

type DeriveRoadmapEditorSectionUiArgs = {
  sections: RoadmapSection[]
  activeId: string
  drafts: Record<string, RoadmapDraft>
}

export function deriveRoadmapEditorSectionUi({ sections, activeId, drafts }: DeriveRoadmapEditorSectionUiArgs) {
  const activeSection = sections.find((section) => section.id === activeId) ?? sections[0]
  const activeDraft = activeSection ? drafts[activeSection.id] ?? createDraft(activeSection) : null
  const headerTitle = activeSection ? (isFrameworkSection(activeSection) ? activeSection.templateTitle : activeSection.title) : ""
  const headerSubtitle = activeSection
    ? isFrameworkSection(activeSection)
      ? activeSection.templateSubtitle
      : activeSection.subtitle
    : ""
  const showSectionHeader = Boolean(headerTitle || headerSubtitle)
  const editorPlaceholder = activeSection?.placeholder ?? activeSection?.subtitleExample ?? DEFAULT_PLACEHOLDER
  const status: RoadmapSectionStatus = activeSection?.status ?? "not_started"
  const isCalendarSection = activeSection?.id === "board_calendar"
  const contentMaxWidth = isCalendarSection ? "max-w-none" : "max-w-3xl"

  return {
    activeSection,
    activeDraft,
    headerTitle,
    headerSubtitle,
    showSectionHeader,
    editorPlaceholder,
    status,
    isCalendarSection,
    contentMaxWidth,
  }
}
