"use client"

import ChevronDownIcon from "lucide-react/dist/esm/icons/chevron-down"
import WaypointsIcon from "lucide-react/dist/esm/icons/waypoints"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Tabs } from "@/components/ui/tabs"
import type {
  WorkspaceAcceleratorCardInput,
  WorkspaceAcceleratorCardRuntimeActions,
  WorkspaceAcceleratorCardRuntimeSnapshot,
  WorkspaceAcceleratorCardStep,
} from "@/features/workspace-accelerator-card"
import { cn } from "@/lib/utils"

import { WorkspaceBoardCalendarCard } from "./workspace-board-calendar-card"
import { WorkspaceBoardCardFrame } from "./workspace-board-card-frame"
import { WorkspaceBoardCommunicationsCard } from "./workspace-board-communications-card"
import { EconomicEngineCard } from "./workspace-board-node-static-cards"
import { WORKSPACE_CARD_META } from "./workspace-board-copy"
import type { WorkspaceBoardNodeData } from "./workspace-board-node-types"
import {
  isWorkspaceProgramsPreviewOnlyStep,
  WorkspaceBoardProgramsCard,
} from "./workspace-board-programs-card"
import {
  WorkspaceBoardAtlasCard,
  WorkspaceBoardBrandKitCard,
  WorkspaceBoardExecutionCard,
  WorkspaceBoardRoadmapCard,
} from "./workspace-board-node-tool-cards"
import type { WorkspaceBoardExecutionTab } from "./workspace-board-node-tool-card-execution"
import type {
  WorkspaceCardOverflowAction,
  WorkspaceCardSize,
} from "./workspace-board-types"
import { WorkspaceBoardLazyAcceleratorCardPanel } from "./workspace-board-accelerator-lazy"
import {
  renderAcceleratorTitleIcon,
  resolveAcceleratorHeaderDetails,
  resolveAcceleratorHeaderMeta,
} from "./workspace-board-node-card-accelerator-support"

export function renderWorkspaceBoardResolvedCard({
  cardId,
  cardMeta,
  comingSoonTitleBadge,
  acceleratorCardHref,
  acceleratorCardInput,
  acceleratorHeaderDetails,
  acceleratorHeaderMeta,
  acceleratorRuntimeSnapshot: _acceleratorRuntimeSnapshot,
  acceleratorTutorialCallout,
  acceleratorTutorialInteractionPolicy,
  canEdit,
  communications,
  communicationsMenuActions,
  contentClassName,
  data,
  effectiveCardSize,
  executionActiveTab,
  executionHeaderMeta,
  frameFullscreenToggle,
  hideHeaderSubtitle,
  isCanvasFullscreen,
  onAcceleratorRuntimeActionsChange,
  onAcceleratorRuntimeChange,
  onAcceleratorTutorialActionComplete,
  onCommunicationsMenuActionsChange,
  onExecutionTabChange,
  onProgramsCreateOpenChange,
  onRequestOpenAcceleratorStep,
  onRoadmapNavigatorCollapsedChange,
  onSizeChange,
  presentationMode,
  programsCreateOpen,
  roadmapNavigatorCollapsed,
  seed,
  shouldTrackEmbeddedAcceleratorRuntime,
}: {
  cardId: WorkspaceBoardNodeData["cardId"]
  cardMeta: (typeof WORKSPACE_CARD_META)[WorkspaceBoardNodeData["cardId"]]
  comingSoonTitleBadge?: ReactNode
  acceleratorCardHref: string
  acceleratorCardInput: WorkspaceAcceleratorCardInput
  acceleratorHeaderDetails: ReturnType<typeof resolveAcceleratorHeaderDetails>
  acceleratorHeaderMeta: ReturnType<typeof resolveAcceleratorHeaderMeta>
  acceleratorRuntimeSnapshot: WorkspaceAcceleratorCardRuntimeSnapshot | null
  acceleratorTutorialCallout: WorkspaceBoardNodeData["acceleratorTutorialCallout"]
  acceleratorTutorialInteractionPolicy: WorkspaceBoardNodeData["acceleratorTutorialInteractionPolicy"]
  canEdit: boolean
  communications: WorkspaceBoardNodeData["communications"]
  communicationsMenuActions: WorkspaceCardOverflowAction[]
  contentClassName: string | undefined
  data: WorkspaceBoardNodeData
  effectiveCardSize: WorkspaceCardSize
  executionActiveTab: WorkspaceBoardExecutionTab
  executionHeaderMeta?: ReactNode
  frameFullscreenToggle?: () => void
  hideHeaderSubtitle: boolean
  isCanvasFullscreen: boolean
  onAcceleratorRuntimeActionsChange?: (
    actions: WorkspaceAcceleratorCardRuntimeActions
  ) => void
  onAcceleratorRuntimeChange?: (
    snapshot: WorkspaceAcceleratorCardRuntimeSnapshot
  ) => void
  onAcceleratorTutorialActionComplete?: (
    mode?: "complete" | "complete-and-advance"
  ) => void
  onCommunicationsMenuActionsChange: (
    actions: WorkspaceCardOverflowAction[]
  ) => void
  onExecutionTabChange: (nextValue: string) => void
  onProgramsCreateOpenChange: (open: boolean) => void
  onRequestOpenAcceleratorStep: ({
    step,
    selectedLessonGroupKey,
  }: {
    step: WorkspaceAcceleratorCardStep
    selectedLessonGroupKey: string | null
  }) => boolean
  onRoadmapNavigatorCollapsedChange: (next: boolean) => void
  onSizeChange: WorkspaceBoardNodeData["onSizeChange"]
  presentationMode: boolean
  programsCreateOpen: boolean
  roadmapNavigatorCollapsed: boolean
  seed: WorkspaceBoardNodeData["seed"]
  shouldTrackEmbeddedAcceleratorRuntime: boolean
}) {
  if (cardId === "deck") {
    return (
      <Tabs
        value={executionActiveTab}
        onValueChange={onExecutionTabChange}
        className="flex min-h-0 flex-1 flex-col gap-0"
      >
        <WorkspaceBoardCardFrame
          cardId={cardId}
          title={cardMeta.title}
          subtitle={cardMeta.subtitle}
          titleBadge={comingSoonTitleBadge}
          tone="accelerator"
          titleIcon={renderAcceleratorTitleIcon()}
          hideTitle={false}
          hideSubtitle={hideHeaderSubtitle}
          headerMeta={executionHeaderMeta}
          size={effectiveCardSize}
          presentationMode={presentationMode}
          onSizeChange={(nextSize) => onSizeChange(cardId, nextSize)}
          fullHref={acceleratorCardHref}
          canEdit={canEdit}
          contentClassName={contentClassName}
          menuActions={undefined}
          editorHref={null}
          isCanvasFullscreen={isCanvasFullscreen}
          onToggleCanvasFullscreen={frameFullscreenToggle}
          fullscreenControlMode="overflow"
        >
          <WorkspaceBoardExecutionCard
            roadmapSections={
              data.organizationEditorData?.roadmapSections ??
              seed.roadmapSections
            }
            acceleratorInput={acceleratorCardInput}
            onRuntimeChange={
              shouldTrackEmbeddedAcceleratorRuntime
                ? onAcceleratorRuntimeChange
                : undefined
            }
            onRuntimeActionsChange={
              shouldTrackEmbeddedAcceleratorRuntime
                ? onAcceleratorRuntimeActionsChange
                : undefined
            }
            tutorialCallout={null}
            tutorialInteractionPolicy={null}
            onTutorialActionComplete={undefined}
            onRequestOpenStep={onRequestOpenAcceleratorStep}
          />
        </WorkspaceBoardCardFrame>
      </Tabs>
    )
  }

  const programsPreviewOnly = isWorkspaceProgramsPreviewOnlyStep(
    data.tutorialStepId
  )

  return (
    <WorkspaceBoardCardFrame
      cardId={cardId}
      title={cardId === "roadmap" ? "Strategic Roadmap" : cardMeta.title}
      subtitle={cardMeta.subtitle}
      titleBadge={comingSoonTitleBadge}
      tone={cardId === "accelerator" ? "accelerator" : "default"}
      titleIcon={
        cardId === "accelerator" ? (
          renderAcceleratorTitleIcon()
        ) : cardId === "roadmap" ? (
          <WaypointsIcon className="size-4" aria-hidden />
        ) : null
      }
      hideTitle={cardId === "accelerator"}
      hideSubtitle={hideHeaderSubtitle}
      headerDetails={
        cardId === "accelerator" ? acceleratorHeaderDetails : undefined
      }
      headerMeta={cardId === "accelerator" ? acceleratorHeaderMeta : undefined}
      headerAction={
        cardId === "roadmap" ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-md"
            aria-label={
              roadmapNavigatorCollapsed
                ? "Expand strategic roadmap"
                : "Collapse strategic roadmap"
            }
            aria-controls="roadmap-section-picker-trigger"
            aria-expanded={!roadmapNavigatorCollapsed}
            onClick={() =>
              onRoadmapNavigatorCollapsedChange(!roadmapNavigatorCollapsed)
            }
          >
            <ChevronDownIcon
              className={cn(
                "text-muted-foreground h-3.5 w-3.5 transition-transform",
                roadmapNavigatorCollapsed && "-rotate-90"
              )}
              aria-hidden
            />
          </Button>
        ) : cardId === "programs" && canEdit ? (
          <Button
            type="button"
            size="sm"
            className="h-7 rounded-lg px-2.5 text-[11px]"
            disabled={programsPreviewOnly}
            onClick={() => onProgramsCreateOpenChange(true)}
          >
            Add
          </Button>
        ) : undefined
      }
      size={effectiveCardSize}
      presentationMode={presentationMode}
      onSizeChange={(nextSize) =>
        onSizeChange(
          cardId,
          cardId === "communications" && nextSize === "sm" ? "md" : nextSize
        )
      }
      fullHref={
        cardId === "accelerator" ? acceleratorCardHref : cardMeta.fullHref
      }
      canEdit={canEdit}
      contentClassName={contentClassName}
      menuActions={
        cardId === "communications" ? communicationsMenuActions : undefined
      }
      editorHref={null}
      isCanvasFullscreen={isCanvasFullscreen}
      onToggleCanvasFullscreen={frameFullscreenToggle}
      fullscreenControlMode="overflow"
    >
      {cardId === "accelerator" ? (
        <WorkspaceBoardLazyAcceleratorCardPanel
          input={acceleratorCardInput}
          presentationMode="embedded"
          onRuntimeChange={
            shouldTrackEmbeddedAcceleratorRuntime
              ? onAcceleratorRuntimeChange
              : undefined
          }
          onRuntimeActionsChange={
            shouldTrackEmbeddedAcceleratorRuntime
              ? onAcceleratorRuntimeActionsChange
              : undefined
          }
          tutorialCallout={acceleratorTutorialCallout}
          tutorialInteractionPolicy={acceleratorTutorialInteractionPolicy}
          tutorialMode={
            data.tutorialStepId === "accelerator-close-module"
              ? "module-preview"
              : null
          }
          onTutorialActionComplete={onAcceleratorTutorialActionComplete}
          onRequestOpenStep={onRequestOpenAcceleratorStep}
        />
      ) : null}
      {cardId === "programs" ? (
        <WorkspaceBoardProgramsCard
          programs={data.organizationEditorData?.programs ?? []}
          legacyProgramsValue={
            data.organizationEditorData?.initialProfile.programs
          }
          canEdit={canEdit}
          createOpen={programsCreateOpen}
          onCreateOpenChange={onProgramsCreateOpenChange}
          previewOnly={programsPreviewOnly}
        />
      ) : null}
      {cardId === "brand-kit" ? (
        <WorkspaceBoardBrandKitCard
          profile={seed.initialProfile}
          canEdit={canEdit}
          presentationMode={presentationMode}
        />
      ) : null}
      {cardId === "economic-engine" ? (
        <EconomicEngineCard
          size={effectiveCardSize}
          seed={seed}
          presentationMode={presentationMode}
        />
      ) : null}
      {cardId === "calendar" ? (
        <WorkspaceBoardCalendarCard
          calendar={seed.calendar}
          canEdit={canEdit}
          formationStatus={seed.initialProfile.formationStatus ?? null}
          cardSize={effectiveCardSize}
          isCanvasFullscreen={isCanvasFullscreen}
          presentationMode={presentationMode}
        />
      ) : null}
      {cardId === "communications" ? (
        <WorkspaceBoardCommunicationsCard
          canEdit={canEdit}
          presentationMode={presentationMode}
          cardSize={effectiveCardSize}
          isCanvasFullscreen={isCanvasFullscreen}
          communications={communications}
          activityFeed={seed.activityFeed}
          profile={seed.initialProfile}
          onChange={data.onCommunicationsChange}
          onMenuActionsChange={onCommunicationsMenuActionsChange}
        />
      ) : null}
      {cardId === "roadmap" ? (
        <WorkspaceBoardRoadmapCard
          collapsed={roadmapNavigatorCollapsed}
          sections={
            data.organizationEditorData?.roadmapSections ?? seed.roadmapSections
          }
        />
      ) : null}
      {cardId === "atlas" ? (
        <WorkspaceBoardAtlasCard
          size={effectiveCardSize}
          presentationMode={presentationMode}
          seed={seed}
          profile={
            data.organizationEditorData?.initialProfile ?? seed.initialProfile
          }
          tutorialStepId={data.tutorialStepId ?? null}
        />
      ) : null}
    </WorkspaceBoardCardFrame>
  )
}
