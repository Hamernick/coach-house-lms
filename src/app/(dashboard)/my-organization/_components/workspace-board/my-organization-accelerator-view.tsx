"use client"

import Link from "next/link"
import { useCallback, useMemo, useState } from "react"
import ArrowLeftIcon from "lucide-react/dist/esm/icons/arrow-left"
import { useRouter } from "next/navigation"

import {
  areWorkspaceAcceleratorRuntimeSnapshotsEqual,
  buildWorkspaceAcceleratorFullscreenHref,
  WorkspaceAcceleratorCardPanel,
  type WorkspaceAcceleratorCardInput,
  type WorkspaceAcceleratorCardRuntimeActions,
  type WorkspaceAcceleratorCardRuntimeSnapshot,
} from "@/features/workspace-accelerator-card"
import { Button } from "@/components/ui/button"
import { SidebarInset } from "@/components/ui/sidebar"

import { resolveWorkspaceAcceleratorReadinessSummary } from "./workspace-board-accelerator-card-helpers"
import { WorkspaceBoardCardHeader } from "./workspace-board-card-header"
import { WORKSPACE_CARD_META } from "./workspace-board-copy"
import {
  renderAcceleratorTitleIcon,
  resolveAcceleratorHeaderDetails,
  resolveAcceleratorHeaderMeta,
} from "./workspace-board-node-card-support"
import type { WorkspaceSeedData } from "./workspace-board-types"

type MyOrganizationAcceleratorViewProps = {
  seed: WorkspaceSeedData
  initialStepId?: string | null
  initialModuleId?: string | null
  initialLessonGroupKey?: string | null
  programFundingTargets: Array<{ goal_cents: number | null }>
  onWorkspaceOnboardingSubmit: (form: FormData) => Promise<void>
}

export function MyOrganizationAcceleratorView({
  seed,
  initialStepId = null,
  initialModuleId = null,
  initialLessonGroupKey = null,
  programFundingTargets,
  onWorkspaceOnboardingSubmit,
}: MyOrganizationAcceleratorViewProps) {
  const router = useRouter()
  const cardMeta = WORKSPACE_CARD_META.accelerator
  const [acceleratorRuntimeSnapshot, setAcceleratorRuntimeSnapshot] =
    useState<WorkspaceAcceleratorCardRuntimeSnapshot | null>(null)
  const [acceleratorRuntimeActions, setAcceleratorRuntimeActions] =
    useState<WorkspaceAcceleratorCardRuntimeActions | null>(null)
  const acceleratorReadinessSummary = useMemo(
    () =>
      resolveWorkspaceAcceleratorReadinessSummary({
        acceleratorState: seed.boardState.accelerator,
        programs: programFundingTargets,
        seed,
      }),
    [programFundingTargets, seed],
  )
  const acceleratorCardInput = useMemo<WorkspaceAcceleratorCardInput>(
    () => ({
      steps: seed.acceleratorTimeline ?? [],
      size: "lg",
      readinessSummary: acceleratorReadinessSummary,
      allowAutoResize: false,
      storageKey: `${seed.orgId}:${seed.viewerId}`,
      initialCurrentStepId: initialStepId ?? seed.boardState.accelerator.activeStepId,
      initialCompletedStepIds: seed.boardState.accelerator.completedStepIds,
      onWorkspaceOnboardingSubmit,
    }),
    [
      acceleratorReadinessSummary,
      initialStepId,
      onWorkspaceOnboardingSubmit,
      seed.acceleratorTimeline,
      seed.boardState.accelerator.activeStepId,
      seed.boardState.accelerator.completedStepIds,
      seed.orgId,
      seed.viewerId,
    ],
  )
  const acceleratorHeaderMeta = resolveAcceleratorHeaderMeta({
    acceleratorRuntimeActions,
    acceleratorRuntimeSnapshot,
    acceleratorTutorialCallout: null,
    acceleratorTutorialInteractionPolicy: null,
  })
  const acceleratorHeaderDetails = resolveAcceleratorHeaderDetails({
    acceleratorRuntimeSnapshot,
  })
  const handleCloseFullscreen = useCallback(() => {
    router.push("/workspace")
  }, [router])
  const handleRequestOpenStep = useCallback(
    ({
      step,
      selectedLessonGroupKey,
    }: {
      step: WorkspaceAcceleratorCardInput["steps"][number]
      selectedLessonGroupKey: string | null
    }) => {
      const href = buildWorkspaceAcceleratorFullscreenHref({
        stepId: step.id,
        moduleId: step.moduleId,
        lessonGroupKey: selectedLessonGroupKey ?? initialLessonGroupKey,
      })
      router.push(href, { scroll: false })
      return false
    },
    [initialLessonGroupKey, router],
  )
  const handleRuntimeChange = useCallback(
    (snapshot: WorkspaceAcceleratorCardRuntimeSnapshot) => {
      setAcceleratorRuntimeSnapshot((previous) => {
        if (
          areWorkspaceAcceleratorRuntimeSnapshotsEqual(previous, snapshot)
        ) {
          return previous
        }
        return snapshot
      })
    },
    [],
  )

  return (
    <div className="-m-[var(--shell-content-pad)] flex min-h-[calc(100%_+_var(--shell-content-pad)_+_var(--shell-content-pad))] flex-1 flex-col">
      <SidebarInset className="h-full min-h-0 overflow-hidden text-foreground bg-[var(--shell-bg)] [--shell-max-w:min(1400px,100%)] md:peer-data-[state=collapsed]:[--shell-max-w:min(1600px,100%)] [--shell-outer-gutter:0px] md:peer-data-[state=collapsed]:[--shell-outer-gutter:0px]">
        <section className="flex min-h-0 flex-1 flex-col">
          <WorkspaceBoardCardHeader
          title={cardMeta.title}
          subtitle={cardMeta.subtitle}
          tone="accelerator"
          titleIcon={renderAcceleratorTitleIcon()}
          hideSubtitle
          headerDetails={acceleratorHeaderDetails}
          headerMeta={acceleratorHeaderMeta}
          headerAction={
            <Button asChild size="sm" variant="outline" className="h-7 gap-1.5 px-2.5 text-[11px]">
              <Link href="/workspace">
                <ArrowLeftIcon className="h-3.5 w-3.5" aria-hidden />
                Workspace
              </Link>
            </Button>
          }
          presentationMode={false}
          fullHref={cardMeta.fullHref}
          canEdit={false}
          />
          <div className="nodrag nopan min-h-0 flex-1 overflow-hidden px-3 pt-0.5 pb-3">
            <WorkspaceAcceleratorCardPanel
              input={acceleratorCardInput}
              presentationMode="fullscreen-route"
              initialModuleViewerOpen
              initialOpenModuleId={initialModuleId}
              onModuleViewerClose={handleCloseFullscreen}
              onRequestOpenStep={handleRequestOpenStep}
              onRuntimeChange={handleRuntimeChange}
              onRuntimeActionsChange={setAcceleratorRuntimeActions}
            />
          </div>
        </section>
      </SidebarInset>
    </div>
  )
}
