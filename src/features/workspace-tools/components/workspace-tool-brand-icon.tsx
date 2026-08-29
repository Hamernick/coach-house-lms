import { siGoogledrive, siStripe } from "simple-icons"

import { cn } from "@/lib/utils"

import type { WorkspaceToolId } from "../types"

const TOOL_BRANDS = {
  stripe: siStripe,
  "google-drive": siGoogledrive,
} as const

export function WorkspaceToolBrandIcon({
  toolId,
  className,
}: {
  toolId: WorkspaceToolId
  className?: string
}) {
  const brand = TOOL_BRANDS[toolId]

  return (
    <span
      aria-hidden="true"
      className={cn(
        "border-border/70 bg-muted/60 inline-flex size-10 shrink-0 items-center justify-center rounded-lg border",
        className
      )}
    >
      <svg
        viewBox="0 0 24 24"
        focusable="false"
        className="size-5 shrink-0"
        style={{ color: `#${brand.hex}` }}
      >
        <path fill="currentColor" d={brand.path} />
      </svg>
    </span>
  )
}
