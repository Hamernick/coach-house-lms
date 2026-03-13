"use client"

import { memo, startTransition, useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import WaypointsIcon from "lucide-react/dist/esm/icons/waypoints"

import {
  WorkspaceAcceleratorCardPanel,
  WorkspaceAcceleratorHeaderPicker,
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
import { resolveWorkspaceAcceleratorReadinessSummary } from "./workspace-board-accelerator-card-helpers"

function resolveAcceleratorHeaderMeta({
  acceleratorRuntimeActions,
  acceleratorRuntimeSnapshot,
  acceleratorTutorialCallout,
}: {
  acceleratorRuntimeActions: WorkspaceAcceleratorCardRuntimeActions | null
  acceleratorRuntimeSnapshot: WorkspaceAcceleratorCardRuntimeSnapshot | null
  acceleratorTutorialCallout: WorkspaceBoardNodeData["acceleratorTutorialCallout"]
}) {
  if (!acceleratorRuntimeSnapshot || !acceleratorRuntimeActions) return undefined

  return (
    <WorkspaceAcceleratorHeaderPicker
      lessonGroupOptions={acceleratorRuntimeSnapshot.lessonGroupOptions ?? []}
      selectedLessonGroupKey={
        acceleratorRuntimeSnapshot.selectedLessonGroupKey ?? ""
      }
      tutorialCallout={
        acceleratorTutorialCallout?.focus === "picker"
          ? acceleratorTutorialCallout
          : null
      }
      onLessonGroupChange={acceleratorRuntimeActions.selectLessonGroup}
    />
  )
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
    vaultViewMode,
    onSizeChange,
    onCommunicationsChange,
    onVaultViewModeChange,
    onAcceleratorStateChange,
    onAcceleratorRuntimeChange,
    onAcceleratorRuntimeActionsChange,
    acceleratorTutorialCallout = null,
    onAcceleratorTutorialActionComplete,
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
  const handleProgramsCreateOpenChange = useCallback(
    (open: boolean) => {
      setProgramsCreateOpen(open)
      if (!open) {
        router.refresh()
      }
    },
    [router],
  )
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
    () => ({
      steps: seed.acceleratorTimeline ?? [],
      size:
        resolvedCardSize === "lg"
          ? "lg"
          : resolvedCardSize === "sm"
            ? "sm"
            : "md",
      readinessSummary: acceleratorReadinessSummary,
      linkHrefOverride: seed.hasAcceleratorAccess ? null : acceleratorPaywallHref,
      allowAutoResize: false,
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
      acceleratorReadinessSummary,
      seed.acceleratorTimeline,
      seed.hasAcceleratorAccess,
      seed.orgId,
      seed.viewerId,
    ],
  )

  const frameContentClassName =
    cardId === "vault"
      ? "min-h-0 flex-1 px-0 pt-0 pb-0"
      : cardId === "accelerator"
        ? "px-3 pt-0.5 pb-3"
        : cardId === "brand-kit" || cardId === "communications"
        ? "pt-0.5"
        : undefined
  const acceleratorHeaderMeta = resolveAcceleratorHeaderMeta({
    acceleratorRuntimeActions,
    acceleratorRuntimeSnapshot,
    acceleratorTutorialCallout,
  })

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
          <WorkspaceBoardOrganizationCardShell
            title={cardMeta.title}
            subtitle={cardMeta.subtitle}
            headerMeta={undefined}
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
            titleBadge={comingSoonTitleBadge}
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
            headerMeta={cardId === "accelerator" ? acceleratorHeaderMeta : undefined}
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
                tutorialCallout={
                  acceleratorTutorialCallout?.focus === "nav"
                    ? null
                    : acceleratorTutorialCallout
                }
                onTutorialActionComplete={onAcceleratorTutorialActionComplete}
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
