"use client"

import Building2Icon from "lucide-react/dist/esm/icons/building-2"
import BadgeDollarSignIcon from "lucide-react/dist/esm/icons/badge-dollar-sign"
import CalendarDaysIcon from "lucide-react/dist/esm/icons/calendar-days"
import FolderPlusIcon from "lucide-react/dist/esm/icons/folder-plus"
import FolderTreeIcon from "lucide-react/dist/esm/icons/folder-tree"
import MapIcon from "lucide-react/dist/esm/icons/map"
import MegaphoneIcon from "lucide-react/dist/esm/icons/megaphone"
import RouteIcon from "lucide-react/dist/esm/icons/route"
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
  roadmap: RouteIcon,
  deck: WaypointsIcon,
  accelerator: WaypointsIcon,
  "brand-kit": FolderTreeIcon,
  "economic-engine": BadgeDollarSignIcon,
  calendar: CalendarDaysIcon,
  communications: MegaphoneIcon,
  atlas: MapIcon,
}

export type WorkspaceCardShortcutItemModel = {
  id: WorkspaceCanvasV2CardId
  title: string
  icon: LucideIcon
  visible: boolean
  selected: boolean
  comingSoon: boolean
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

const WORKSPACE_SHORTCUT_FOCUS_OPEN_CARD_IDS = new Set<WorkspaceCanvasV2CardId>([
  "deck",
  "accelerator",
  "roadmap",
])
const WORKSPACE_SHORTCUT_COMING_SOON_CARD_IDS = new Set<WorkspaceCanvasV2CardId>([
  "economic-engine",
  "communications",
])

function shouldRenderWorkspaceShortcutCard(cardId: WorkspaceCanvasV2CardId) {
  if (WORKSPACE_SHORTCUT_HIDDEN_CARD_IDS.has(cardId)) {
    return false
  }

  if (cardId === "calendar" || cardId === "deck") {
    return false
  }

  return true
}

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
    .filter((cardId) => shouldRenderWorkspaceShortcutCard(cardId))
    .map((cardId) => {
      const contract = WORKSPACE_CANVAS_V2_CARD_CONTRACT[cardId]
      const boardVisible = !hiddenCardIds.includes(cardId)
      const visible = visibleCardIds
        ? visibleCardIds.includes(cardId)
        : boardVisible
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
        comingSoon: WORKSPACE_SHORTCUT_COMING_SOON_CARD_IDS.has(cardId),
        tutorialHighlighted: tutorialHighlightAll || tutorialCallout !== null,
        tutorialCallout,
        onPress: () => {
          if (WORKSPACE_SHORTCUT_COMING_SOON_CARD_IDS.has(cardId)) {
            return
          }

          if (tutorialCallout) {
            onTutorialAdvance?.()
            return
          }

          if (contract.rail.rootBehavior === "fixed") {
            if (!boardVisible) {
              onToggle(cardId, { source: "dock" })
            }
            onFocusCard(cardId)
            return
          }

          if (WORKSPACE_SHORTCUT_FOCUS_OPEN_CARD_IDS.has(cardId)) {
            if (!boardVisible) {
              onToggle(cardId, { source: "dock" })
            }
            onFocusCard(cardId)
            return
          }

          if (boardVisible) {
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
