"use client"

import { useCallback, useEffect, useState } from "react"

import GripIcon from "lucide-react/dist/esm/icons/grip"
import InfoIcon from "lucide-react/dist/esm/icons/info"
import MoveIcon from "lucide-react/dist/esm/icons/move"
import PanelLeftOpenIcon from "lucide-react/dist/esm/icons/panel-left-open"
import XIcon from "lucide-react/dist/esm/icons/x"
import ZoomInIcon from "lucide-react/dist/esm/icons/zoom-in"
import type { LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"

type WorkspaceCanvasHelpItem = {
  icon: LucideIcon
  label: string
  description: string
}

const WORKSPACE_CANVAS_HELP_ITEMS: WorkspaceCanvasHelpItem[] = [
  {
    icon: MoveIcon,
    label: "Pan canvas",
    description: "Drag empty space to move around the workspace.",
  },
  {
    icon: GripIcon,
    label: "Move cards",
    description: "Drag a card by its header to reposition it on the canvas.",
  },
  {
    icon: ZoomInIcon,
    label: "Zoom",
    description: "Scroll or pinch to zoom in and out without leaving the workspace.",
  },
  {
    icon: PanelLeftOpenIcon,
    label: "Open tools",
    description:
      "Use the tool rail, or the cards drawer on smaller screens, to open and hide workspace cards.",
  },
]

export const WORKSPACE_CANVAS_HELP_TIP_STORAGE_KEY =
  "workspace-canvas-help-tip-dismissed"

export function resolveWorkspaceCanvasHelpTipInitialVisibility() {
  if (typeof window === "undefined") {
    return true
  }

  return window.localStorage.getItem(WORKSPACE_CANVAS_HELP_TIP_STORAGE_KEY) !== "true"
}

export function WorkspaceCanvasSurfaceV2HelpOverlay({
  integrated = false,
}: {
  integrated?: boolean
}) {
  const [tipVisible, setTipVisible] = useState(true)

  useEffect(() => {
    setTipVisible(resolveWorkspaceCanvasHelpTipInitialVisibility())
  }, [])

  const dismissTip = useCallback(() => {
    setTipVisible(false)
    if (typeof window === "undefined") return
    window.localStorage.setItem(WORKSPACE_CANVAS_HELP_TIP_STORAGE_KEY, "true")
  }, [])

  const handleHelpOpenChange = (open: boolean) => {
    if (open) {
      dismissTip()
    }
  }

  return (
    <div
      className={
        integrated
          ? "pointer-events-none relative"
          : "pointer-events-none absolute right-3 top-3 z-20"
      }
    >
      <div className="relative flex items-center justify-end">
        {tipVisible ? (
          <div
            className={
              integrated
                ? "pointer-events-auto absolute right-0 top-full mt-2"
                : "pointer-events-auto absolute right-full top-1/2 mr-2 -translate-y-1/2"
            }
          >
            <div className="bg-primary text-primary-foreground relative flex items-center gap-2 rounded-md px-3 py-1.5 text-xs leading-tight shadow-md">
              <span className="min-w-0 flex-1 whitespace-nowrap">
                Hover for canvas help
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close canvas help tooltip"
                className="ml-auto size-4 shrink-0 rounded-sm p-0 opacity-80 shadow-none transition-opacity hover:bg-transparent hover:text-current hover:opacity-100 focus-visible:ring-2 focus-visible:ring-primary-foreground/70"
                onClick={dismissTip}
              >
                <XIcon className="size-3" aria-hidden />
              </Button>
              <span
                aria-hidden
                className={
                  integrated
                    ? "bg-primary absolute -top-1 right-4 size-2 rotate-45 rounded-[2px]"
                    : "bg-primary absolute -right-1 top-1/2 size-2 -translate-y-1/2 rotate-45 rounded-[2px]"
                }
              />
            </div>
          </div>
        ) : null}

        <HoverCard
          openDelay={120}
          closeDelay={120}
          onOpenChange={handleHelpOpenChange}
        >
          <HoverCardTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Workspace canvas help"
              className="pointer-events-auto rounded-full shadow-sm backdrop-blur-sm"
              onClick={dismissTip}
            >
              <InfoIcon aria-hidden />
            </Button>
          </HoverCardTrigger>

          <HoverCardContent
            align="end"
            side="bottom"
            sideOffset={10}
            collisionPadding={16}
            className="pointer-events-auto w-80 rounded-2xl p-0"
          >
            <div className="flex flex-col">
              <div className="flex flex-col gap-1 border-b border-border/60 px-4 py-3">
                <p className="text-sm font-semibold text-foreground">
                  Canvas help
                </p>
                <p className="text-xs leading-5 text-muted-foreground">
                  Quick controls for moving around the workspace and opening
                  tools.
                </p>
              </div>

              <div className="flex flex-col gap-1 p-2">
                {WORKSPACE_CANVAS_HELP_ITEMS.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start gap-3 rounded-xl px-2 py-2"
                  >
                    <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-muted-foreground">
                      <item.icon aria-hidden />
                    </span>

                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <p className="text-sm font-medium text-foreground">
                        {item.label}
                      </p>
                      <p className="text-xs leading-5 text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      </div>
    </div>
  )
}
