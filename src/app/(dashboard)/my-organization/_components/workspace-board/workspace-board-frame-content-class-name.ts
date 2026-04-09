import { cn } from "@/lib/utils"

import type { WorkspaceCardId } from "./workspace-board-types"
import type { WorkspaceBoardNodeData } from "./workspace-board-node-types"

export function resolveWorkspaceBoardFrameContentClassName({
  cardId,
  acceleratorTutorialCallout,
}: {
  cardId: WorkspaceCardId
  acceleratorTutorialCallout: WorkspaceBoardNodeData["acceleratorTutorialCallout"]
}) {
  if (cardId === "roadmap") return "px-0 pt-0 pb-0"
  if (cardId === "deck") return "overflow-hidden px-0 pt-0 pb-0"
  if (cardId === "accelerator") {
    return cn(
      "px-3 pt-0.5 pb-3",
      acceleratorTutorialCallout?.focus === "close-module" && "overflow-visible",
    )
  }
  if (cardId === "atlas") return "min-h-0 flex-1 px-0 pt-0 pb-0"
  if (cardId === "brand-kit" || cardId === "communications") return "pt-0.5"
  return undefined
}
