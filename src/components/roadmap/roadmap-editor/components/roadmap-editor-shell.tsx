import type { ComponentType, RefObject } from "react"

import { RightRailSlot } from "@/components/app-shell/right-rail"
import { RoadmapRightRailSection } from "@/components/roadmap/roadmap-right-rail-section"
import { Button } from "@/components/ui/button"
import { RoadmapBudgetTableEditor } from "@/components/roadmap/roadmap-budget-table-editor"
import { RoadmapCalendar } from "@/components/roadmap/roadmap-calendar"
import { RoadmapSectionPanel } from "@/components/roadmap/roadmap-section-panel"
import type { RoadmapSection, RoadmapSectionStatus } from "@/lib/roadmap"
import { PUBLIC_ORGANIZATION_PROFILE_SECTION_IDS } from "@/lib/roadmap/public-organization-profile-sections"

import { DEFAULT_PLACEHOLDER, ROADMAP_TOOLBAR_ID } from "../constants"
import type { RoadmapDraft } from "../types"

type RoadmapEditorShellProps = {
  sections: RoadmapSection[]
  activeSection: RoadmapSection
  drafts: Record<string, RoadmapDraft>
  roadmapBasePath: string
  onSectionSelect: (next: { id: string; slug: string }) => void
  showRightRail: boolean
  headerTitle: string
  headerSubtitle: string
  showSectionHeader: boolean
  headerIconSize: number | null
  headerTextRef: RefObject<HTMLDivElement | null>
  status: RoadmapSectionStatus
  canEdit: boolean
  onStatusChange: (nextStatus: RoadmapSectionStatus) => void
  statusSelectDisabled: boolean
  isHydrated: boolean
  isCalendarSection: boolean
  isBudgetSection: boolean
  contentMaxWidth: string
  activeDraft: RoadmapDraft
  editorPlaceholder: string
  onDraftChange: (updates: Partial<RoadmapDraft>) => void
  onImageUpload: (file: File) => Promise<string>
  onSave: () => void
  isDirty: boolean
  savingId: string | null
  sectionIcon: ComponentType<{ className?: string }>
}

export function RoadmapEditorShell({
  sections,
  activeSection,
  drafts,
  roadmapBasePath,
  onSectionSelect,
  showRightRail,
  headerTitle,
  headerSubtitle,
  showSectionHeader,
  headerIconSize,
  headerTextRef,
  status,
  canEdit,
  onStatusChange,
  statusSelectDisabled,
  isHydrated,
  isCalendarSection,
  isBudgetSection,
  contentMaxWidth,
  activeDraft,
  editorPlaceholder,
  onDraftChange,
  onImageUpload,
  onSave,
  isDirty,
  savingId,
  sectionIcon: SectionIcon,
}: RoadmapEditorShellProps) {
  const controlsPublicProfile = PUBLIC_ORGANIZATION_PROFILE_SECTION_IDS.has(
    activeSection.id
  )

  return (
    <>
      {showRightRail ? (
        <RightRailSlot>
          <RoadmapRightRailSection
            sections={sections}
            basePath={roadmapBasePath}
            activeSectionId={activeSection.id}
            drafts={drafts}
            onSectionSelect={onSectionSelect}
          />
        </RightRailSlot>
      ) : null}
      <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col gap-6 overflow-hidden">
        <RoadmapSectionPanel
          title={headerTitle}
          subtitle={headerSubtitle}
          icon={SectionIcon}
          status={controlsPublicProfile ? activeSection.status : status}
          controlsPublicProfile={controlsPublicProfile}
          canEdit={canEdit}
          onStatusChange={onStatusChange}
          statusSelectDisabled={statusSelectDisabled}
          isHydrated={isHydrated}
          showHeader={showSectionHeader}
          headerVariant={isCalendarSection ? "calendar" : "default"}
          headerIconSize={headerIconSize}
          headerTextRef={headerTextRef}
          contentMaxWidth={contentMaxWidth}
          toolbarSlotId={
            !isCalendarSection && !isBudgetSection
              ? ROADMAP_TOOLBAR_ID
              : undefined
          }
          body={
            isCalendarSection ? (
              <RoadmapCalendar />
            ) : isBudgetSection ? (
              <RoadmapBudgetTableEditor
                rows={activeDraft.budgetRows}
                canEdit={canEdit}
                isDirty={isDirty}
                isSaving={savingId === activeSection.id}
                onRowsChange={(budgetRows) => onDraftChange({ budgetRows })}
                onSave={onSave}
              />
            ) : undefined
          }
          editorProps={
            isCalendarSection || isBudgetSection
              ? undefined
              : {
                  value: activeDraft.content,
                  onChange: (value) => onDraftChange({ content: value }),
                  readOnly: !canEdit,
                  placeholder: editorPlaceholder,
                  header: activeDraft.placeholder ?? DEFAULT_PLACEHOLDER,
                  headerClassName:
                    "bg-[#f4f4f5] px-4 pt-4 pb-3 text-sm text-muted-foreground dark:bg-[#1f1f1f]",
                  countClassName:
                    "bg-[#e6e6e6] px-4 py-2 text-xs text-muted-foreground dark:bg-[#1c1c1c]",
                  contentClassName:
                    "flex-1 min-h-0 overflow-y-auto overscroll-contain bg-[#ededed] dark:bg-[#171717] rounded-none",
                  onImageUpload: canEdit ? onImageUpload : undefined,
                  insertUploadedImage: true,
                  disableResize: true,
                  toolbarTrailingActions: canEdit ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={onSave}
                      disabled={statusSelectDisabled || !isDirty}
                      className="text-muted-foreground hover:text-foreground gap-2"
                    >
                      {savingId === activeSection.id
                        ? "Saving…"
                        : isDirty
                          ? "Save"
                          : "Saved"}
                    </Button>
                  ) : null,
                  toolbarPortalId: ROADMAP_TOOLBAR_ID,
                  toolbarClassName:
                    "rounded-xl border border-border/60 bg-background/80 shadow-[0_1px_1px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_1px_rgba(0,0,0,0.24)]",
                  className:
                    "flex h-full min-h-0 flex-1 flex-col bg-card dark:bg-[#1f1f1f]",
                  editorClassName:
                    "flex-1 min-h-0 h-full overflow-visible rounded-none bg-transparent dark:bg-[#171717]",
                }
          }
        />
      </div>
    </>
  )
}
