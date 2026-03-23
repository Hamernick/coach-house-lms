"use client"

import {
  getReactGrabLinkedSurfaceProps,
  getReactGrabOwnerProps,
} from "@/components/dev/react-grab-surface"

import type { WorkspaceCanvasTutorialStepId } from "../types"

const WORKSPACE_TUTORIAL_PANEL_SOURCE =
  "src/features/workspace-canvas-tutorial/components/workspace-canvas-tutorial-panel.tsx"

export function resolveWorkspaceTutorialPanelOwnerId(
  stepId: WorkspaceCanvasTutorialStepId,
) {
  return `workspace-canvas-tutorial-panel:${stepId}`
}

export function getWorkspaceTutorialPanelOwnerProps(
  stepId: WorkspaceCanvasTutorialStepId,
) {
  return getReactGrabOwnerProps({
    ownerId: resolveWorkspaceTutorialPanelOwnerId(stepId),
    component: "WorkspaceCanvasTutorialPanel",
    source: WORKSPACE_TUTORIAL_PANEL_SOURCE,
    slot: "card",
    primitiveImport: "@/components/ui/card",
  })
}

export function getWorkspaceTutorialPanelSurfaceProps({
  stepId,
  slot,
  surfaceKind,
  primitiveImport,
}: {
  stepId: WorkspaceCanvasTutorialStepId
  slot: string
  surfaceKind: "trigger" | "content" | "indicator" | "portal" | "root"
  primitiveImport?: string
}) {
  return getReactGrabLinkedSurfaceProps({
    ownerId: resolveWorkspaceTutorialPanelOwnerId(stepId),
    component: "WorkspaceCanvasTutorialPanel",
    source: WORKSPACE_TUTORIAL_PANEL_SOURCE,
    slot,
    surfaceKind,
    primitiveImport,
  })
}
