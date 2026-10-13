"use client"

import SparklesIcon from "lucide-react/dist/esm/icons/sparkles"

import { ROADMAP_SECTION_ICONS } from "@/components/roadmap/roadmap-icons"
import { RoadmapEditorShell } from "@/components/roadmap/roadmap-editor/components"
import { useRoadmapEditorState } from "@/components/roadmap/roadmap-editor/hooks/use-roadmap-editor-state"
import type { RoadmapEditorProps } from "@/components/roadmap/roadmap-editor/types"

export type { RoadmapEditorLayout } from "@/components/roadmap/roadmap-editor/types"

export function RoadmapEditor(props: RoadmapEditorProps) {
  const {
    activeSection,
    activeDraft,
    drafts,
    handleSectionSelect,
    roadmapBasePath,
    roadmapReturnHref,
    roadmapReturnLabel,
    headerTitle,
    headerSubtitle,
    showSectionHeader,
    headerIconSize,
    headerTextRef,
    status,
    statusSelectDisabled,
    isHydrated,
    isCalendarSection,
    contentMaxWidth,
    editorPlaceholder,
    handleDraftChange,
    handleImageUpload,
    handleSave,
    isDirty,
    savingId,
    handleStatusChange,
  } = useRoadmapEditorState(props)

  if (!activeSection || !activeDraft) {
    return null
  }

  const SectionIcon = ROADMAP_SECTION_ICONS[activeSection.id] ?? SparklesIcon

  return (
    <RoadmapEditorShell
      sections={props.sections}
      activeSection={activeSection}
      drafts={drafts}
      roadmapBasePath={roadmapBasePath}
      onSectionSelect={handleSectionSelect}
      roadmapReturnHref={roadmapReturnHref}
      roadmapReturnLabel={roadmapReturnLabel}
      headerTitle={headerTitle}
      headerSubtitle={headerSubtitle}
      showSectionHeader={showSectionHeader}
      headerIconSize={headerIconSize}
      headerTextRef={headerTextRef}
      status={status}
      canEdit={props.canEdit ?? true}
      onStatusChange={handleStatusChange}
      statusSelectDisabled={statusSelectDisabled}
      isHydrated={isHydrated}
      isCalendarSection={isCalendarSection}
      contentMaxWidth={contentMaxWidth}
      activeDraft={activeDraft}
      editorPlaceholder={editorPlaceholder}
      onDraftChange={handleDraftChange}
      onImageUpload={handleImageUpload}
      onSave={handleSave}
      isDirty={isDirty}
      savingId={savingId}
      sectionIcon={SectionIcon}
    />
  )
}
