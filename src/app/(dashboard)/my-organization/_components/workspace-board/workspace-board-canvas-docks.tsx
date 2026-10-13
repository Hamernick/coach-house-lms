"use client"

import Building2Icon from "lucide-react/dist/esm/icons/building-2"
import CalendarDaysIcon from "lucide-react/dist/esm/icons/calendar-days"
import CheckSquareIcon from "lucide-react/dist/esm/icons/check-square"
import DollarSignIcon from "lucide-react/dist/esm/icons/dollar-sign"
import FileStackIcon from "lucide-react/dist/esm/icons/file-stack"
import MapIcon from "lucide-react/dist/esm/icons/map"
import MegaphoneIcon from "lucide-react/dist/esm/icons/megaphone"
import PaletteIcon from "lucide-react/dist/esm/icons/palette"

import { AppleDock, AppleDockItem } from "@/components/shadcn-space/apple-dock/apple-dock"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { WORKSPACE_CARD_META } from "./workspace-board-copy"
import type { WorkspaceCardId } from "./workspace-board-types"

const BOTTOM_DOCK_CARD_IDS: WorkspaceCardId[] = [
  "organization-overview",
  "formation-status",
  "brand-kit",
  "economic-engine",
  "calendar",
  "communications",
]

const LEFT_DOCK_CARD_IDS: WorkspaceCardId[] = ["vault"]

const CARD_ICON_BY_ID: Record<WorkspaceCardId, typeof Building2Icon> = {
  "organization-overview": Building2Icon,
  "formation-status": CheckSquareIcon,
  "brand-kit": PaletteIcon,
  "economic-engine": DollarSignIcon,
  calendar: CalendarDaysIcon,
  communications: MegaphoneIcon,
  deck: FileStackIcon,
  vault: FileStackIcon,
  atlas: MapIcon,
}

const DOCK_LABEL_BY_ID: Record<WorkspaceCardId, string> = {
  "organization-overview": "Org",
  "formation-status": "Accelerator",
  "brand-kit": "Brand",
  "economic-engine": "Engine",
  calendar: "Calendar",
  communications: "Comms",
  deck: "Deck",
  vault: "Docs",
  atlas: "Atlas",
}

function DockButton({
  cardId,
  hiddenCardIds,
  disabled,
  onToggle,
  orientation = "horizontal",
}: {
  cardId: WorkspaceCardId
  hiddenCardIds: WorkspaceCardId[]
  disabled: boolean
  onToggle: (cardId: WorkspaceCardId) => void
  orientation?: "horizontal" | "vertical"
}) {
  const Icon = CARD_ICON_BY_ID[cardId]
  const visible = !hiddenCardIds.includes(cardId)
  const title = WORKSPACE_CARD_META[cardId].title
  const label = DOCK_LABEL_BY_ID[cardId]

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={disabled}
      onClick={() => onToggle(cardId)}
      title={`${visible ? "Hide" : "Show"} ${title}`}
      aria-label={`${visible ? "Hide" : "Show"} ${title}`}
      aria-pressed={visible}
      className={cn(
        "group relative inline-flex h-full w-full items-center justify-center overflow-visible rounded-[14px] border transition-[background-color,border-color,color,box-shadow] duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-1",
        orientation === "horizontal" && "-translate-y-1",
        visible
          ? "border-border/75 bg-card text-foreground shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.18)] hover:bg-accent/35 dark:border-border/70 dark:bg-card/90 dark:shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.28)]"
          : "border-border/70 bg-background/80 text-muted-foreground hover:bg-muted/35 hover:text-foreground dark:bg-background/65",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <Icon className="h-[18px] w-[18px]" aria-hidden />
      <span
        className={cn(
          "pointer-events-none absolute left-1/2 top-full mt-0.5 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium leading-none text-muted-foreground/95",
          visible && "text-foreground/90",
        )}
        aria-hidden
      >
        {label}
      </span>
    </Button>
  )
}

export function WorkspaceBoardCanvasDocks({
  hiddenCardIds,
  disabled,
  onToggle,
  allowAcceleratorCard = true,
}: {
  hiddenCardIds: WorkspaceCardId[]
  disabled: boolean
  onToggle: (cardId: WorkspaceCardId) => void
  allowAcceleratorCard?: boolean
}) {
  const bottomDockCardIds = allowAcceleratorCard
    ? BOTTOM_DOCK_CARD_IDS
    : BOTTOM_DOCK_CARD_IDS.filter((cardId) => cardId !== "formation-status")

  return (
    <>
      <div className="pointer-events-none absolute bottom-2 left-1/2 z-20 -translate-x-1/2">
        <AppleDock
          className="pointer-events-auto h-[70px] overflow-visible border-border/65 bg-card/90 pb-3 pt-1 shadow-lg"
          iconSize={44}
          iconMagnification={64}
          iconDistance={150}
          orientation="horizontal"
        >
          {bottomDockCardIds.map((cardId) => (
            <AppleDockItem key={`bottom-${cardId}`}>
              <DockButton
                cardId={cardId}
                hiddenCardIds={hiddenCardIds}
                disabled={disabled}
                onToggle={onToggle}
                orientation="horizontal"
              />
            </AppleDockItem>
          ))}
        </AppleDock>
      </div>

      <div className="pointer-events-none absolute left-2 top-1/2 z-20 -translate-y-1/2">
        <AppleDock
          className="pointer-events-auto !gap-4 overflow-visible border-border/65 bg-card/90 pb-4 pt-2 shadow-lg"
          iconSize={44}
          iconMagnification={62}
          iconDistance={130}
          orientation="vertical"
        >
          {LEFT_DOCK_CARD_IDS.map((cardId) => (
            <AppleDockItem key={`left-${cardId}`}>
              <DockButton
                cardId={cardId}
                hiddenCardIds={hiddenCardIds}
                disabled={disabled}
                onToggle={onToggle}
                orientation="vertical"
              />
            </AppleDockItem>
          ))}
        </AppleDock>
      </div>
    </>
  )
}
