import { WorkspaceCanvasTutorialNode } from "@/features/workspace-canvas-tutorial"

import {
  WorkspaceBoardAcceleratorStepNode,
  WorkspaceBoardNode,
} from "../../workspace-board-node"
import { WorkspaceBoardOnboardingGuideNode } from "../../workspace-board-onboarding-guide-node"

export const WORKSPACE_CANVAS_V2_NODE_TYPES = Object.freeze({
  workspace: WorkspaceBoardNode,
  "accelerator-step": WorkspaceBoardAcceleratorStepNode,
  "onboarding-guide": WorkspaceBoardOnboardingGuideNode,
  "workspace-tutorial": WorkspaceCanvasTutorialNode,
})
