"use client"

import { memo, startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import {
  areWorkspaceAcceleratorRuntimeSnapshotsEqual,
  buildWorkspaceAcceleratorFullscreenHref,
  WorkspaceAcceleratorCardPanel,
  type WorkspaceAcceleratorCardInput,
  type WorkspaceAcceleratorCardRuntimeActions,
  type WorkspaceAcceleratorCardRuntimeSnapshot,
  type WorkspaceAcceleratorCardStep,
} from "@/features/workspace-accelerator-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { WorkspaceCardErrorBoundary } from "./workspace-board-card-error-boundary"
import { WorkspaceBoardCalendarCard } from "./workspace-board-calendar-card"
import { WorkspaceBoardCardFrame } from "./workspace-board-card-frame"
import { WorkspaceBoardCommunicationsCard } from "./workspace-board-communications-card"
import { WORKSPACE_CARD_META } from "./workspace-board-copy"
import {
  renderAcceleratorTitleIcon,
  renderOrganizationOverviewCard,
  resolveAcceleratorHeaderDetails,
  resolveAcceleratorHeaderMeta,
  resolveOrganizationHeaderAction,
  useOrganizationMapCardAction,
} from "./workspace-board-node-card-support"
import {
  isWorkspaceProgramsPreviewOnlyStep,
  WorkspaceBoardProgramsCard,
} from "./workspace-board-programs-card"
import {
  WorkspaceBoardBrandKitCard,
  WorkspaceBoardAtlasCard,
  WorkspaceBoardDeckCard,
  WorkspaceBoardRoadmapCard,
} from "./workspace-board-node-tool-cards"
import { EconomicEngineCard } from "./workspace-board-node-static-cards"
import { workspaceBoardCardPropsEqual } from "./workspace-board-node-card-compare"
import type {
  WorkspaceCardId,
  WorkspaceCardOverflowAction,
  WorkspaceCardSize,
} from "./workspace-board-types"
import type { WorkspaceBoardNodeData } from "./workspace-board-node-types"
import { resolveWorkspaceAcceleratorReadinessSummary } from "./workspace-board-accelerator-card-helpers"
import { shouldWorkspaceTutorialTrackEmbeddedAcceleratorRuntime } from "./workspace-canvas-v2/components/workspace-canvas-surface-v2-tutorial-presentation-state"

function shouldWorkspaceBoardCardTrackEmbeddedAcceleratorRuntime({
  cardId,
  presentationMode,
  tutorialStepId,
}: {
  cardId: WorkspaceCardId
  presentationMode: boolean
  tutorialStepId?: WorkspaceBoardNodeData["tutorialStepId"]
}) {
  return (
    cardId !== "accelerator" ||
    !presentationMode ||
    !tutorialStepId ||
    shouldWorkspaceTutorialTrackEmbeddedAcceleratorRuntime(tutorialStepId)
  )
}

function buildWorkspaceBoardAcceleratorCardInput({
  acceleratorTimeline,
  size,
  acceleratorReadinessSummary,
  hasAcceleratorAccess,
  acceleratorPaywallHref,
  shouldTrackEmbeddedAcceleratorRuntime,
  orgId,
  viewerId,
  handleAcceleratorSizeChange,
  activeStepId,
  completedStepIds,
  handleAcceleratorProgressChange,
  onWorkspaceOnboardingSubmit,
}: {
  acceleratorTimeline: WorkspaceBoardNodeData["seed"]["acceleratorTimeline"]
  size: WorkspaceCardSize
  acceleratorReadinessSummary: ReturnType<
    typeof resolveWorkspaceAcceleratorReadinessSummary
  >
  hasAcceleratorAccess: boolean
  acceleratorPaywallHref: string
  shouldTrackEmbeddedAcceleratorRuntime: boolean
  orgId: string
  viewerId: string
  handleAcceleratorSizeChange: (nextSize: WorkspaceCardSize) => void
  activeStepId: string | null
  completedStepIds: string[]
  handleAcceleratorProgressChange: (
    nextProgress: { currentStepId: string | null; completedStepIds: string[] },
  ) => void
  onWorkspaceOnboardingSubmit: WorkspaceBoardNodeData["onWorkspaceOnboardingSubmit"]
}): WorkspaceAcceleratorCardInput {
  return {
    steps: acceleratorTimeline ?? [],
    size: size === "lg" ? "lg" : size === "sm" ? "sm" : "md",
    readinessSummary: acceleratorReadinessSummary,
    linkHrefOverride: hasAcceleratorAccess ? null : acceleratorPaywallHref,
    allowAutoResize: false,
    storageKey: shouldTrackEmbeddedAcceleratorRuntime
      ? `${orgId}:${viewerId}`
      : undefined,
    onSizeChange: shouldTrackEmbeddedAcceleratorRuntime
      ? handleAcceleratorSizeChange
      : undefined,
    initialCurrentStepId: activeStepId,
    initialCompletedStepIds: completedStepIds,
    onProgressChange: shouldTrackEmbeddedAcceleratorRuntime
      ? handleAcceleratorProgressChange
      : undefined,
    onWorkspaceOnboardingSubmit,
  }
}

function resolveWorkspaceBoardFrameContentClassName({
  cardId,
  acceleratorTutorialCallout,
}: {
  cardId: WorkspaceCardId
  acceleratorTutorialCallout: WorkspaceBoardNodeData["acceleratorTutorialCallout"]
}) {
  if (cardId === "roadmap") return "px-0 pt-0 pb-0"
  if (cardId === "accelerator") {
    return cn(
      "px-3 pt-0.5 pb-3",
      acceleratorTutorialCallout?.focus === "close-module" && "overflow-visible",
    )
  }
  if (cardId === "atlas") return "min-h-0 flex-1 px-0 pt-0 pb-0"
  if (cardId === "brand-kit" || cardId === "communications") return "pt-0.5"
  return undefined
}

export const WorkspaceBoardCard = memo(function WorkspaceBoardCard({
  data,
}: {
  data: WorkspaceBoardNodeData
}) {
  const router = useRouter()
  const {
    cardId,
    size,
    seed,
    organizationEditorData,
    canEdit,
    presentationMode,
    communications,
    onSizeChange,
    onCommunicationsChange,
    onAcceleratorStateChange,
    onAcceleratorRuntimeChange,
    onAcceleratorRuntimeActionsChange,
    acceleratorTutorialCallout = null,
    acceleratorTutorialInteractionPolicy = null,
    onAcceleratorTutorialActionComplete,
    onWorkspaceOnboardingSubmit,
    acceleratorState,
    isJourneyTarget = false,
    isCanvasFullscreen = false,
    onToggleCanvasFullscreen,
    organizationShortcutItems = [],
  } = data
  const cardMeta = WORKSPACE_CARD_META[cardId]
  const shouldTrackEmbeddedAcceleratorRuntime = shouldWorkspaceBoardCardTrackEmbeddedAcceleratorRuntime({
    cardId,
    presentationMode,
    tutorialStepId: data.tutorialStepId,
  })
  const hideHeaderSubtitle = cardId === "organization-overview" || cardId === "accelerator" || cardId === "calendar" || cardId === "communications"
  const frameFullscreenToggle = onToggleCanvasFullscreen ? () => onToggleCanvasFullscreen(cardId) : undefined
  const organizationEditorHref = "/workspace?view=editor&tab=company"
  const acceleratorPaywallHref =
    "/workspace?paywall=organization&plan=organization&upgrade=accelerator-access&source=accelerator"
  const acceleratorCardHref = seed.hasAcceleratorAccess ? cardMeta.fullHref : acceleratorPaywallHref
  const effectiveCardSize: WorkspaceCardSize = cardId === "communications" && size === "sm" ? "md" : size
  const handleAcceleratorSizeChange = useCallback(
    (nextSize: WorkspaceCardSize) => onSizeChange("accelerator", nextSize),
    [onSizeChange],
  )
  const handleAcceleratorProgressChange = useCallback(
    (nextProgress: { currentStepId: string | null; completedStepIds: string[] }) => {
      startTransition(() => {
        onAcceleratorStateChange({
          activeStepId: nextProgress.currentStepId,
          completedStepIds: nextProgress.completedStepIds,
        })
      })
    },
    [onAcceleratorStateChange],
  )
  const [acceleratorRuntimeSnapshot, setAcceleratorRuntimeSnapshot] = useState<WorkspaceAcceleratorCardRuntimeSnapshot | null>(null)
  const [acceleratorRuntimeActions, setAcceleratorRuntimeActions] = useState<WorkspaceAcceleratorCardRuntimeActions | null>(null)
  const lastForwardedAcceleratorRuntimeSnapshotRef = useRef<WorkspaceAcceleratorCardRuntimeSnapshot | null>(null)
  const [communicationsMenuActions, setCommunicationsMenuActions] = useState<WorkspaceCardOverflowAction[]>([])
  const [programsCreateOpen, setProgramsCreateOpen] = useState(false)
  const comingSoonTitleBadge =
    cardId === "economic-engine" || cardId === "communications" ? (
      <Badge
        variant="outline"
        className="rounded-full border-border/70 bg-muted/70 px-2 py-0 text-[10px] font-semibold text-foreground/80 dark:bg-muted/30 dark:text-foreground/75"
      >
        Coming soon
      </Badge>
    ) : undefined
  const handleAcceleratorRuntimeChange = useCallback(
    (snapshot: WorkspaceAcceleratorCardRuntimeSnapshot) => {
      if (areWorkspaceAcceleratorRuntimeSnapshotsEqual(lastForwardedAcceleratorRuntimeSnapshotRef.current, snapshot)) {
        return
      }
      lastForwardedAcceleratorRuntimeSnapshotRef.current = snapshot
      setAcceleratorRuntimeSnapshot((previous) => {
        if (
          previous?.currentStep?.id === snapshot.currentStep?.id &&
          previous?.currentModuleStepIndex === snapshot.currentModuleStepIndex &&
          previous?.currentModuleStepTotal === snapshot.currentModuleStepTotal &&
          previous?.currentModuleCompletedCount === snapshot.currentModuleCompletedCount &&
          previous?.isCurrentModuleCompleted === snapshot.isCurrentModuleCompleted &&
          previous?.isModuleViewerOpen === snapshot.isModuleViewerOpen &&
          previous?.openModuleId === snapshot.openModuleId &&
          JSON.stringify(previous?.lessonGroupOptions ?? []) ===
            JSON.stringify(snapshot.lessonGroupOptions ?? []) &&
          previous?.currentIndex === snapshot.currentIndex &&
          previous?.totalSteps === snapshot.totalSteps
        ) {
          return previous
        }
        return snapshot
      })
      onAcceleratorRuntimeChange?.(snapshot)
    },
    [onAcceleratorRuntimeChange],
  )
  const handleAcceleratorRuntimeActionsChange = useCallback(
    (actions: WorkspaceAcceleratorCardRuntimeActions) => {
      setAcceleratorRuntimeActions(() => actions)
      onAcceleratorRuntimeActionsChange?.(actions)
    },
    [onAcceleratorRuntimeActionsChange],
  )
  const handleProgramsCreateOpenChange = useCallback((open: boolean) => {
    setProgramsCreateOpen(open)
    if (!open) {
      router.refresh()
    }
  }, [router])
  const handleAcceleratorRequestOpenStep = useCallback(
    ({
      step,
      selectedLessonGroupKey,
    }: {
      step: WorkspaceAcceleratorCardStep
      selectedLessonGroupKey: string | null
    }) => {
      if (!seed.hasAcceleratorAccess) {
        router.push(acceleratorPaywallHref)
        return true
      }
      const href = buildWorkspaceAcceleratorFullscreenHref({
        stepId: step.id,
        moduleId: step.moduleId,
        lessonGroupKey: selectedLessonGroupKey,
      })
      router.push(href)
      return true
    },
    [acceleratorPaywallHref, router, seed.hasAcceleratorAccess],
  )
  const acceleratorFullscreenBaseHref = useMemo(
    () => buildWorkspaceAcceleratorFullscreenHref({}),
    [],
  )
  useEffect(() => {
    if (!seed.hasAcceleratorAccess) return
    router.prefetch(acceleratorFullscreenBaseHref)
  }, [acceleratorFullscreenBaseHref, router, seed.hasAcceleratorAccess])
  const acceleratorReadinessSummary = useMemo(
    () =>
      resolveWorkspaceAcceleratorReadinessSummary({
        acceleratorState,
        programs: (organizationEditorData?.programs ?? []).map((program) => ({
          goal_cents: program.goal_cents ?? null,
        })),
        seed,
      }),
    [acceleratorState, organizationEditorData, seed],
  )
  const acceleratorCardInput = useMemo<WorkspaceAcceleratorCardInput>(
    () =>
      buildWorkspaceBoardAcceleratorCardInput({
        acceleratorTimeline: seed.acceleratorTimeline,
        size,
        acceleratorReadinessSummary,
        hasAcceleratorAccess: seed.hasAcceleratorAccess,
        acceleratorPaywallHref,
        shouldTrackEmbeddedAcceleratorRuntime,
        orgId: seed.orgId,
        viewerId: seed.viewerId,
        handleAcceleratorSizeChange,
        activeStepId: acceleratorState.activeStepId,
        completedStepIds: acceleratorState.completedStepIds,
        handleAcceleratorProgressChange,
        onWorkspaceOnboardingSubmit,
      }),
    [
      acceleratorState.activeStepId,
      acceleratorState.completedStepIds,
      handleAcceleratorProgressChange,
      handleAcceleratorSizeChange,
      size,
      acceleratorReadinessSummary,
      seed.acceleratorTimeline,
      seed.hasAcceleratorAccess,
      seed.orgId,
      seed.viewerId,
      onWorkspaceOnboardingSubmit,
      shouldTrackEmbeddedAcceleratorRuntime,
    ],
  )
  const frameContentClassName =
    resolveWorkspaceBoardFrameContentClassName({
      cardId,
      acceleratorTutorialCallout,
    })
  const acceleratorHeaderMeta = resolveAcceleratorHeaderMeta({
    acceleratorRuntimeActions,
    acceleratorRuntimeSnapshot,
    acceleratorTutorialCallout,
    acceleratorTutorialInteractionPolicy,
  })
  const acceleratorHeaderDetails = resolveAcceleratorHeaderDetails({
    acceleratorRuntimeSnapshot,
  })
  const { organizationMapButtonCallout, handleOpenMapCard } =
    useOrganizationMapCardAction(data)
  const programsPreviewOnly = isWorkspaceProgramsPreviewOnlyStep(
    data.tutorialStepId,
  )
  return (
    <div
      className={cn(
        "relative min-h-0 w-full min-w-0 origin-center transition-[box-shadow,filter,opacity,transform] duration-200",
        cardId === "accelerator" &&
          acceleratorRuntimeSnapshot?.isModuleViewerOpen === true &&
          "z-20",
        cardId === "accelerator" ||
          cardId === "organization-overview" ||
          cardId === "programs" ||
          cardId === "calendar"
          ? "h-auto"
          : "h-full",
      )}
    >
      <WorkspaceCardErrorBoundary cardId={cardId}>
        {cardId === "organization-overview" ? (
          renderOrganizationOverviewCard({
            size: effectiveCardSize,
            presentationMode,
            canEdit,
            contentClassName: frameContentClassName,
            organizationEditorHref,
            headerAction: resolveOrganizationHeaderAction({
              orgId: seed.orgId,
              profile: organizationEditorData?.initialProfile ?? seed.initialProfile,
              highlighted: organizationMapButtonCallout !== null,
              instruction: organizationMapButtonCallout?.instruction ?? null,
              onPress: handleOpenMapCard,
            }),
            shortcutItems: organizationShortcutItems,
            isCanvasFullscreen,
            onToggleCanvasFullscreen: frameFullscreenToggle,
            seed,
            organizationEditorData: data.organizationEditorData,
          })
        ) : (
          <WorkspaceBoardCardFrame
            cardId={cardId}
            title={cardMeta.title}
            subtitle={cardMeta.subtitle}
            titleBadge={comingSoonTitleBadge}
            tone={cardId === "accelerator" ? "accelerator" : "default"}
            titleIcon={
              cardId === "accelerator" ? renderAcceleratorTitleIcon() : null
            }
            hideTitle={false}
            hideSubtitle={hideHeaderSubtitle}
            headerDetails={
              cardId === "accelerator" ? acceleratorHeaderDetails : undefined
            }
            headerMeta={cardId === "accelerator" ? acceleratorHeaderMeta : undefined}
            headerAction={
              cardId === "programs" && canEdit ? (
                <Button
                  type="button"
                  size="sm"
                  className="h-7 rounded-lg px-2.5 text-[11px]"
                  disabled={programsPreviewOnly}
                  onClick={() => handleProgramsCreateOpenChange(true)}
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
            contentClassName={frameContentClassName}
            menuActions={cardId === "communications" ? communicationsMenuActions : undefined}
            editorHref={null}
            isCanvasFullscreen={isCanvasFullscreen}
            onToggleCanvasFullscreen={frameFullscreenToggle}
            fullscreenControlMode="overflow"
          >
            {cardId === "accelerator" ? (
              <WorkspaceAcceleratorCardPanel
                input={acceleratorCardInput}
                presentationMode="embedded"
                onRuntimeChange={
                  shouldTrackEmbeddedAcceleratorRuntime
                    ? handleAcceleratorRuntimeChange
                    : undefined
                }
                onRuntimeActionsChange={
                  shouldTrackEmbeddedAcceleratorRuntime
                    ? handleAcceleratorRuntimeActionsChange
                    : undefined
                }
                tutorialCallout={acceleratorTutorialCallout}
                tutorialInteractionPolicy={acceleratorTutorialInteractionPolicy}
                tutorialMode={data.tutorialStepId === "accelerator-close-module" ? "module-preview" : null}
                onTutorialActionComplete={onAcceleratorTutorialActionComplete}
                onRequestOpenStep={({ step, selectedLessonGroupKey }) =>
                  handleAcceleratorRequestOpenStep({
                    step,
                    selectedLessonGroupKey,
                  })
                }
              />
            ) : null}
            {cardId === "programs" ? (
              <WorkspaceBoardProgramsCard
                programs={data.organizationEditorData?.programs ?? []}
                legacyProgramsValue={data.organizationEditorData?.initialProfile.programs}
                canEdit={canEdit}
                createOpen={programsCreateOpen}
                onCreateOpenChange={handleProgramsCreateOpenChange}
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
                size={size}
                seed={seed}
                presentationMode={presentationMode}
              />
            ) : null}
            {cardId === "calendar" ? (
              <WorkspaceBoardCalendarCard
                calendar={seed.calendar}
                canEdit={canEdit}
                formationStatus={seed.initialProfile.formationStatus ?? null}
                cardSize={size}
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
                onChange={onCommunicationsChange}
                onMenuActionsChange={setCommunicationsMenuActions}
              />
            ) : null}
            {cardId === "deck" ? (
              <WorkspaceBoardDeckCard
                size={size}
                presentationMode={presentationMode}
              />
            ) : null}
            {cardId === "roadmap" ? (
              <WorkspaceBoardRoadmapCard
                profile={organizationEditorData?.initialProfile ?? seed.initialProfile}
              />
            ) : null}
            {cardId === "atlas" ? (
              <WorkspaceBoardAtlasCard
                size={size}
                presentationMode={presentationMode}
                seed={seed}
                profile={organizationEditorData?.initialProfile ?? seed.initialProfile}
                tutorialStepId={data.tutorialStepId ?? null}
              />
            ) : null}
          </WorkspaceBoardCardFrame>
        )}
      </WorkspaceCardErrorBoundary>
    </div>
  )
}, workspaceBoardCardPropsEqual)

WorkspaceBoardCard.displayName = "WorkspaceBoardCard"
