"use client"

import { useMemo } from "react"

import type {
  WorkspaceCanvasTutorialNodeData,
  WorkspaceCanvasTutorialPresentationMaskLayout,
} from "@/features/workspace-canvas-tutorial"

import type { WorkspaceBoardNodeData } from "../../workspace-board-node-types"
import type { WorkspaceCardId, WorkspaceCardSize } from "../../workspace-board-types"
import type { WorkspaceAcceleratorCardRuntimeSnapshot } from "@/features/workspace-accelerator-card"
import type {
  WorkspaceCanvasNode,
  WorkspaceCanvasV2CardId,
} from "./workspace-canvas-surface-v2-helpers"
import { resolveWorkspaceTutorialDockTarget } from "./workspace-canvas-surface-v2-tutorial-docking"
import {
  resolveWorkspaceCanvasTutorialLayoutContract,
  type WorkspaceCanvasTutorialLayoutContract,
} from "./workspace-canvas-surface-v2-tutorial-layout-contract"
import type { WorkspaceCanvasTutorialSceneBreakpoint } from "./workspace-canvas-surface-v2-onboarding-scenes"
import { resolveWorkspaceTutorialPresentation } from "./workspace-canvas-surface-v2-tutorial-presentation"
import { resolveWorkspaceTutorialNormalizedAcceleratorModuleViewerOpen } from "./workspace-canvas-surface-v2-tutorial-scene-spec"
import { resolveWorkspaceTutorialStageShellSpec } from "./workspace-canvas-surface-v2-tutorial-presentation-state"
import {
  resolveWorkspaceTutorialRenderedShellHeight,
  shouldWorkspaceTutorialMeasurePresentationContentHeight,
  shouldWorkspaceTutorialUseMeasuredShellHeight,
} from "./workspace-canvas-surface-v2-tutorial-shell-height"

export function useWorkspaceTutorialNodeState({
  tutorialActive,
  tutorialStepIndex,
  tutorialSceneSignature,
  openedStepIds,
  cardDataLookup,
  tutorialNodeData,
  tutorialBreakpoint,
  tutorialSceneCardPositionOverrides,
  tutorialScenePrimaryCardId,
  tutorialSceneGuideGap,
  tutorialSceneNodeIds,
  tutorialSceneCameraViewport,
  cardMeasuredHeights,
  tutorialShellMeasuredHeight,
  tutorialPresentationMaskLayout,
  acceleratorRuntimeSnapshot,
  onTutorialShellMeasuredHeightChange,
}: {
  tutorialActive: boolean
  tutorialStepIndex: number
  tutorialSceneSignature: string | null
  openedStepIds: WorkspaceCanvasTutorialNodeData["openedStepIds"]
  cardDataLookup: Record<WorkspaceCardId, WorkspaceBoardNodeData>
  tutorialNodeData: WorkspaceCanvasNode | null
  tutorialBreakpoint: WorkspaceCanvasTutorialSceneBreakpoint
  tutorialSceneCardPositionOverrides: Partial<
    Record<WorkspaceCardId, { x: number; y: number }>
  > | null
  tutorialScenePrimaryCardId: WorkspaceCardId | null
  tutorialSceneGuideGap: number
  tutorialSceneNodeIds: string[]
  tutorialSceneCameraViewport: {
    x: number
    y: number
    zoom: number
    duration: number
    delayMs?: number
  } | null
  cardMeasuredHeights: Partial<
    Record<WorkspaceCardId, Partial<Record<WorkspaceCardSize, number>>>
  >
  tutorialShellMeasuredHeight: number | null
  tutorialPresentationMaskLayout: WorkspaceCanvasTutorialPresentationMaskLayout | null
  acceleratorRuntimeSnapshot: WorkspaceAcceleratorCardRuntimeSnapshot | null
  onTutorialShellMeasuredHeightChange?: (height: number) => void
}) {
  const resolvedAcceleratorModuleViewerOpen =
    resolveWorkspaceTutorialNormalizedAcceleratorModuleViewerOpen({
      tutorialStepIndex,
      openedStepIds,
      acceleratorModuleViewerOpen:
        acceleratorRuntimeSnapshot?.isModuleViewerOpen === true,
    })
  const tutorialPresentation = useMemo(
    () =>
      tutorialActive
        ? resolveWorkspaceTutorialPresentation({
            tutorialStepIndex,
            openedStepIds,
            acceleratorModuleViewerOpen: resolvedAcceleratorModuleViewerOpen,
            cardDataLookup,
            cardMeasuredHeights,
          })
        : null,
    [
      cardDataLookup,
      cardMeasuredHeights,
      openedStepIds,
      resolvedAcceleratorModuleViewerOpen,
      tutorialActive,
      tutorialStepIndex,
    ],
  )
  const tutorialStageShellSpec = useMemo(
    () =>
      tutorialActive
        ? resolveWorkspaceTutorialStageShellSpec({
            tutorialStepIndex,
            openedStepIds,
            acceleratorModuleViewerOpen: resolvedAcceleratorModuleViewerOpen,
          })
        : null,
    [
      openedStepIds,
      resolvedAcceleratorModuleViewerOpen,
      tutorialActive,
      tutorialStepIndex,
    ],
  )
  const tutorialShellFamily =
    tutorialPresentation?.family ?? tutorialStageShellSpec?.family ?? null
  const tutorialShellWidth =
    tutorialPresentation?.shellWidth ??
    tutorialStageShellSpec?.shellWidth ??
    null
  const tutorialShellHeight = resolveWorkspaceTutorialRenderedShellHeight({
    family: tutorialShellFamily ?? "welcome",
    estimatedShellHeight:
      tutorialPresentation?.shellHeight ??
      tutorialStageShellSpec?.shellHeight ??
      0,
    measuredShellHeight: tutorialShellMeasuredHeight,
  })
  const tutorialShellLayoutMode =
    tutorialPresentation?.layoutMode ??
    tutorialStageShellSpec?.layoutMode ??
    "centered"
  const tutorialLayoutContract: WorkspaceCanvasTutorialLayoutContract | null =
    tutorialActive &&
    tutorialShellFamily !== null &&
    tutorialShellWidth !== null &&
    tutorialShellHeight > 0
      ? resolveWorkspaceCanvasTutorialLayoutContract({
          tutorialStepIndex,
          openedTutorialStepIds: openedStepIds,
          acceleratorModuleViewerOpen: resolvedAcceleratorModuleViewerOpen,
          breakpoint: tutorialBreakpoint,
          shellWidth: tutorialShellWidth,
          shellHeight: tutorialShellHeight,
          primaryCardId: tutorialScenePrimaryCardId,
          cardPositionOverrides: tutorialSceneCardPositionOverrides ?? {},
          guideGap: tutorialSceneGuideGap,
          layoutMode: tutorialShellLayoutMode,
        })
      : null

  const tutorialNodeWithPresentation = useMemo(() => {
    if (!tutorialNodeData) {
      return tutorialNodeData
    }

    const tutorialNodeState = tutorialNodeData.data as WorkspaceCanvasTutorialNodeData
    const tutorialPresentationCardId = tutorialPresentation?.surface?.cardId
    const tutorialPresentationCardData = tutorialPresentationCardId
      ? cardDataLookup[tutorialPresentationCardId]
      : null
    const usesMeasuredShellHeight =
      tutorialShellFamily !== null
        ? shouldWorkspaceTutorialUseMeasuredShellHeight(tutorialShellFamily)
        : false
    const nextPosition =
      tutorialLayoutContract?.tutorialNodePosition ?? tutorialNodeData.position
    const nextStyle =
      tutorialLayoutContract?.tutorialNodeStyle ?? {
        width:
          tutorialPresentation?.shellWidth ??
          tutorialNodeData.style?.width,
        height:
          tutorialShellHeight ||
          tutorialPresentation?.shellHeight ||
          tutorialNodeData.style?.height,
        minHeight:
          tutorialShellHeight ||
          tutorialPresentation?.shellHeight ||
          tutorialNodeData.style?.minHeight,
      }

    return {
      ...tutorialNodeData,
      position: nextPosition,
      style: {
        ...tutorialNodeData.style,
        width: nextStyle.width,
        height: nextStyle.height,
        minHeight: nextStyle.minHeight,
      },
      data: {
        ...tutorialNodeState,
        presentationContent: tutorialPresentation?.content,
        presentationKey: tutorialPresentation?.key ?? null,
        presentationSurface: tutorialPresentation?.surface ?? null,
        suppressedNodeIds: tutorialPresentation?.suppressedNodeIds ?? [],
        onMeasuredShellHeightChange:
          usesMeasuredShellHeight &&
          tutorialSceneSignature &&
          onTutorialShellMeasuredHeightChange
            ? (height: number) => onTutorialShellMeasuredHeightChange(height)
            : undefined,
        onMeasuredHeightChange:
          tutorialPresentation?.content &&
          shouldWorkspaceTutorialMeasurePresentationContentHeight(
            tutorialPresentation.family,
          ) &&
          tutorialPresentationCardData?.onMeasuredHeightChange
            ? (height: number) =>
                tutorialPresentationCardData.onMeasuredHeightChange?.(
                tutorialPresentation.cardSize,
                  height,
                )
            : undefined,
        onPresentationMaskLayoutChange: tutorialPresentation?.content
          ? undefined
          : tutorialNodeState.onPresentationMaskLayoutChange,
      },
    }
  }, [
    cardDataLookup,
    onTutorialShellMeasuredHeightChange,
    tutorialLayoutContract,
    tutorialNodeData,
    tutorialPresentation,
    tutorialShellFamily,
    tutorialShellHeight,
    tutorialSceneSignature,
  ])

  const tutorialDockTargets = useMemo<
    Partial<
      Record<
        WorkspaceCanvasV2CardId,
        { x: number; y: number; snapRadius: number }
      >
    >
  >(() => {
    if (
      !tutorialNodeWithPresentation ||
      !tutorialPresentation?.dockMask ||
      tutorialPresentation.content
    ) {
      return {}
    }

    const dockTarget =
      tutorialPresentationMaskLayout?.cardId === tutorialPresentation.dockMask.cardId
        ? {
            cardId: tutorialPresentation.dockMask.cardId,
            x: Math.round(
              tutorialNodeWithPresentation.position.x +
                tutorialPresentationMaskLayout.x +
                tutorialPresentation.dockMask.cardInset,
            ),
            y: Math.round(
              tutorialNodeWithPresentation.position.y +
                tutorialPresentationMaskLayout.y +
                tutorialPresentation.dockMask.cardInset,
            ),
            snapRadius: tutorialPresentation.dockMask.snapRadius,
          }
        : resolveWorkspaceTutorialDockTarget({
            tutorialNodePosition: tutorialNodeWithPresentation.position,
            tutorialShellWidth: tutorialPresentation.shellWidth,
            dockMask: tutorialPresentation.dockMask,
          })

    return {
      [dockTarget.cardId]: {
        x: dockTarget.x,
        y: dockTarget.y,
        snapRadius: dockTarget.snapRadius,
      },
    }
  }, [
    tutorialNodeWithPresentation,
    tutorialPresentation,
    tutorialPresentationMaskLayout,
  ])

  const tutorialDraggableCardIds = useMemo<WorkspaceCanvasV2CardId[]>(
    () => Object.keys(tutorialDockTargets) as WorkspaceCanvasV2CardId[],
    [tutorialDockTargets],
  )

  const tutorialSuppressedNodeIds = useMemo(
    () => tutorialPresentation?.suppressedNodeIds ?? [],
    [tutorialPresentation],
  )

  const resolvedTutorialSceneNodeIds = useMemo(
    () =>
      tutorialSceneNodeIds.filter(
        (nodeId) => !tutorialSuppressedNodeIds.includes(nodeId),
      ),
    [tutorialSceneNodeIds, tutorialSuppressedNodeIds],
  )

  const resolvedTutorialSceneCameraViewport = useMemo(() => {
    return tutorialLayoutContract?.cameraViewport ?? tutorialSceneCameraViewport
  }, [tutorialLayoutContract, tutorialSceneCameraViewport])

  return {
    tutorialNodeData: tutorialNodeWithPresentation,
    tutorialSuppressedNodeIds,
    tutorialDockTargets,
    tutorialDraggableCardIds,
    tutorialSceneNodeIds: resolvedTutorialSceneNodeIds,
    tutorialSceneCameraViewport: resolvedTutorialSceneCameraViewport,
  }
}
