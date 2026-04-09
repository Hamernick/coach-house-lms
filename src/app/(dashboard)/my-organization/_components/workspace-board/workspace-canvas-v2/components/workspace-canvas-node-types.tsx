import dynamic from "next/dynamic"
import type { ComponentProps } from "react"

import {
  WorkspaceBoardAcceleratorStepNode,
  WorkspaceBoardNode,
} from "../../workspace-board-node"
import { WorkspaceBoardOnboardingGuideNode } from "../../workspace-board-onboarding-guide-node"

const WorkspaceCanvasTutorialNode = dynamic<
  ComponentProps<
    typeof import("@/features/workspace-canvas-tutorial").WorkspaceCanvasTutorialNode
  >
>(
  () =>
    import("@/features/workspace-canvas-tutorial").then(
      (mod) => mod.WorkspaceCanvasTutorialNode,
    ),
  {
    loading: () => null,
  },
)

export const WORKSPACE_CANVAS_V2_NODE_TYPES =
  Object.freeze({
    workspace: WorkspaceBoardNode,
    "accelerator-step": WorkspaceBoardAcceleratorStepNode,
    "onboarding-guide": WorkspaceBoardOnboardingGuideNode,
    "workspace-tutorial": WorkspaceCanvasTutorialNode,
  })

export const WORKSPACE_CANVAS_V2_EDGE_TYPES = Object.freeze({})
