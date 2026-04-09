"use client"

import { useCallback, type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Tabs } from "@/components/ui/tabs"
import { WORKSPACE_MAP_FEATURE_ENABLED } from "@/lib/workspace-map-feature"
import type {
  WorkspaceAcceleratorCardInput,
  WorkspaceAcceleratorCardRuntimeActions,
  WorkspaceAcceleratorCardRuntimeSnapshot,
  WorkspaceAcceleratorCardStep,
} from "@/features/workspace-accelerator-card"

import { WorkspaceBoardCalendarCard } from "./workspace-board-calendar-card"
import { WorkspaceBoardCardFrame } from "./workspace-board-card-frame"
import { WorkspaceBoardCommunicationsCard } from "./workspace-board-communications-card"
import { WorkspaceBoardOrganizationMapButton } from "./workspace-board-organization-map-button"
import { WorkspaceBoardOrganizationCardShell } from "./workspace-board-organization-card-shell"
import { EconomicEngineCard, OrganizationOverviewCard } from "./workspace-board-node-static-cards"
import { WORKSPACE_CARD_META } from "./workspace-board-copy"
import type { WorkspaceBoardNodeData } from "./workspace-board-node-types"
import { isWorkspaceProgramsPreviewOnlyStep, WorkspaceBoardProgramsCard } from "./workspace-board-programs-card"
import { WorkspaceBoardAtlasCard, WorkspaceBoardBrandKitCard, WorkspaceBoardExecutionCard, WorkspaceBoardRoadmapCard } from "./workspace-board-node-tool-cards"
import type { WorkspaceBoardExecutionTab } from "./workspace-board-node-tool-card-execution"
import type { WorkspaceCardOverflowAction, WorkspaceCardSize } from "./workspace-board-types"
import {
  WorkspaceBoardLazyAcceleratorCardPanel,
  WorkspaceBoardLazyAcceleratorHeaderPicker,
} from "./workspace-board-accelerator-lazy"
import { WorkspaceBoardAcceleratorHeaderSummary } from "./workspace-board-accelerator-header-summary"
import { WorkspaceBoardAcceleratorTitleIcon } from "./workspace-board-accelerator-title-icon"

export function resolveAcceleratorHeaderMeta({
  acceleratorRuntimeActions,
  acceleratorRuntimeSnapshot,
  acceleratorTutorialCallout,
  acceleratorTutorialInteractionPolicy,
}: {
  acceleratorRuntimeActions: WorkspaceAcceleratorCardRuntimeActions | null
  acceleratorRuntimeSnapshot: WorkspaceAcceleratorCardRuntimeSnapshot | null
  acceleratorTutorialCallout: WorkspaceBoardNodeData["acceleratorTutorialCallout"]
  acceleratorTutorialInteractionPolicy: WorkspaceBoardNodeData["acceleratorTutorialInteractionPolicy"]
}) {
  if (!acceleratorRuntimeSnapshot || !acceleratorRuntimeActions) return undefined

  return (
    <WorkspaceBoardLazyAcceleratorHeaderPicker
      lessonGroupOptions={acceleratorRuntimeSnapshot.lessonGroupOptions ?? []}
      selectedLessonGroupKey={
        acceleratorRuntimeSnapshot.selectedLessonGroupKey ?? ""
      }
      viewerOpen={acceleratorRuntimeSnapshot.isModuleViewerOpen === true}
      tutorialCallout={
        acceleratorTutorialCallout?.focus === "picker"
          ? acceleratorTutorialCallout
          : null
      }
      tutorialInteractionPolicy={acceleratorTutorialInteractionPolicy ?? null}
      onLessonGroupChange={acceleratorRuntimeActions.selectLessonGroup}
    />
  )
}

export function resolveAcceleratorHeaderDetails({
  acceleratorRuntimeSnapshot,
}: {
  acceleratorRuntimeSnapshot: WorkspaceAcceleratorCardRuntimeSnapshot | null
}) {
  if (!acceleratorRuntimeSnapshot) return undefined

  return (
    <WorkspaceBoardAcceleratorHeaderSummary
      moduleCount={acceleratorRuntimeSnapshot.checklistModuleCount ?? 0}
      stepCount={acceleratorRuntimeSnapshot.filteredStepCount ?? 0}
    />
  )
}

export function resolveOrganizationHeaderAction({
  orgId,
  profile,
  highlighted,
  instruction,
  onPress,
}: {
  orgId: string
  profile: Parameters<typeof WorkspaceBoardOrganizationMapButton>[0]["profile"]
  highlighted: boolean
  instruction: string | null
  onPress: () => void
}) {
  if (!WORKSPACE_MAP_FEATURE_ENABLED) {
    return undefined
  }

  return (
    <WorkspaceBoardOrganizationMapButton
      orgId={orgId}
      profile={profile}
      highlighted={highlighted}
      instruction={instruction}
      onPress={onPress}
    />
  )
}

export function renderOrganizationOverviewCard({
  size,
  presentationMode,
  canEdit,
  contentClassName,
  organizationEditorHref,
  headerAction,
  isCanvasFullscreen,
  onToggleCanvasFullscreen,
  seed,
  organizationEditorData,
}: {
  size: WorkspaceCardSize
  presentationMode: boolean
  canEdit: boolean
  contentClassName: string | undefined
  organizationEditorHref: string
  headerAction: ReturnType<typeof resolveOrganizationHeaderAction>
  isCanvasFullscreen: boolean
  onToggleCanvasFullscreen?: () => void
  seed: WorkspaceBoardNodeData["seed"]
  organizationEditorData: WorkspaceBoardNodeData["organizationEditorData"]
}) {
  const cardMeta = WORKSPACE_CARD_META["organization-overview"]

  return (
    <WorkspaceBoardOrganizationCardShell
      title={cardMeta.title}
      subtitle={cardMeta.subtitle}
      headerMeta={undefined}
      size={size}
      presentationMode={presentationMode}
      fullHref={cardMeta.fullHref}
      canEdit={canEdit}
      contentClassName={contentClassName}
      editorHref={canEdit ? organizationEditorHref : null}
      headerAction={headerAction}
      isCanvasFullscreen={isCanvasFullscreen}
      onToggleCanvasFullscreen={onToggleCanvasFullscreen}
    >
      <OrganizationOverviewCard
        size={size}
        seed={seed}
        presentationMode={presentationMode}
        organizationEditorData={organizationEditorData}
      />
    </WorkspaceBoardOrganizationCardShell>
  )
}

export function useOrganizationMapCardAction(data: WorkspaceBoardNodeData) {
  const organizationMapButtonCallout = data.organizationMapButtonCallout ?? null

  const handleOpenMapCard = useCallback(() => {
    data.onOpenCard?.("atlas")
    if (organizationMapButtonCallout) {
      data.onOrganizationMapButtonTutorialComplete?.("complete-and-advance")
    }
  }, [data, organizationMapButtonCallout])

  return {
    organizationMapButtonCallout,
    handleOpenMapCard,
  }
}

export function renderAcceleratorTitleIcon() {
  return <WorkspaceBoardAcceleratorTitleIcon />
}

export function renderWorkspaceBoardResolvedCard({
  cardId,
  cardMeta,
  comingSoonTitleBadge,
  acceleratorCardHref,
  acceleratorCardInput,
  acceleratorHeaderDetails,
  acceleratorHeaderMeta,
  acceleratorRuntimeSnapshot,
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
  onSizeChange,
  presentationMode,
  programsCreateOpen,
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
    actions: WorkspaceAcceleratorCardRuntimeActions,
  ) => void
  onAcceleratorRuntimeChange?: (
    snapshot: WorkspaceAcceleratorCardRuntimeSnapshot,
  ) => void
  onAcceleratorTutorialActionComplete?: (
    mode?: "complete" | "complete-and-advance",
  ) => void
  onCommunicationsMenuActionsChange: (
    actions: WorkspaceCardOverflowAction[],
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
  onSizeChange: WorkspaceBoardNodeData["onSizeChange"]
  presentationMode: boolean
  programsCreateOpen: boolean
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
            profile={data.organizationEditorData?.initialProfile ?? seed.initialProfile}
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
    data.tutorialStepId,
  )

  return (
    <WorkspaceBoardCardFrame
      cardId={cardId}
      title={cardMeta.title}
      subtitle={cardMeta.subtitle}
      titleBadge={comingSoonTitleBadge}
      tone={cardId === "accelerator" ? "accelerator" : "default"}
      titleIcon={cardId === "accelerator" ? renderAcceleratorTitleIcon() : null}
      hideTitle={false}
      hideSubtitle={hideHeaderSubtitle}
      headerDetails={cardId === "accelerator" ? acceleratorHeaderDetails : undefined}
      headerMeta={cardId === "accelerator" ? acceleratorHeaderMeta : undefined}
      headerAction={
        cardId === "programs" && canEdit ? (
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
          cardId === "communications" && nextSize === "sm" ? "md" : nextSize,
        )
      }
      fullHref={cardId === "accelerator" ? acceleratorCardHref : cardMeta.fullHref}
      canEdit={canEdit}
      contentClassName={contentClassName}
      menuActions={cardId === "communications" ? communicationsMenuActions : undefined}
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
          legacyProgramsValue={data.organizationEditorData?.initialProfile.programs}
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
          profile={data.organizationEditorData?.initialProfile ?? seed.initialProfile}
        />
      ) : null}
      {cardId === "atlas" ? (
        <WorkspaceBoardAtlasCard
          size={effectiveCardSize}
          presentationMode={presentationMode}
          seed={seed}
          profile={data.organizationEditorData?.initialProfile ?? seed.initialProfile}
          tutorialStepId={data.tutorialStepId ?? null}
        />
      ) : null}
    </WorkspaceBoardCardFrame>
  )
}
