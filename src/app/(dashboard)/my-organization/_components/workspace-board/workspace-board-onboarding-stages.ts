import { getWorkspaceEditorPath } from "@/lib/workspace/routes"

import type {
  WorkspaceCardId,
  WorkspaceOnboardingStage,
} from "./workspace-board-types"

export type WorkspaceOnboardingStageDefinition = {
  stage: WorkspaceOnboardingStage
  title: string
  description: string
  checklist: [string, string, string]
  targetCardId: WorkspaceCardId
  primaryLabel: string
  primaryHref: string | null
}

export const WORKSPACE_ONBOARDING_STAGE_ORDER: WorkspaceOnboardingStage[] = [
  2,
  3,
  4,
]

export const WORKSPACE_ONBOARDING_STAGE_DEFINITIONS: Record<
  WorkspaceOnboardingStage,
  WorkspaceOnboardingStageDefinition
> = {
  2: {
    stage: 2,
    title: "Build your organization foundation",
    description:
      "Set up the essentials so your workspace and collaborators have clear context.",
    checklist: [
      "Complete your organization profile",
      "Add at least one teammate or board member",
      "Upload your first operating document",
    ],
    targetCardId: "organization-overview",
    primaryLabel: "Open organization editor",
    primaryHref: getWorkspaceEditorPath({ tab: "company" }),
  },
  3: {
    stage: 3,
    title: "Open your active step node",
    description:
      "Use the canvas step node to work through a class step without losing your workspace context.",
    checklist: [
      "Open the current accelerator step node",
      "Review the step details and resources",
      "Advance or complete one step action",
    ],
    targetCardId: "accelerator",
    primaryLabel: "Open step node",
    primaryHref: null,
  },
  4: {
    stage: 4,
    title: "Start your accelerator run",
    description:
      "Move from setup to execution by opening your next accelerator step.",
    checklist: [
      "Open your next accelerator step",
      "Complete one class step",
      "Return to workspace to continue building",
    ],
    targetCardId: "accelerator",
    primaryLabel: "Open accelerator",
    primaryHref: "/accelerator",
  },
}

export function isOnboardingStage(
  value: unknown,
): value is WorkspaceOnboardingStage {
  return value === 2 || value === 3 || value === 4
}

export function stageRank(stage: WorkspaceOnboardingStage) {
  return WORKSPACE_ONBOARDING_STAGE_ORDER.indexOf(stage)
}

export function normalizeCompletedFromStage(stage: WorkspaceOnboardingStage) {
  const rank = stageRank(stage)
  if (rank <= 0) return []
  return WORKSPACE_ONBOARDING_STAGE_ORDER.slice(0, rank)
}

export function resolveWorkspaceOnboardingStageFromSearchParam(
  value: string | null | undefined,
): WorkspaceOnboardingStage | null {
  if (!value) return null
  const numeric = Number.parseInt(value, 10)
  if (!Number.isFinite(numeric)) return null
  return isOnboardingStage(numeric) ? numeric : null
}

export function getNextOnboardingStage(
  stage: WorkspaceOnboardingStage,
): WorkspaceOnboardingStage | null {
  const nextIndex = stageRank(stage) + 1
  return WORKSPACE_ONBOARDING_STAGE_ORDER[nextIndex] ?? null
}

export function getPreviousOnboardingStage(
  stage: WorkspaceOnboardingStage,
): WorkspaceOnboardingStage | null {
  const previousIndex = stageRank(stage) - 1
  return WORKSPACE_ONBOARDING_STAGE_ORDER[previousIndex] ?? null
}
