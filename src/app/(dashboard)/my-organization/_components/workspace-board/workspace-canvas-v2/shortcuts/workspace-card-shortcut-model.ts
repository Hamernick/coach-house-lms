"use client"

import Building2Icon from "lucide-react/dist/esm/icons/building-2"
import BadgeDollarSignIcon from "lucide-react/dist/esm/icons/badge-dollar-sign"
import CalendarDaysIcon from "lucide-react/dist/esm/icons/calendar-days"
import FolderPlusIcon from "lucide-react/dist/esm/icons/folder-plus"
import FolderTreeIcon from "lucide-react/dist/esm/icons/folder-tree"
import MegaphoneIcon from "lucide-react/dist/esm/icons/megaphone"
import WaypointsIcon from "lucide-react/dist/esm/icons/waypoints"
import type { LucideIcon } from "lucide-react"

import { WORKSPACE_CARD_META } from "../../workspace-board-copy"
import type { WorkspaceBoardToggleContext } from "../../workspace-board-debug"
import type { WorkspaceCardId } from "../../workspace-board-types"
import { resolveWorkspaceCanvasRailCardOrder } from "../contracts/workspace-card-tree-contract"
import {
  WORKSPACE_CANVAS_V2_CARD_CONTRACT,
  type WorkspaceCanvasV2CardId,
} from "../contracts/workspace-card-contract"

type WorkspaceShortcutIconMap = Record<WorkspaceCanvasV2CardId, LucideIcon>

const WORKSPACE_SHORTCUT_ICON_BY_ID: WorkspaceShortcutIconMap = {
  "organization-overview": Building2Icon,
  programs: FolderPlusIcon,
  vault: FolderTreeIcon,
  accelerator: WaypointsIcon,
  "brand-kit": FolderTreeIcon,
  "economic-engine": BadgeDollarSignIcon,
  calendar: CalendarDaysIcon,
  communications: MegaphoneIcon,
}

export type WorkspaceCardShortcutItemModel = {
  id: WorkspaceCanvasV2CardId
  title: string
  icon: LucideIcon
  visible: boolean
  selected: boolean
  tutorialHighlighted: boolean
  tutorialCallout:
    | {
        instruction: string
      }
    | null
  onPress: () => void
}

const WORKSPACE_SHORTCUT_HIDDEN_CARD_IDS = new Set<WorkspaceCanvasV2CardId>([
  "organization-overview",
])

export function buildWorkspaceCardShortcutItemModels({
  hiddenCardIds,
  visibleCardIds,
  selectedCardId,
  onToggle,
  onFocusCard,
  tutorialTargetCardId = null,
  tutorialInstruction = null,
  tutorialHighlightAll = false,
  onTutorialAdvance,
}: {
  hiddenCardIds: WorkspaceCardId[]
  visibleCardIds?: WorkspaceCardId[] | null
  selectedCardId: WorkspaceCardId | null
  onToggle: (cardId: WorkspaceCardId, context?: WorkspaceBoardToggleContext) => void
  onFocusCard: (cardId: WorkspaceCardId) => void
  tutorialTargetCardId?: WorkspaceCardId | null
  tutorialInstruction?: string | null
  tutorialHighlightAll?: boolean
  onTutorialAdvance?: (() => void) | null
}): WorkspaceCardShortcutItemModel[] {
  return resolveWorkspaceCanvasRailCardOrder()
    .filter((cardId) => !WORKSPACE_SHORTCUT_HIDDEN_CARD_IDS.has(cardId))
    .map((cardId) => {
      const contract = WORKSPACE_CANVAS_V2_CARD_CONTRACT[cardId]
      const visible = visibleCardIds
        ? visibleCardIds.includes(cardId)
        : !hiddenCardIds.includes(cardId)
      const tutorialCallout =
        tutorialTargetCardId === cardId && tutorialInstruction
          ? { instruction: tutorialInstruction }
          : null

      return {
        id: cardId,
        title: WORKSPACE_CARD_META[cardId].title,
        icon: WORKSPACE_SHORTCUT_ICON_BY_ID[cardId],
        visible,
        selected: selectedCardId === cardId,
        tutorialHighlighted: tutorialHighlightAll || tutorialCallout !== null,
        tutorialCallout,
        onPress: () => {
          if (tutorialCallout) {
            if (!visible) {
              onToggle(cardId, { source: "dock" })
            }
            onFocusCard(cardId)
            onTutorialAdvance?.()
            return
          }

          if (contract.rail.rootBehavior === "fixed") {
            onFocusCard(cardId)
            return
          }

          if (visible) {
            onToggle(cardId, { source: "dock" })
            onFocusCard(contract.rail.parentId ?? "organization-overview")
            return
          }

          onToggle(cardId, { source: "dock" })
          onFocusCard(cardId)
        },
      }
    })
}
