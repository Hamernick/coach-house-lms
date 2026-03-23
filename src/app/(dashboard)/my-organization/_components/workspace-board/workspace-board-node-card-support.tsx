"use client"

import { useCallback } from "react"

import WaypointsIcon from "lucide-react/dist/esm/icons/waypoints"

import {
  WorkspaceAcceleratorHeaderPicker,
  WorkspaceAcceleratorHeaderSummary,
  type WorkspaceAcceleratorCardRuntimeActions,
  type WorkspaceAcceleratorCardRuntimeSnapshot,
} from "@/features/workspace-accelerator-card"
import { WORKSPACE_MAP_FEATURE_ENABLED } from "@/lib/workspace-map-feature"

import { WorkspaceBoardOrganizationMapButton } from "./workspace-board-organization-map-button"
import { WorkspaceBoardOrganizationCardShell } from "./workspace-board-organization-card-shell"
import { OrganizationOverviewCard } from "./workspace-board-node-static-cards"
import { WORKSPACE_CARD_META } from "./workspace-board-copy"
import type { WorkspaceBoardNodeData } from "./workspace-board-node-types"
import type { WorkspaceCardSize } from "./workspace-board-types"

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
    <WorkspaceAcceleratorHeaderPicker
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
    <WorkspaceAcceleratorHeaderSummary
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
  shortcutItems,
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
  shortcutItems: NonNullable<WorkspaceBoardNodeData["organizationShortcutItems"]>
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
      shortcutItems={shortcutItems}
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
  return (
    <WaypointsIcon
      className="h-4 w-4 text-fuchsia-500 dark:text-fuchsia-400"
      aria-hidden
    />
  )
}
