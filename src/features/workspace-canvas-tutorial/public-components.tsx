"use client"

import dynamic from "next/dynamic"
import type { ComponentProps } from "react"

export const WorkspaceCanvasTutorialNode = dynamic<
  ComponentProps<
    typeof import("./components/workspace-canvas-tutorial-node").WorkspaceCanvasTutorialNode
  >
>(
  () =>
    import("./components/workspace-canvas-tutorial-node").then(
      (mod) => mod.WorkspaceCanvasTutorialNode,
    ),
)

export const WorkspaceCanvasTutorialPanel = dynamic<
  ComponentProps<
    typeof import("./components/workspace-canvas-tutorial-panel").WorkspaceCanvasTutorialPanel
  >
>(
  () =>
    import("./components/workspace-canvas-tutorial-panel").then(
      (mod) => mod.WorkspaceCanvasTutorialPanel,
    ),
)
