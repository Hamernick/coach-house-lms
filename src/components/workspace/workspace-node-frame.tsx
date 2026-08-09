import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

export function WorkspaceNodeFrameRoot({
  className,
  ...props
}: ComponentProps<"article">) {
  return (
    <article
      data-workspace-node-part="root"
      className={cn(
        "border-border/70 bg-card/95 focus-visible:ring-ring/50 relative overflow-visible rounded-xl border shadow-sm focus-visible:ring-2 focus-visible:outline-none",
        className
      )}
      {...props}
    />
  )
}

export function WorkspaceNodeFrameSurface({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      data-workspace-node-part="surface"
      className={cn(
        "relative h-full min-h-0 w-full min-w-0 overflow-hidden rounded-[inherit]",
        className
      )}
      {...props}
    />
  )
}

export function WorkspaceNodeFrameHeader({
  className,
  ...props
}: ComponentProps<"header">) {
  return (
    <header
      data-workspace-node-part="header"
      className={cn(
        "flex w-full min-w-0 items-start gap-2.5 overflow-hidden",
        className
      )}
      {...props}
    />
  )
}

export function WorkspaceNodeFrameBody({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      data-workspace-node-part="body"
      className={cn("min-h-0 min-w-0 overflow-hidden", className)}
      {...props}
    />
  )
}

export function WorkspaceNodeFrameFooter({
  className,
  ...props
}: ComponentProps<"footer">) {
  return (
    <footer
      data-workspace-node-part="footer"
      className={cn(
        "flex w-full min-w-0 items-center overflow-hidden",
        className
      )}
      {...props}
    />
  )
}
