"use client"

import { useEffect, useState } from "react"
import SparklesIcon from "lucide-react/dist/esm/icons/sparkles"

import { ROADMAP_SECTION_ICONS } from "@/components/roadmap/roadmap-icons"
import { RoadmapEditorShell } from "@/components/roadmap/roadmap-editor/components"
import { useRoadmapEditorState } from "@/components/roadmap/roadmap-editor/hooks/use-roadmap-editor-state"
import type { RoadmapEditorProps } from "@/components/roadmap/roadmap-editor/types"

export type { RoadmapEditorLayout } from "@/components/roadmap/roadmap-editor/types"

export function RoadmapEditor(props: RoadmapEditorProps) {
  const { onDirtyChange } = props
  const [legacyPending, setLegacyPending] = useState(false)
  const [collaborationPending, setCollaborationPending] = useState(false)
  useEffect(() => { onDirtyChange?.(legacyPending || collaborationPending) }, [onDirtyChange, legacyPending, collaborationPending])
  const {
    activeSection,
    activeDraft,
    drafts,
    handleSectionSelect,
    roadmapBasePath,
    headerTitle,
    headerSubtitle,
    showSectionHeader,
    headerIconSize,
    headerTextRef,
    status,
    statusSelectDisabled,
    isHydrated,
    isCalendarSection,
    isBudgetSection,
    contentMaxWidth,
    editorPlaceholder,
    handleDraftChange,
    handleImageUpload,
    handleSave,
    isDirty,
    savingId,
    handleStatusChange,
    handleSavedSection,
  } = useRoadmapEditorState({ ...props, onDirtyChange: setLegacyPending })

  if (!activeSection || !activeDraft) {
    return null
  }

  const SectionIcon = ROADMAP_SECTION_ICONS[activeSection.id] ?? SparklesIcon

  return (
    <RoadmapEditorShell
      key={`${props.sourceScope?.userId}:${props.sourceScope?.organizationId}:${activeSection.id}`}
      sourceScope={props.sourceScope}
      sections={props.sections}
      activeSection={activeSection}
      drafts={drafts}
      roadmapBasePath={roadmapBasePath}
      onSectionSelect={handleSectionSelect}
      showRightRail={props.showRightRail ?? true}
      headerTitle={headerTitle}
      headerSubtitle={headerSubtitle}
      showSectionHeader={showSectionHeader}
      headerIconSize={headerIconSize}
      headerTextRef={headerTextRef}
      status={status}
      canEdit={props.canEdit ?? true}
      onStatusChange={handleStatusChange}
      onSavedSection={handleSavedSection}
      onCollaborationPending={setCollaborationPending}
      statusSelectDisabled={statusSelectDisabled}
      isHydrated={isHydrated}
      isCalendarSection={isCalendarSection}
      isBudgetSection={isBudgetSection}
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
