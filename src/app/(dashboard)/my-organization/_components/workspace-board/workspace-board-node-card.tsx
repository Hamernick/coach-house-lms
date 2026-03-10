"use client"

import { memo, startTransition, useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import ChevronLeftIcon from "lucide-react/dist/esm/icons/chevron-left"
import ChevronRightIcon from "lucide-react/dist/esm/icons/chevron-right"
import WaypointsIcon from "lucide-react/dist/esm/icons/waypoints"

import {
  WorkspaceAcceleratorCardPanel,
  type WorkspaceAcceleratorCardInput,
  type WorkspaceAcceleratorCardRuntimeActions,
  type WorkspaceAcceleratorCardRuntimeSnapshot,
} from "@/features/workspace-accelerator-card"
import { WorkspaceBrandKitPanel } from "@/features/workspace-brand-kit"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { WorkspaceCardErrorBoundary } from "./workspace-board-card-error-boundary"
import { WorkspaceBoardCalendarCard } from "./workspace-board-calendar-card"
import { WorkspaceBoardCardFrame } from "./workspace-board-card-frame"
import { WorkspaceBoardCommunicationsCard } from "./workspace-board-communications-card"
import { WORKSPACE_CARD_META } from "./workspace-board-copy"
import { WorkspaceBoardOrganizationCardShell } from "./workspace-board-organization-card-shell"
import { WorkspaceBoardProgramsCard } from "./workspace-board-programs-card"
import {
  WorkspaceBoardAtlasCard,
  WorkspaceBoardDeckCard,
  WorkspaceBoardVaultCard,
} from "./workspace-board-node-tool-cards"
import {
  EconomicEngineCard,
  OrganizationOverviewCard,
} from "./workspace-board-node-static-cards"
import { workspaceBoardCardPropsEqual } from "./workspace-board-node-card-compare"
import type {
  WorkspaceCardOverflowAction,
  WorkspaceCardSize,
} from "./workspace-board-types"
import type { WorkspaceBoardNodeData } from "./workspace-board-node-types"

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
    canEdit,
    presentationMode,
    communications,
    vaultViewMode,
    onSizeChange,
    onCommunicationsChange,
    onVaultViewModeChange,
    onAcceleratorStateChange,
    onAcceleratorRuntimeChange,
    onAcceleratorRuntimeActionsChange,
    acceleratorState,
    isJourneyTarget = false,
    isCanvasFullscreen = false,
    onToggleCanvasFullscreen,
    organizationShortcutItems = [],
  } = data
  const cardMeta = WORKSPACE_CARD_META[cardId]
  const hideHeaderSubtitle =
    cardId === "organization-overview" ||
    cardId === "accelerator" ||
    cardId === "calendar" ||
    cardId === "communications"
  const frameFullscreenToggle = onToggleCanvasFullscreen
    ? () => onToggleCanvasFullscreen(cardId)
    : undefined
  const organizationEditorHref = "/workspace?view=editor&tab=company"
const acceleratorPaywallHref =
    "/workspace?paywall=organization&plan=organization&upgrade=accelerator-access&source=accelerator"
  const acceleratorCardHref = seed.hasAcceleratorAccess
    ? cardMeta.fullHref
    : acceleratorPaywallHref
  const resolvedCardSize: WorkspaceCardSize = size
  const effectiveCardSize: WorkspaceCardSize =
    cardId === "communications" && resolvedCardSize === "sm"
      ? "md"
      : resolvedCardSize
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
  const [acceleratorRuntimeSnapshot, setAcceleratorRuntimeSnapshot] =
    useState<WorkspaceAcceleratorCardRuntimeSnapshot | null>(null)
  const [acceleratorRuntimeActions, setAcceleratorRuntimeActions] =
    useState<WorkspaceAcceleratorCardRuntimeActions | null>(null)
  const [communicationsMenuActions, setCommunicationsMenuActions] =
    useState<WorkspaceCardOverflowAction[]>([])
  const [programsCreateOpen, setProgramsCreateOpen] = useState(false)
  const fundraisingTitleBadge =
    cardId === "economic-engine" ? (
      <Badge
        variant="outline"
        className="rounded-full border-amber-300/70 bg-amber-100/70 px-2 py-0 text-[10px] font-semibold text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
      >
        Coming soon
      </Badge>
    ) : undefined

  const handleAcceleratorRuntimeChange = useCallback(
    (snapshot: WorkspaceAcceleratorCardRuntimeSnapshot) => {
      setAcceleratorRuntimeSnapshot((previous) => {
        if (
          previous?.currentStep?.id === snapshot.currentStep?.id &&
          previous?.currentModuleStepIndex === snapshot.currentModuleStepIndex &&
          previous?.currentModuleStepTotal === snapshot.currentModuleStepTotal &&
          previous?.currentModuleCompletedCount === snapshot.currentModuleCompletedCount &&
          previous?.isCurrentModuleCompleted === snapshot.isCurrentModuleCompleted &&
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
  const handleProgramsCreateOpenChange = useCallback(
    (open: boolean) => {
      setProgramsCreateOpen(open)
      if (!open) {
        router.refresh()
      }
    },
    [router],
  )

  const acceleratorCardInput = useMemo<WorkspaceAcceleratorCardInput>(
    () => ({
      steps: seed.acceleratorTimeline ?? [],
      size: resolvedCardSize === "sm" ? "sm" : "md",
      linkHrefOverride: seed.hasAcceleratorAccess ? null : acceleratorPaywallHref,
      allowAutoResize: true,
      storageKey: `${seed.orgId}:${seed.viewerId}`,
      onSizeChange: handleAcceleratorSizeChange,
      initialCurrentStepId: acceleratorState.activeStepId,
      initialCompletedStepIds: acceleratorState.completedStepIds,
      onProgressChange: handleAcceleratorProgressChange,
    }),
    [
      acceleratorState.activeStepId,
      acceleratorState.completedStepIds,
      handleAcceleratorProgressChange,
      handleAcceleratorSizeChange,
      resolvedCardSize,
      seed.acceleratorTimeline,
      seed.hasAcceleratorAccess,
      seed.orgId,
      seed.viewerId,
    ],
  )

  const acceleratorHeaderMeta = useMemo(() => {
    if (cardId !== "accelerator" || !acceleratorRuntimeSnapshot) return null
    return (
      <div className="inline-flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-md"
          disabled={!acceleratorRuntimeSnapshot.canGoPrevious}
          onClick={() => acceleratorRuntimeActions?.goPrevious()}
          aria-label="Previous accelerator step"
        >
          <ChevronLeftIcon className="h-3.5 w-3.5" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-md"
          disabled={!acceleratorRuntimeSnapshot.canGoNext}
          onClick={() => acceleratorRuntimeActions?.goNext()}
          aria-label="Next accelerator step"
        >
          <ChevronRightIcon className="h-3.5 w-3.5" aria-hidden />
        </Button>
      </div>
    )
  }, [acceleratorRuntimeActions, acceleratorRuntimeSnapshot, cardId])

  const frameContentClassName =
    cardId === "vault"
      ? "min-h-0 flex-1 px-0 pt-0 pb-0"
      : cardId === "accelerator" || cardId === "brand-kit" || cardId === "communications"
        ? "pt-0.5"
        : undefined

  return (
    <div
      className={cn(
        "relative min-h-0 w-full min-w-0 origin-center transition-[box-shadow,filter,opacity,transform] duration-200",
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
          <WorkspaceBoardOrganizationCardShell
            title={cardMeta.title}
            subtitle={cardMeta.subtitle}
            headerMeta={acceleratorHeaderMeta}
            size={effectiveCardSize}
            presentationMode={presentationMode}
            fullHref={cardMeta.fullHref}
            canEdit={canEdit}
            contentClassName={frameContentClassName}
            editorHref={canEdit ? organizationEditorHref : null}
            shortcutItems={organizationShortcutItems}
            isCanvasFullscreen={isCanvasFullscreen}
            onToggleCanvasFullscreen={frameFullscreenToggle}
          >
            <OrganizationOverviewCard
              size={size}
              seed={seed}
              presentationMode={presentationMode}
              organizationEditorData={data.organizationEditorData}
            />
          </WorkspaceBoardOrganizationCardShell>
        ) : (
          <WorkspaceBoardCardFrame
            cardId={cardId}
            title={cardMeta.title}
            subtitle={cardMeta.subtitle}
            titleBadge={fundraisingTitleBadge}
            tone={cardId === "accelerator" ? "accelerator" : "default"}
            titleIcon={
              cardId === "accelerator" ? (
                <WaypointsIcon
                  className="h-4 w-4 text-fuchsia-500 dark:text-fuchsia-400"
                  aria-hidden
                />
              ) : null
            }
            hideTitle={false}
            hideSubtitle={hideHeaderSubtitle}
            headerMeta={acceleratorHeaderMeta}
            headerAction={
              cardId === "programs" && canEdit ? (
                <Button
                  type="button"
                  size="sm"
                  className="h-7 rounded-lg px-2.5 text-[11px]"
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
            fullscreenControlMode={cardId === "vault" ? "inline" : "overflow"}
          >
            {cardId === "accelerator" ? (
              <WorkspaceAcceleratorCardPanel
                input={acceleratorCardInput}
                onRuntimeChange={handleAcceleratorRuntimeChange}
                onRuntimeActionsChange={handleAcceleratorRuntimeActionsChange}
                onOpenStepNode={data.onOpenAcceleratorStepNode}
              />
            ) : null}
            {cardId === "programs" ? (
              <WorkspaceBoardProgramsCard
                programs={data.organizationEditorData?.programs ?? []}
                legacyProgramsValue={data.organizationEditorData?.initialProfile.programs}
                canEdit={canEdit}
                createOpen={programsCreateOpen}
                onCreateOpenChange={handleProgramsCreateOpenChange}
              />
            ) : null}
            {cardId === "brand-kit" ? (
              <WorkspaceBrandKitPanel
                input={{
                  profile: seed.initialProfile,
                  canEdit,
                  presentationMode,
                }}
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
            {cardId === "vault" ? (
              <WorkspaceBoardVaultCard
                size={size}
                canEdit={canEdit}
                presentationMode={presentationMode}
                mode={vaultViewMode}
                onModeChange={onVaultViewModeChange}
              />
            ) : null}
            {cardId === "atlas" ? (
              <WorkspaceBoardAtlasCard
                size={size}
                presentationMode={presentationMode}
              />
            ) : null}
          </WorkspaceBoardCardFrame>
        )}
      </WorkspaceCardErrorBoundary>
    </div>
  )
}, workspaceBoardCardPropsEqual)

WorkspaceBoardCard.displayName = "WorkspaceBoardCard"
