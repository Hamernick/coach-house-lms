import {
  resolveWorkspaceCanvasTutorialContinueMode,
  resolveWorkspaceCanvasTutorialSceneFocusCardIds,
  resolveWorkspaceCanvasTutorialStep,
  type WorkspaceCanvasTutorialStepId,
} from "@/features/workspace-canvas-tutorial"

import {
  DEFAULT_CARD_SIZES,
  resolveCardDimensions,
  roundToSnap,
} from "../../workspace-board-layout-config"
import type { WorkspaceBoardState, WorkspaceCardId } from "../../workspace-board-types"
import {
  WORKSPACE_CANVAS_V2_CARD_CONTRACT,
  type WorkspaceCanvasV2CardId,
} from "../contracts/workspace-card-contract"

export const WORKSPACE_CANVAS_TUTORIAL_NODE_ID = "workspace-canvas-tutorial"

const WORKSPACE_CANVAS_TUTORIAL_NODE_WIDTH = 560
const WORKSPACE_CANVAS_TUTORIAL_NODE_HEIGHT = 360
const WORKSPACE_CANVAS_TUTORIAL_START_X = 560
const WORKSPACE_CANVAS_TUTORIAL_START_Y = 280
const WORKSPACE_CANVAS_TUTORIAL_MIN_X = 80
const WORKSPACE_CANVAS_TUTORIAL_MIN_Y = -560
const WORKSPACE_CANVAS_TUTORIAL_CLUSTER_GAP = 64
const WORKSPACE_CANVAS_TUTORIAL_TARGET_ASPECT_RATIO = 1.45

type WorkspaceRect = {
  x: number
  y: number
  width: number
  height: number
}

export type WorkspaceCanvasTutorialGuidePlacement =
  | "center"
  | "above"
  | "left"
  | "right"

export type WorkspaceCanvasTutorialPositionOverride = {
  x: number
  y: number
  sceneSignature: string
}

function resolveRectBounds(rect: WorkspaceRect) {
  return {
    left: rect.x,
    top: rect.y,
    right: rect.x + rect.width,
    bottom: rect.y + rect.height,
  }
}

function resolveUnionRect(rects: WorkspaceRect[]) {
  const [firstRect, ...rest] = rects
  if (!firstRect) {
    return {
      x: WORKSPACE_CANVAS_TUTORIAL_START_X,
      y: WORKSPACE_CANVAS_TUTORIAL_START_Y,
      width: 0,
      height: 0,
    }
  }

  let { left, top, right, bottom } = resolveRectBounds(firstRect)
  for (const rect of rest) {
    const bounds = resolveRectBounds(rect)
    left = Math.min(left, bounds.left)
    top = Math.min(top, bounds.top)
    right = Math.max(right, bounds.right)
    bottom = Math.max(bottom, bounds.bottom)
  }

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  }
}

function resolveRectCenter(rect: WorkspaceRect) {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  }
}

function resolveRectIntersectionArea(left: WorkspaceRect, right: WorkspaceRect) {
  const leftBounds = resolveRectBounds(left)
  const rightBounds = resolveRectBounds(right)
  const width = Math.max(
    0,
    Math.min(leftBounds.right, rightBounds.right) -
      Math.max(leftBounds.left, rightBounds.left),
  )
  const height = Math.max(
    0,
    Math.min(leftBounds.bottom, rightBounds.bottom) -
      Math.max(leftBounds.top, rightBounds.top),
  )

  return width * height
}

function resolveCardRect({
  cardId,
  nodeLookup,
}: {
  cardId: WorkspaceCardId
  nodeLookup: Map<WorkspaceCardId, WorkspaceBoardState["nodes"][number]>
}): WorkspaceRect {
  const node = nodeLookup.get(cardId)
  const size = node?.size ?? DEFAULT_CARD_SIZES[cardId]
  const dimensions = resolveCardDimensions(size, cardId)
  const fallbackPosition =
    cardId in WORKSPACE_CANVAS_V2_CARD_CONTRACT
      ? WORKSPACE_CANVAS_V2_CARD_CONTRACT[cardId as WorkspaceCanvasV2CardId]
          .defaultPosition
      : {
          x: WORKSPACE_CANVAS_TUTORIAL_START_X,
          y: WORKSPACE_CANVAS_TUTORIAL_START_Y,
        }

  return {
    x: node?.x ?? fallbackPosition.x,
    y: node?.y ?? fallbackPosition.y,
    width: dimensions.width,
    height: dimensions.height,
  }
}

function resolveCandidateGuideRect({
  placement,
  sceneRect,
  anchorRect,
}: {
  placement: Exclude<WorkspaceCanvasTutorialGuidePlacement, "center">
  sceneRect: WorkspaceRect
  anchorRect: WorkspaceRect
}): WorkspaceRect {
  const sceneCenter = resolveRectCenter(sceneRect)
  const anchorCenter = resolveRectCenter(anchorRect)

  if (placement === "above") {
    return {
      x: sceneCenter.x - WORKSPACE_CANVAS_TUTORIAL_NODE_WIDTH / 2,
      y:
        sceneRect.y -
        WORKSPACE_CANVAS_TUTORIAL_NODE_HEIGHT -
        WORKSPACE_CANVAS_TUTORIAL_CLUSTER_GAP,
      width: WORKSPACE_CANVAS_TUTORIAL_NODE_WIDTH,
      height: WORKSPACE_CANVAS_TUTORIAL_NODE_HEIGHT,
    }
  }

  if (placement === "left") {
    return {
      x:
        sceneRect.x -
        WORKSPACE_CANVAS_TUTORIAL_NODE_WIDTH -
        WORKSPACE_CANVAS_TUTORIAL_CLUSTER_GAP,
      y: anchorCenter.y - WORKSPACE_CANVAS_TUTORIAL_NODE_HEIGHT / 2,
      width: WORKSPACE_CANVAS_TUTORIAL_NODE_WIDTH,
      height: WORKSPACE_CANVAS_TUTORIAL_NODE_HEIGHT,
    }
  }

  return {
    x:
      sceneRect.x +
      sceneRect.width +
      WORKSPACE_CANVAS_TUTORIAL_CLUSTER_GAP,
    y: anchorCenter.y - WORKSPACE_CANVAS_TUTORIAL_NODE_HEIGHT / 2,
    width: WORKSPACE_CANVAS_TUTORIAL_NODE_WIDTH,
    height: WORKSPACE_CANVAS_TUTORIAL_NODE_HEIGHT,
  }
}

function clampGuideRect(rect: WorkspaceRect) {
  return {
    ...rect,
    x: Math.max(rect.x, WORKSPACE_CANVAS_TUTORIAL_MIN_X),
    y: Math.max(rect.y, WORKSPACE_CANVAS_TUTORIAL_MIN_Y),
  }
}

function resolveGuidePlacement({
  visibleCardRects,
  sceneRect,
  anchorRect,
}: {
  visibleCardRects: WorkspaceRect[]
  sceneRect: WorkspaceRect
  anchorRect: WorkspaceRect
}) {
  const preferSide = sceneRect.height > sceneRect.width * 1.8
  const candidates = (["above", "left", "right"] as const).map((placement) => {
    const rect = clampGuideRect(
      resolveCandidateGuideRect({
        placement,
        sceneRect,
        anchorRect,
      }),
    )
    const combinedRect = resolveUnionRect([sceneRect, rect])
    const overlapArea = visibleCardRects.reduce(
      (total, visibleRect) => total + resolveRectIntersectionArea(rect, visibleRect),
      0,
    )
    const aspectRatio =
      combinedRect.width > 0 && combinedRect.height > 0
        ? combinedRect.width / combinedRect.height
        : WORKSPACE_CANVAS_TUTORIAL_TARGET_ASPECT_RATIO
    const aspectRatioPenalty = Math.abs(
      aspectRatio - WORKSPACE_CANVAS_TUTORIAL_TARGET_ASPECT_RATIO,
    )
    const anchorCenter = resolveRectCenter(anchorRect)
    const guideCenter = resolveRectCenter(rect)
    const guideDistancePenalty =
      Math.hypot(guideCenter.x - anchorCenter.x, guideCenter.y - anchorCenter.y) /
      1600
    const placementBias =
      placement === "above"
        ? -0.72
        : preferSide
          ? 0.1
          : 0.26

    return {
      placement,
      rect,
      score:
        overlapArea * 1000 +
        aspectRatioPenalty * 10 +
        guideDistancePenalty +
        placementBias,
    }
  })

  candidates.sort((left, right) => left.score - right.score)
  return candidates[0] ?? null
}

function resolveDefaultTutorialNodePosition(
  visibleCardIds: WorkspaceCardId[],
  sceneCardIds: WorkspaceCardId[],
  existingNodes: WorkspaceBoardState["nodes"],
  anchorCardId: WorkspaceCardId | null,
) {
  if (visibleCardIds.length === 0 || sceneCardIds.length === 0 || !anchorCardId) {
    return {
      placement: "center" as const,
      rect: {
        x: WORKSPACE_CANVAS_TUTORIAL_START_X,
        y: WORKSPACE_CANVAS_TUTORIAL_START_Y,
        width: WORKSPACE_CANVAS_TUTORIAL_NODE_WIDTH,
        height: WORKSPACE_CANVAS_TUTORIAL_NODE_HEIGHT,
      },
    }
  }

  const nodeLookup = new Map(
    existingNodes.map((node) => [node.id, node] as const),
  )
  const visibleCardRects = visibleCardIds.map((cardId) =>
    resolveCardRect({
      cardId,
      nodeLookup,
    }),
  )
  const sceneRect = resolveUnionRect(
    sceneCardIds.map((cardId) =>
      resolveCardRect({
        cardId,
        nodeLookup,
      }),
    ),
  )
  const anchorRect = resolveCardRect({
    cardId: anchorCardId,
    nodeLookup,
  })

  return (
    resolveGuidePlacement({
      visibleCardRects,
      sceneRect,
      anchorRect,
    }) ?? {
      placement: "center" as const,
      rect: {
        x: WORKSPACE_CANVAS_TUTORIAL_START_X,
        y: WORKSPACE_CANVAS_TUTORIAL_START_Y,
        width: WORKSPACE_CANVAS_TUTORIAL_NODE_WIDTH,
        height: WORKSPACE_CANVAS_TUTORIAL_NODE_HEIGHT,
      },
    }
  )
}

export function resolveWorkspaceCanvasTutorialSceneSignature({
  tutorialActive,
  tutorialStepIndex,
  openedTutorialStepIds,
}: {
  tutorialActive: boolean
  tutorialStepIndex: number
  openedTutorialStepIds: WorkspaceCanvasTutorialStepId[]
}) {
  if (!tutorialActive) {
    return null
  }

  const continueMode = resolveWorkspaceCanvasTutorialContinueMode(
    tutorialStepIndex,
    openedTutorialStepIds,
  )

  return [tutorialStepIndex, continueMode, openedTutorialStepIds.join(",")].join(
    "::",
  )
}

export function resolveWorkspaceCanvasTutorialPositionOverrideForScene(
  tutorialNodePositionOverride: WorkspaceCanvasTutorialPositionOverride | null,
  tutorialSceneSignature: string | null,
) {
  if (
    !tutorialNodePositionOverride ||
    !tutorialSceneSignature ||
    tutorialNodePositionOverride.sceneSignature !== tutorialSceneSignature
  ) {
    return null
  }

  return {
    x: tutorialNodePositionOverride.x,
    y: tutorialNodePositionOverride.y,
  }
}

export function resolveWorkspaceCanvasTutorialRuntime({
  tutorialStepIndex,
  openedTutorialStepIds = [],
  visibleCardIds,
  existingNodes,
  tutorialNodePositionOverride,
}: {
  tutorialStepIndex: number
  openedTutorialStepIds?: WorkspaceCanvasTutorialStepId[]
  visibleCardIds: WorkspaceCardId[]
  existingNodes: WorkspaceBoardState["nodes"]
  tutorialNodePositionOverride?: { x: number; y: number } | null
}) {
  const currentStep = resolveWorkspaceCanvasTutorialStep(tutorialStepIndex)
  const visibleCardIdSet = new Set<WorkspaceCardId>(visibleCardIds)
  const sceneCardIds = resolveWorkspaceCanvasTutorialSceneFocusCardIds(
    tutorialStepIndex,
    openedTutorialStepIds,
  ).filter((cardId) => visibleCardIdSet.has(cardId))
  const anchorCardId =
    sceneCardIds.at(-1) ??
    (currentStep.targetCardId && visibleCardIdSet.has(currentStep.targetCardId)
      ? currentStep.targetCardId
      : visibleCardIds.at(-1) ?? visibleCardIds[0] ?? null)
  const resolvedGuidePlacement = resolveDefaultTutorialNodePosition(
    visibleCardIds,
    sceneCardIds,
    existingNodes,
    anchorCardId,
  )
  const tutorialNodePosition = tutorialNodePositionOverride
    ? {
        x: roundToSnap(
          Math.max(tutorialNodePositionOverride.x, WORKSPACE_CANVAS_TUTORIAL_MIN_X),
        ),
        y: roundToSnap(
          Math.max(tutorialNodePositionOverride.y, WORKSPACE_CANVAS_TUTORIAL_MIN_Y),
        ),
      }
    : {
        x: roundToSnap(resolvedGuidePlacement.rect.x),
        y: roundToSnap(resolvedGuidePlacement.rect.y),
      }
  const tutorialEdgeTargetCardId =
    currentStep.targetCardId &&
    visibleCardIdSet.has(currentStep.targetCardId as WorkspaceCardId)
      ? currentStep.targetCardId
      : anchorCardId

  return {
    tutorialNodePosition,
    tutorialNodeStyle: {
      width: WORKSPACE_CANVAS_TUTORIAL_NODE_WIDTH,
      minHeight: WORKSPACE_CANVAS_TUTORIAL_NODE_HEIGHT,
    },
    tutorialEdgeTargetCardId,
    guidePlacement: resolvedGuidePlacement.placement,
    fitPadding:
      resolvedGuidePlacement.placement === "left" ||
      resolvedGuidePlacement.placement === "right"
        ? 0.42
        : resolvedGuidePlacement.placement === "above"
          ? 0.34
          : 0.3,
  }
}
