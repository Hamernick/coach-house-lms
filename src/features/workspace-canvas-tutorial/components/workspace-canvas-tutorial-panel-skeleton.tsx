"use client"

import { motion } from "framer-motion"

import { resolveWorkspaceCanvasStageMotion } from "@/lib/workspace-canvas/motion-spec"

import type { WorkspaceCanvasTutorialPresentationSurface } from "../types"
import type { WorkspaceTutorialPresentationMotionPreset } from "./workspace-canvas-tutorial-panel-motion"

type WorkspaceTutorialPresentationSkeletonProps = {
  presentationSurface: WorkspaceCanvasTutorialPresentationSurface
  motionPreset: WorkspaceTutorialPresentationMotionPreset
  prefersReducedMotion: boolean
}

export function WorkspaceTutorialPresentationSkeleton({
  presentationSurface,
  motionPreset,
  prefersReducedMotion,
}: WorkspaceTutorialPresentationSkeletonProps) {
  const frameRadius =
    presentationSurface.frameRadius ??
    (presentationSurface.kind === "dashed-frame" ? 32 : 30)
  const skeletonMotion = resolveWorkspaceCanvasStageMotion({
    stage: "presentation-skeleton",
    preset: motionPreset,
    prefersReducedMotion,
  })

  return (
    <motion.div
      aria-hidden="true"
      initial={skeletonMotion.initial}
      animate={skeletonMotion.animate}
      exit={skeletonMotion.exit}
      transition={skeletonMotion.transition}
      className="mx-auto relative overflow-hidden"
      style={{
        width: presentationSurface.frameWidth,
        height: presentationSurface.frameHeight,
        padding: presentationSurface.frameInset,
        borderRadius: frameRadius,
      }}
    >
      <div
        className={
          presentationSurface.kind === "dashed-frame"
            ? "absolute inset-0 border-2 border-dashed border-border/70"
            : "absolute inset-0 border border-border/65 bg-card/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
        }
        style={{ borderRadius: frameRadius }}
      />
      <div className="relative flex h-full flex-col gap-3 rounded-[22px] bg-background/55 p-4">
        <div className="h-5 w-28 animate-pulse rounded-full bg-muted/60" />
        <div className="space-y-2">
          <div className="h-3 w-full animate-pulse rounded-full bg-muted/45" />
          <div className="h-3 w-4/5 animate-pulse rounded-full bg-muted/35" />
        </div>
        <div className="mt-auto h-24 animate-pulse rounded-[18px] border border-border/50 bg-muted/30" />
      </div>
    </motion.div>
  )
}
