"use client"

import dynamic from "next/dynamic"
import type { ComponentProps } from "react"

export const WorkspaceAcceleratorCardPanel = dynamic<
  ComponentProps<
    typeof import("./components/workspace-accelerator-card-panel").WorkspaceAcceleratorCardPanel
  >
>(
  () =>
    import("./components/workspace-accelerator-card-panel").then(
      (mod) => mod.WorkspaceAcceleratorCardPanel,
    ),
)

export const WorkspaceAcceleratorStepNodeCard = dynamic<
  ComponentProps<
    typeof import("./components/workspace-accelerator-step-node-card").WorkspaceAcceleratorStepNodeCard
  >
>(
  () =>
    import("./components/workspace-accelerator-step-node-card").then(
      (mod) => mod.WorkspaceAcceleratorStepNodeCard,
    ),
)

export const WorkspaceAcceleratorHeaderPicker = dynamic<
  ComponentProps<
    typeof import("./components/workspace-accelerator-header-picker").WorkspaceAcceleratorHeaderPicker
  >
>(
  () =>
    import("./components/workspace-accelerator-header-picker").then(
      (mod) => mod.WorkspaceAcceleratorHeaderPicker,
    ),
)

export const WorkspaceAcceleratorHeaderSummary = dynamic<
  ComponentProps<
    typeof import("./components/workspace-accelerator-card-panel-support").WorkspaceAcceleratorHeaderSummary
  >
>(
  () =>
    import("./components/workspace-accelerator-card-panel-support").then(
      (mod) => mod.WorkspaceAcceleratorHeaderSummary,
    ),
)
