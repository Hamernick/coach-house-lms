"use client"

import { type Dispatch, type SetStateAction } from "react"

import { buildAutoLayoutNodesForMode } from "./workspace-board-auto-layout-modes"
import {
  beginWorkspaceBoardInteraction,
  clearWorkspaceBoardInteraction,
  logWorkspaceBoardDebug,
  logWorkspaceBoardPhase,
  summarizeWorkspaceBoardVisibility,
  type WorkspaceBoardToggleContext,
} from "./workspace-board-debug"
import type {
  WorkspaceBoardState,
  WorkspaceCardId,
} from "./workspace-board-types"
import { reduceWorkspaceBoardVisibility } from "./workspace-board-visibility-reducer"

function areOrderedCardListsEqual(
  left: WorkspaceCardId[],
  right: WorkspaceCardId[]
) {
  if (left.length !== right.length) return false
  return left.every((cardId, index) => cardId === right[index])
}

const FISCAL_SPONSORSHIP_AUTO_POSITION_EPSILON = 8
const FISCAL_SPONSORSHIP_AUTO_LAYOUT_POSITIONS = [
  { x: 64, y: 720 },
  { x: 728, y: 760 },
  { x: 928, y: 728 },
  { x: 1080, y: 760 },
  { x: 1728, y: 896 },
  { x: 1728, y: 1380 },
] as const

function isFiscalSponsorshipAutoLayoutPosition({
  x,
  y,
}: {
  x: number
  y: number
}) {
  return FISCAL_SPONSORSHIP_AUTO_LAYOUT_POSITIONS.some(
    (position) =>
      Math.abs(position.x - x) <= FISCAL_SPONSORSHIP_AUTO_POSITION_EPSILON &&
      Math.abs(position.y - y) <= FISCAL_SPONSORSHIP_AUTO_POSITION_EPSILON
  )
}

function preserveManualFiscalSponsorshipNodePosition({
  previous,
  nextNodes,
}: {
  previous: WorkspaceBoardState
  nextNodes: WorkspaceBoardState["nodes"]
}) {
  const previousFiscalNode = previous.nodes.find(
    (node) => node.id === "fiscal-sponsorship"
  )
  if (!previousFiscalNode) return nextNodes
  if (isFiscalSponsorshipAutoLayoutPosition(previousFiscalNode)) {
    return nextNodes
  }

  return nextNodes.map((node) =>
    node.id === "fiscal-sponsorship"
      ? {
          ...node,
          x: previousFiscalNode.x,
          y: previousFiscalNode.y,
        }
      : node
  )
}

function buildFiscalSponsorshipVisibilityToggleNodes({
  previous,
  next,
}: {
  previous: WorkspaceBoardState
  next: WorkspaceBoardState
}) {
  const previousFiscalNode = previous.nodes.find(
    (node) => node.id === "fiscal-sponsorship"
  )
  if (
    !previousFiscalNode ||
    !isFiscalSponsorshipAutoLayoutPosition(previousFiscalNode)
  ) {
    return previous.nodes
  }

  const autoLayoutFiscalNode = buildAutoLayoutNodesForMode({
    mode: next.autoLayoutMode,
    existingNodes: previous.nodes,
    hiddenCardIds: next.hiddenCardIds,
    connections: previous.connections,
  }).find((node) => node.id === "fiscal-sponsorship")
  if (!autoLayoutFiscalNode) return previous.nodes

  return previous.nodes.map((node) =>
    node.id === "fiscal-sponsorship"
      ? {
          ...node,
          x: autoLayoutFiscalNode.x,
          y: autoLayoutFiscalNode.y,
          size: autoLayoutFiscalNode.size,
        }
      : node
  )
}

function buildVisibilityToggleNodes({
  cardId,
  previous,
  next,
}: {
  cardId: WorkspaceCardId
  previous: WorkspaceBoardState
  next: WorkspaceBoardState
}) {
  if (cardId === "fiscal-sponsorship") {
    return buildFiscalSponsorshipVisibilityToggleNodes({ previous, next })
  }

  return preserveManualFiscalSponsorshipNodePosition({
    previous,
    nextNodes: buildAutoLayoutNodesForMode({
      mode: next.autoLayoutMode,
      existingNodes: previous.nodes,
      hiddenCardIds: next.hiddenCardIds,
      connections: previous.connections,
    }),
  })
}

export function buildToggleCardVisibilityHandler({
  setBoardState,
  setAcceleratorFocusRequestKey,
}: {
  setBoardState: Dispatch<SetStateAction<WorkspaceBoardState>>
  setAcceleratorFocusRequestKey: Dispatch<SetStateAction<number>>
}) {
  return (cardId: WorkspaceCardId, context?: WorkspaceBoardToggleContext) => {
    const interaction = context?.interactionId
      ? {
          id: context.interactionId,
          source: context.source,
          cardId,
        }
      : beginWorkspaceBoardInteraction({
          source: context?.source ?? "unknown",
          cardId,
        })
    let acceleratorVisibleAfterToggle = false
    let shouldRequestAcceleratorFocus = false
    const actionType: "context_hide_card" | "dock_toggle_card" =
      context?.source === "context-menu"
        ? "context_hide_card"
        : "dock_toggle_card"

    setBoardState((previous) => {
      const next = reduceWorkspaceBoardVisibility(previous, {
        type: actionType,
        cardId,
      })
      const nextNodes = buildVisibilityToggleNodes({
        cardId,
        previous,
        next,
      })
      const before = summarizeWorkspaceBoardVisibility(previous)
      const after = summarizeWorkspaceBoardVisibility({
        ...next,
        nodes: nextNodes,
      })
      const beforeHiddenWithoutTarget = before.hiddenCardIds.filter(
        (id) => id !== cardId
      )
      const afterHiddenWithoutTarget = after.hiddenCardIds.filter(
        (id) => id !== cardId
      )
      const nonTargetHiddenChanged = !areOrderedCardListsEqual(
        beforeHiddenWithoutTarget,
        afterHiddenWithoutTarget
      )
      const visibleCountDelta = after.visibleCount - before.visibleCount

      logWorkspaceBoardDebug("toggle_card_visibility", {
        cardId,
        interactionId: interaction.id,
        interactionSource: interaction.source,
        interactionCardId: interaction.cardId,
        before,
        after,
        nonTargetHiddenChanged,
        visibleCountDelta,
      })
      logWorkspaceBoardPhase("toggle_reduced", {
        cardId,
        interactionId: interaction.id,
        interactionSource: interaction.source,
        nonTargetHiddenChanged,
        visibleCountDelta,
      })

      logWorkspaceBoardDebug("toggle_card_visibility_tree_reflow", {
        cardId,
        interactionId: interaction.id,
        interactionSource: interaction.source,
        beforeHiddenWithoutTarget,
        afterHiddenWithoutTarget,
      })
      if (cardId === "accelerator") {
        const acceleratorVisibleBeforeToggle =
          !before.hiddenCardIds.includes("accelerator")
        acceleratorVisibleAfterToggle =
          !after.hiddenCardIds.includes("accelerator")
        shouldRequestAcceleratorFocus =
          actionType === "dock_toggle_card" &&
          !acceleratorVisibleBeforeToggle &&
          acceleratorVisibleAfterToggle
      }

      return {
        ...next,
        nodes: nextNodes,
      }
    })
    if (cardId === "accelerator") {
      logWorkspaceBoardDebug("layout_fit_requested_after_accelerator_toggle", {
        cardId,
        interactionId: interaction.id,
        interactionSource: interaction.source,
        acceleratorVisibleAfterToggle,
      })
      if (shouldRequestAcceleratorFocus) {
        setAcceleratorFocusRequestKey((previous) => previous + 1)
      }
    }
    clearWorkspaceBoardInteraction(interaction.id)
  }
}
