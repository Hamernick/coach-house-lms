"use client"

import {
  resolveWorkspaceCanvasTutorialStep,
  type WorkspaceCanvasTutorialCallout,
} from "@/features/workspace-canvas-tutorial"

import { shouldShowWorkspaceCanvasInternalTutorialRestart } from "./workspace-canvas-surface-v2-debug-controls"
import type { WorkspaceBoardState } from "../../workspace-board-types"
import { useWorkspaceCanvasCardDataLookup } from "./workspace-canvas-surface-v2-card-data"
import type {
  WorkspaceCanvasV2CardId,
} from "./workspace-canvas-surface-v2-helpers"

export function resolveWorkspaceCanvasTutorialCalendarButtonProps({
  tutorialCallout,
  onTutorialComplete,
}: {
  tutorialCallout: WorkspaceCanvasTutorialCallout | null
  onTutorialComplete: () => void
}) {
  if (tutorialCallout?.kind !== "calendar-viewport-button") {
    return {
      tutorialCalendarButtonCallout: null,
      onTutorialCalendarButtonComplete: undefined,
    }
  }

  return {
    tutorialCalendarButtonCallout: {
      title: tutorialCallout.label,
      instruction: tutorialCallout.instruction,
    },
    onTutorialCalendarButtonComplete: onTutorialComplete,
  }
}

export function resolveWorkspaceCanvasOrganizationMapTutorialProps({
  tutorialCallout,
  onTutorialComplete,
}: {
  tutorialCallout: WorkspaceCanvasTutorialCallout | null
  onTutorialComplete: () => void
}) {
  if (tutorialCallout?.kind !== "organization-map-button") {
    return {
      organizationMapButtonCallout: null,
      onOrganizationMapButtonTutorialComplete: undefined,
    }
  }

  return {
    organizationMapButtonCallout: {
      instruction: tutorialCallout.instruction,
    },
    onOrganizationMapButtonTutorialComplete: onTutorialComplete,
  }
}

export function resolveWorkspaceCanvasTutorialSurfaceProps({
  allowEditing,
  presentationMode,
  tutorialCallout,
  onTutorialComplete,
}: {
  allowEditing: boolean
  presentationMode: boolean
  tutorialCallout: WorkspaceCanvasTutorialCallout | null
  onTutorialComplete: () => void
}) {
  return {
    showTutorialRestart: shouldShowWorkspaceCanvasInternalTutorialRestart({
      allowEditing,
      presentationMode,
      environment: process.env.NODE_ENV,
    }),
    ...resolveWorkspaceCanvasTutorialCalendarButtonProps({
      tutorialCallout,
      onTutorialComplete,
    }),
    ...resolveWorkspaceCanvasOrganizationMapTutorialProps({
      tutorialCallout,
      onTutorialComplete,
    }),
  }
}

export function resolveWorkspaceCanvasTutorialStepId({
  tutorialActive,
  tutorialStepIndex,
}: {
  tutorialActive: boolean
  tutorialStepIndex: number
}) {
  return tutorialActive
    ? resolveWorkspaceCanvasTutorialStep(tutorialStepIndex).id
    : null
}

export function buildVisibleWorkspaceCanvasCardIdSet({
  visibleCardIds,
  tutorialSuppressedNodeIds,
}: {
  visibleCardIds: readonly WorkspaceCanvasV2CardId[]
  tutorialSuppressedNodeIds: readonly string[]
}) {
  return new Set<WorkspaceCanvasV2CardId>(
    visibleCardIds.filter(
      (cardId) => !tutorialSuppressedNodeIds.includes(cardId),
    ),
  )
}

export function buildWorkspaceCanvasBoardNodeLookup(
  nodes: WorkspaceBoardState["nodes"],
) {
  return new Map(nodes.map((node) => [node.id, node] as const))
}

export function resolveWorkspaceCanvasAcceleratorNode({
  boardNodeLookup,
}: {
  boardNodeLookup: Map<
    string,
    WorkspaceBoardState["nodes"][number]
  >
}) {
  return boardNodeLookup.get("accelerator") ?? null
}

type WorkspaceCanvasSurfaceCardDataLookupArgs = Omit<
  Parameters<typeof useWorkspaceCanvasCardDataLookup>[0],
  | "acceleratorState"
  | "communications"
  | "tracker"
  | "nodes"
  | "tutorialStepId"
> & {
  boardState: WorkspaceBoardState
  tutorialActive: boolean
  tutorialStepIndex: number
}

export function useWorkspaceCanvasSurfaceCardDataLookup({
  boardState,
  tutorialActive,
  tutorialStepIndex,
  ...rest
}: WorkspaceCanvasSurfaceCardDataLookupArgs) {
  return useWorkspaceCanvasCardDataLookup({
    ...rest,
    acceleratorState: boardState.accelerator,
    communications: boardState.communications,
    tracker: boardState.tracker,
    nodes: boardState.nodes,
    tutorialStepId: resolveWorkspaceCanvasTutorialStepId({
      tutorialActive,
      tutorialStepIndex,
    }),
  })
}
