"use client"

import type { ReactNode } from "react"

import type { ReactGrabOwnerDescriptor } from "@/components/dev/react-grab-surface"
import { getReactGrabLinkedSurfaceProps } from "@/components/dev/react-grab-surface"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  WORKSPACE_TUTORIAL_TOOLTIP_INVERSE_SURFACE_CLASSNAME,
  WORKSPACE_TUTORIAL_NEUTRAL_SURFACE_CLASSNAME,
} from "@/components/workspace/workspace-tutorial-theme"
import { cn } from "@/lib/utils"

export const WORKSPACE_ACCELERATOR_TUTORIAL_NEUTRAL_SURFACE_CLASSNAME =
  WORKSPACE_TUTORIAL_NEUTRAL_SURFACE_CLASSNAME

export const WORKSPACE_ACCELERATOR_TUTORIAL_GUARD_CHROME_CLASSNAME =
  cn(
    "max-w-52 text-left whitespace-normal",
    WORKSPACE_TUTORIAL_TOOLTIP_INVERSE_SURFACE_CLASSNAME,
  )
const WORKSPACE_TUTORIAL_THEME_SOURCE =
  "src/components/workspace/workspace-tutorial-theme.ts"
const TOOLTIP_IMPORT = "@/components/ui/tooltip"

export function WorkspaceAcceleratorTutorialGuardTooltip({
  open,
  message,
  children,
  ownerDescriptor = null,
  side = "top",
  align = "center",
  sideOffset = 8,
}: {
  open: boolean
  message: string | null
  children: ReactNode
  ownerDescriptor?: ReactGrabOwnerDescriptor | null
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  sideOffset?: number
}) {
  if (!message) {
    return children
  }

  return (
    <Tooltip open={open}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side={side}
        align={align}
        sideOffset={sideOffset}
        {...(ownerDescriptor
          ? getReactGrabLinkedSurfaceProps({
            ownerId: ownerDescriptor.ownerId,
            component: "WorkspaceAcceleratorTutorialGuardTooltip",
            source:
              "src/features/workspace-accelerator-card/components/workspace-accelerator-tutorial-guard-tooltip.tsx",
            slot: ownerDescriptor.slot,
            surfaceKind: "content",
            tokenSource: WORKSPACE_TUTORIAL_THEME_SOURCE,
            primitiveImport: TOOLTIP_IMPORT,
          })
          : {})}
        className={cn(
          WORKSPACE_ACCELERATOR_TUTORIAL_GUARD_CHROME_CLASSNAME,
        )}
      >
        {message}
      </TooltipContent>
    </Tooltip>
  )
}
