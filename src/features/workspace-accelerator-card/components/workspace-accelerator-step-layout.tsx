"use client"

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import type { ReactNode } from "react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"
import { resolveWorkspaceCanvasStageMotion } from "@/lib/workspace-canvas/motion-spec"

export function WorkspaceAcceleratorStepLayout({
  children,
  header,
  sidebar,
  footer,
  stackSidebar,
  drawerContainer,
  stepId,
  embedded,
  fullscreen,
  fillBody,
  showCallout,
}: {
  children: ReactNode
  header: ReactNode
  sidebar: ReactNode
  footer: ReactNode
  stackSidebar: boolean
  drawerContainer: HTMLElement | null
  stepId: string
  embedded: boolean
  fullscreen: boolean
  fillBody: boolean
  showCallout: boolean
}) {
  const prefersReducedMotion = useReducedMotion()
  const contentMotion = resolveWorkspaceCanvasStageMotion({
    stage: "content-swap",
    preset: "default",
    prefersReducedMotion: !!prefersReducedMotion,
  })
  const content = (
    <>
      {header}
      <div className={cn(
        "grid min-h-0 min-w-0 flex-1 grid-cols-1 items-stretch",
        stackSidebar && "auto-rows-min content-start overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]",
        !stackSidebar && sidebar && (drawerContainer ? "grid-cols-[minmax(0,1fr)_280px]" : "lg:grid-cols-[minmax(0,1fr)_280px]"),
      )}>
        <div data-workspace-accelerator-lesson-content="true" className={cn(
          "min-h-0 min-w-0",
          fillBody ? "flex h-full flex-col overflow-hidden" : !stackSidebar && "overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]",
        )}>
          <AnimatePresence mode="wait">
            <motion.div
              key={stepId}
              {...contentMotion}
              className={cn("min-w-0", fillBody && "flex h-full min-h-0 flex-1 flex-col")}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
        {sidebar ? (
          <aside className={cn("border-border/60 bg-muted/10 min-h-0 min-w-0 p-3", !stackSidebar && "border-t lg:border-t-0 lg:border-l")}>
            {sidebar}
          </aside>
        ) : null}
      </div>
      {footer}
    </>
  )

  if (drawerContainer) return createPortal(content, drawerContainer)

  return (
    <article className={cn(
      "flex w-full min-w-0 flex-col overflow-hidden",
      fullscreen ? "h-full min-h-0 rounded-none border-0 bg-transparent shadow-none" : "border-border/70 bg-card border",
      showCallout && "overflow-visible",
      embedded
        ? fullscreen
          ? "relative z-10 h-full min-h-0"
          : "relative z-10 h-full min-h-0 rounded-[24px] shadow-[0_24px_60px_-36px_rgba(15,23,42,0.34)]"
        : "h-auto rounded-[24px] shadow-[0_16px_42px_-30px_rgba(15,23,42,0.24)]",
    )}>
      {content}
    </article>
  )
}
