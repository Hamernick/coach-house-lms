"use client"

import { useEffect, useRef } from "react"

import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

import { useWorkspaceBoardFormationTrackerController } from "./workspace-board-formation-tracker-card-controller"
import { WorkspaceBoardFormationTrackerEditorPanel } from "./workspace-board-formation-tracker-editor-panel"
import {
  TrackerAcceleratorTab,
  TrackerTicketsTab,
} from "./workspace-board-formation-tracker-card-panels"
import type {
  WorkspaceCardSize,
  WorkspaceSeedData,
  WorkspaceTrackerState,
} from "./workspace-board-types"

type FormationTrackerCardProps = {
  size: WorkspaceCardSize
  seed: WorkspaceSeedData
  presentationMode: boolean
  tracker: WorkspaceTrackerState
  onTrackerChange: (next: WorkspaceTrackerState) => void
  focusRequest?: { id: number; ticketId: string | null } | null
}

export function WorkspaceBoardFormationTrackerCard({
  size,
  seed,
  presentationMode,
  tracker,
  onTrackerChange,
  focusRequest = null,
}: FormationTrackerCardProps) {
  const isCompactCard = size === "sm" && !presentationMode
  const maxVisibleModulesPerGroup = presentationMode ? 4 : isCompactCard ? 2 : 3
  const controller = useWorkspaceBoardFormationTrackerController({
    seed,
    presentationMode,
    tracker,
    onTrackerChange,
  })
  const handledFocusRequestIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (!focusRequest || handledFocusRequestIdRef.current === focusRequest.id) {
      return
    }
    handledFocusRequestIdRef.current = focusRequest.id
    controller.setTab("objectives")
    if (focusRequest.ticketId && seed.canEdit && !presentationMode) {
      controller.openTicketEditor(focusRequest.ticketId)
    }
  }, [controller, focusRequest, presentationMode, seed.canEdit])

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col pb-3",
        isCompactCard ? "gap-2" : "gap-2.5"
      )}
    >
      <div className="space-y-0.5">
        <p className="text-muted-foreground text-xs">
          <span className="text-foreground/90 font-medium">
            {seed.initialProfile.formationStatus === "approved"
              ? "IRS Approved"
              : "Pre-501(c)(3)"}
          </span>{" "}
          <span className="tabular-nums">
            · {seed.formationSummary.completedCount}/
            {seed.formationSummary.visibleModules.length} complete
          </span>
        </p>
      </div>

      <div className={cn("space-y-1.5", isCompactCard && "space-y-1")}>
        <div className="flex items-center justify-between gap-2 px-1">
          <p className="text-foreground text-sm font-semibold">Objectives</p>
          <p className="text-foreground text-xs font-semibold tabular-nums">
            {seed.formationSummary.progressPercent}%
          </p>
        </div>
        <Progress
          value={seed.formationSummary.progressPercent}
          className={cn("h-1.5", isCompactCard && "h-1")}
        />
      </div>

      <Tabs
        value={tracker.tab}
        onValueChange={(nextValue) =>
          controller.setTab(
            nextValue === "objectives" ? "objectives" : "accelerator"
          )
        }
        className="min-h-0 flex-1 gap-2"
      >
        <TabsList className="border-border/70 bg-background/70 inline-flex w-fit items-center rounded-full border p-1">
          <TabsTrigger
            value="accelerator"
            className="data-[state=active]:bg-foreground data-[state=active]:text-background rounded-full px-2.5 py-1 text-[11px]"
          >
            Accelerator
          </TabsTrigger>
          <TabsTrigger
            value="objectives"
            className="data-[state=active]:bg-foreground data-[state=active]:text-background rounded-full px-2.5 py-1 text-[11px]"
          >
            Objectives
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="accelerator"
          className="min-h-0 data-[state=active]:flex data-[state=active]:flex-col"
        >
          <TrackerAcceleratorTab
            presentationMode={presentationMode}
            tracker={tracker}
            collapsedSections={controller.collapsedSections}
            groups={controller.acceleratorGroups}
            maxVisibleModulesPerGroup={maxVisibleModulesPerGroup}
            onToggleSection={controller.toggleSectionCollapsed}
            onToggleGroupArchive={controller.toggleAcceleratorGroupArchive}
          />
        </TabsContent>

        <TabsContent
          value="objectives"
          className="min-h-0 flex-1 data-[state=active]:flex data-[state=active]:flex-col"
        >
          {controller.editingTicketId ? (
            <WorkspaceBoardFormationTrackerEditorPanel
              editTitle={controller.editTitle}
              onEditTitleChange={controller.setEditTitle}
              editDescription={controller.editDescription}
              onEditDescriptionChange={controller.setEditDescription}
              editPriority={controller.editPriority}
              onEditPriorityChange={controller.setEditPriority}
              editDueDate={controller.editDueDate}
              onEditDueDateChange={controller.setEditDueDate}
              editCategoryId={controller.editCategoryId}
              onEditCategoryIdChange={controller.setEditCategoryId}
              editAssigneeIds={controller.editAssigneeIds}
              members={seed.members}
              activeCategories={controller.activeCategories}
              onToggleAssignee={controller.toggleEditAssignee}
              onCancel={controller.closeTicketEditor}
              onSave={controller.saveTicketEdits}
            />
          ) : null}

          <TrackerTicketsTab
            presentationMode={presentationMode}
            members={seed.members}
            activeCategories={controller.activeCategories}
            archivedCategories={controller.archivedCategories}
            collapsedSections={controller.collapsedSections}
            ticketQuery={controller.ticketQuery}
            onTicketQueryChange={controller.setTicketQuery}
            ticketStatusFilter={controller.ticketStatusFilter}
            onTicketStatusFilterChange={controller.setTicketStatusFilter}
            draftCategoryTitle={controller.draftCategoryTitle}
            onDraftCategoryTitleChange={controller.setDraftCategoryTitle}
            draftTicketTitle={controller.draftTicketTitle}
            onDraftTicketTitleChange={controller.setDraftTicketTitle}
            draftTicketDescription={controller.draftTicketDescription}
            onDraftTicketDescriptionChange={
              controller.setDraftTicketDescription
            }
            draftTicketPriority={controller.draftTicketPriority}
            onDraftTicketPriorityChange={controller.setDraftTicketPriority}
            draftTicketDueDate={controller.draftTicketDueDate}
            onDraftTicketDueDateChange={controller.setDraftTicketDueDate}
            draftTicketAssigneeId={controller.draftTicketAssigneeId}
            onDraftTicketAssigneeIdChange={controller.setDraftTicketAssigneeId}
            draftTicketCategoryId={controller.draftTicketCategoryId}
            onDraftTicketCategoryIdChange={controller.setDraftTicketCategoryId}
            ticketsByCategory={controller.ticketsByCategory}
            openTicketCount={controller.openTicketCount}
            doneTicketCount={controller.doneTicketCount}
            onToggleSection={controller.toggleSectionCollapsed}
            onToggleCategoryArchive={controller.toggleCategoryArchive}
            onToggleTicketStatus={controller.toggleTicketStatus}
            onEditTicket={controller.openTicketEditor}
            onCreateCategory={controller.createCategory}
            onCreateTicket={controller.createTicket}
          />
          {controller.isSyncingObjectives ? (
            <p className="text-muted-foreground px-0.5 text-[11px]">Syncing…</p>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  )
}
