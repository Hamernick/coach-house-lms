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
  const tutorialLayoutContract: WorkspaceCanvasTutorialLayoutContract | null =
    tutorialActive && tutorialPresentation
      ? resolveWorkspaceCanvasTutorialLayoutContract({
          tutorialStepIndex,
          openedTutorialStepIds: openedStepIds,
          acceleratorModuleViewerOpen: resolvedAcceleratorModuleViewerOpen,
          breakpoint: tutorialBreakpoint,
          shellWidth: tutorialPresentation.shellWidth,
          shellHeight: resolveWorkspaceTutorialRenderedShellHeight({
            family: tutorialPresentation.family,
            estimatedShellHeight: tutorialPresentation.shellHeight,
            measuredShellHeight: tutorialShellMeasuredHeight,
          }),
          primaryCardId: tutorialScenePrimaryCardId,
          cardPositionOverrides: tutorialSceneCardPositionOverrides ?? {},
          guideGap: tutorialSceneGuideGap,
          layoutMode: tutorialPresentation.layoutMode,
        })
      : null

  const tutorialNodeWithPresentation = useMemo(() => {
    if (!tutorialNodeData || !tutorialPresentation) {
      return tutorialNodeData
    }

    const tutorialNodeState = tutorialNodeData.data as WorkspaceCanvasTutorialNodeData
    const tutorialPresentationCardId = tutorialPresentation.surface?.cardId
    const tutorialPresentationCardData = tutorialPresentationCardId
      ? cardDataLookup[tutorialPresentationCardId]
      : null
    const resolvedTutorialShellHeight = resolveWorkspaceTutorialRenderedShellHeight(
      {
        family: tutorialPresentation.family,
        estimatedShellHeight: tutorialPresentation.shellHeight,
        measuredShellHeight: tutorialShellMeasuredHeight,
      },
    )
    const usesMeasuredShellHeight = shouldWorkspaceTutorialUseMeasuredShellHeight(
      tutorialPresentation.family,
    )
    const nextPosition =
      tutorialLayoutContract?.tutorialNodePosition ?? tutorialNodeData.position
    const nextStyle =
      tutorialLayoutContract?.tutorialNodeStyle ?? {
        width: tutorialPresentation.shellWidth,
        height: resolvedTutorialShellHeight,
        minHeight: resolvedTutorialShellHeight,
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
        presentationContent: tutorialPresentation.content,
        presentationKey: tutorialPresentation.key,
        presentationSurface: tutorialPresentation.surface,
        suppressedNodeIds: tutorialPresentation.suppressedNodeIds,
        onMeasuredShellHeightChange:
          tutorialPresentation.content &&
          usesMeasuredShellHeight &&
          tutorialSceneSignature &&
          onTutorialShellMeasuredHeightChange
            ? (height) => onTutorialShellMeasuredHeightChange(height)
            : undefined,
        onMeasuredHeightChange:
          tutorialPresentation.content &&
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
        onPresentationMaskLayoutChange: tutorialPresentation.content
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
    tutorialSceneSignature,
    tutorialShellMeasuredHeight,
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
