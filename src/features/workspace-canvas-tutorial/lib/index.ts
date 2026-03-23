import type {
  WorkspaceCanvasTutorialCallout,
  WorkspaceCanvasTutorialCardId,
  WorkspaceCanvasTutorialStepId,
  WorkspaceCanvasTutorialStep,
} from "../types"
import { WORKSPACE_REST_VISIBLE_CARD_IDS } from "@/lib/workspace-card-policy"
import { WORKSPACE_MAP_FEATURE_ENABLED } from "@/lib/workspace-map-feature"

const WORKSPACE_CANVAS_TUTORIAL_ALL_STEPS: WorkspaceCanvasTutorialStep[] = [
  {
    id: "welcome",
    sceneId: "overview",
    title: "Welcome to Workspace",
    message:
      "This canvas keeps your organization, roadmap, programs, accelerator, and calendar in one place.",
    targetCardId: null,
    targetLabel: "Workspace",
    revealedCardIds: [],
    continueMode: "next",
  },
  {
    id: "organization",
    sceneId: "overview",
    title: "Build your Organization",
    message:
      "Update your public and private organization details, and connect it to the roadmap, programs, calendar, and team activity that shape the rest of the workspace.",
    targetCardId: "organization-overview",
    targetLabel: "Organization",
    revealedCardIds: ["organization-overview"],
    continueMode: "next",
  },
  {
    id: "map-button",
    sceneId: "overview",
    title: "Map",
    message:
      "Use the new Map button in the Organization header to open the public map card without leaving the workspace.",
    targetCardId: null,
    targetLabel: "Map button",
    revealedCardIds: ["organization-overview"],
    continueMode: "action",
    calloutTarget: "organization-map-button",
    calloutInstruction: "Click to open the Map and continue.",
  },
  {
    id: "map-card",
    sceneId: "map",
    title: "Map",
    message:
      "This card connects your organization to place. It shows what still needs to be completed before you can confidently go live on the map.",
    targetCardId: "atlas",
    targetLabel: "Map card",
    revealedCardIds: ["organization-overview", "atlas"],
    continueMode: "next",
  },
  {
    id: "tool-buttons",
    sceneId: "overview",
    title: "Tools",
    message:
      "Buttons on the left side of your Organization card will open different tools to help you plan and build your org.",
    targetCardId: null,
    targetLabel: "Tools",
    revealedCardIds: ["organization-overview"],
    continueMode: "next",
    highlightShortcutButtons: true,
  },
  {
    id: "accelerator",
    sceneId: "overview",
    title: "The Accelerator",
    message:
      "Built from raising $30M+ over 25+ years operating nonprofits, the Accelerator helps you move through classes, complete key setup work, and keep momentum without leaving the workspace.",
    targetCardId: "accelerator",
    targetLabel: "Accelerator",
    revealedCardIds: ["organization-overview"],
    continueMode: "shortcut",
    calloutTarget: "shortcut-button",
    calloutInstruction: "Click to open the Accelerator tool and continue.",
  },
  {
    id: "accelerator-picker",
    sceneId: "accelerator",
    title: "Classes",
    message:
      "Use this picker to switch between class tracks so you can see the right modules, progress, and next steps for each part of the Accelerator.",
    targetCardId: "accelerator",
    targetLabel: "Class picker",
    revealedCardIds: ["accelerator"],
    continueMode: "next",
    calloutTarget: "accelerator-picker",
    calloutInstruction:
      "Choose a class track here to update the module list and focus on a different part of the Accelerator.",
  },
  {
    id: "accelerator-first-module",
    sceneId: "accelerator",
    title: "Modules",
    message: "Click the Welcome module to open it from the list below.",
    targetCardId: "accelerator",
    targetLabel: "First module",
    revealedCardIds: ["accelerator"],
    continueMode: "action",
    calloutTarget: "accelerator-first-module",
    calloutInstruction:
      "Click the Welcome module here to continue.",
  },
  {
    id: "accelerator-close-module",
    sceneId: "accelerator-module",
    title: "Module preview",
    message:
      "This is what an accelerator module looks like inside the workspace. Use Continue below, or the guide Next button, when you're ready to move on.",
    targetCardId: "accelerator",
    targetLabel: "Module preview",
    revealedCardIds: ["accelerator"],
    continueMode: "next",
  },
  {
    id: "calendar",
    sceneId: "calendar",
    title: "Calendar",
    message:
      "Add recurring board meetings, annual meetings, deadlines, and operating rhythm here. This is where reminders, accountability, and the shared tempo of the organization start to take shape.",
    targetCardId: "calendar",
    targetLabel: "Calendar",
    revealedCardIds: ["organization-overview"],
    continueMode: "shortcut",
    calloutTarget: "shortcut-button",
    calloutInstruction: "Click to open the Calendar tool and continue.",
  },
  {
    id: "programs",
    sceneId: "programs",
    title: "Programs turn strategy into fundable work",
    message:
      "Build program briefs, budgets, and fundraising targets here. Program details feed the rest of the system so plans, asks, and updates stay aligned.",
    targetCardId: "programs",
    targetLabel: "Programs",
    revealedCardIds: ["organization-overview"],
    continueMode: "shortcut",
    calloutTarget: "shortcut-button",
    calloutInstruction: "Click to open the Programs tool and continue.",
  },
  {
    id: "roadmap",
    sceneId: "roadmap",
    title: "Roadmap",
    message:
      "Use the roadmap to keep fundraising, board strategy, and execution priorities sequenced in one operating view.",
    targetCardId: "roadmap",
    targetLabel: "Roadmap",
    revealedCardIds: ["organization-overview"],
    continueMode: "shortcut",
    calloutTarget: "shortcut-button",
    calloutInstruction: "Click to open the Roadmap tool and continue.",
  },
  {
    id: "collaboration",
    sceneId: "overview",
    title: "Team Access",
    message:
      "Invite teammates and board members so this becomes a shared working space, not a board only one person updates.",
    targetCardId: null,
    targetLabel: "Team Access",
    revealedCardIds: ["organization-overview"],
    continueMode: "next",
    calloutTarget: "team-access",
    calloutInstruction:
      "Use Team Access to invite members and manage who can work in this workspace.",
  },
]

export const WORKSPACE_CANVAS_TUTORIAL_STEPS: WorkspaceCanvasTutorialStep[] =
  WORKSPACE_MAP_FEATURE_ENABLED
    ? WORKSPACE_CANVAS_TUTORIAL_ALL_STEPS
    : WORKSPACE_CANVAS_TUTORIAL_ALL_STEPS.filter(
        (step) => step.id !== "map-button" && step.id !== "map-card",
      )

export function resolveWorkspaceCanvasTutorialStepCount() {
  return WORKSPACE_CANVAS_TUTORIAL_STEPS.length
}

export function clampWorkspaceCanvasTutorialStepIndex(value: number) {
  const maxIndex = WORKSPACE_CANVAS_TUTORIAL_STEPS.length - 1
  if (!Number.isFinite(value)) return 0
  return Math.min(Math.max(Math.trunc(value), 0), maxIndex)
}

export function resolveWorkspaceCanvasTutorialStep(stepIndex: number) {
  return (
    WORKSPACE_CANVAS_TUTORIAL_STEPS[
      clampWorkspaceCanvasTutorialStepIndex(stepIndex)
    ] ?? WORKSPACE_CANVAS_TUTORIAL_STEPS[0]
  )
}

export function resolveWorkspaceCanvasTutorialProgressPercent(
  stepIndex: number,
  stepCount: number,
) {
  const safeStepCount = Math.max(Math.trunc(stepCount), 1)
  const currentStep = Math.min(
    Math.max(Math.trunc(stepIndex) + 1, 1),
    safeStepCount,
  )

  return Math.round((currentStep / safeStepCount) * 100)
}

export const WORKSPACE_CANVAS_TUTORIAL_MANAGED_CARD_IDS = [
  "organization-overview",
  ...(WORKSPACE_MAP_FEATURE_ENABLED
    ? (["atlas"] as const satisfies readonly WorkspaceCanvasTutorialCardId[])
    : []),
  "accelerator",
  "calendar",
  "programs",
  "roadmap",
  "economic-engine",
  "communications",
] as const satisfies readonly WorkspaceCanvasTutorialCardId[]

function resolveTutorialStepIdSet(stepIds: WorkspaceCanvasTutorialStepId[] = []) {
  return new Set<WorkspaceCanvasTutorialStepId>(stepIds)
}

function resolveWorkspaceCanvasTutorialStepOrder(stepId: WorkspaceCanvasTutorialStepId) {
  return WORKSPACE_CANVAS_TUTORIAL_STEPS.findIndex((step) => step.id === stepId)
}

function isTutorialShortcutStep(step: WorkspaceCanvasTutorialStep) {
  return step.continueMode === "shortcut" && step.targetCardId !== null
}

export function resolveWorkspaceCanvasTutorialTrimmedStepIds(
  stepIndex: number,
  stepIds: WorkspaceCanvasTutorialStepId[] = [],
) {
  const clampedStepIndex = clampWorkspaceCanvasTutorialStepIndex(stepIndex)
  return stepIds.filter((stepId) => {
    const stepOrder = resolveWorkspaceCanvasTutorialStepOrder(stepId)
    return stepOrder >= 0 && stepOrder <= clampedStepIndex
  })
}

export function isWorkspaceCanvasTutorialStepOpened(
  stepIndex: number,
  openedStepIds: WorkspaceCanvasTutorialStepId[] = [],
) {
  const step = resolveWorkspaceCanvasTutorialStep(stepIndex)
  return resolveTutorialStepIdSet(
    resolveWorkspaceCanvasTutorialTrimmedStepIds(stepIndex, openedStepIds),
  ).has(step.id)
}

export function isWorkspaceCanvasTutorialStepAcknowledged(
  stepIndex: number,
  acknowledgedStepIds: WorkspaceCanvasTutorialStepId[] = [],
) {
  const step = resolveWorkspaceCanvasTutorialStep(stepIndex)
  return resolveTutorialStepIdSet(acknowledgedStepIds).has(step.id)
}

export function resolveWorkspaceCanvasTutorialContinueMode(
  stepIndex: number,
  openedStepIds: WorkspaceCanvasTutorialStepId[] = [],
) {
  const step = resolveWorkspaceCanvasTutorialStep(stepIndex)
  if (step.continueMode === "shortcut" || step.continueMode === "action") {
    return isWorkspaceCanvasTutorialStepOpened(stepIndex, openedStepIds)
      ? "next"
      : step.continueMode
  }
  return step.continueMode ?? "next"
}

export function resolveWorkspaceCanvasTutorialVisibleCardIds(
  stepIndex: number,
  openedStepIds: WorkspaceCanvasTutorialStepId[] = [],
) {
  const clampedStepIndex = clampWorkspaceCanvasTutorialStepIndex(stepIndex)
  const step = resolveWorkspaceCanvasTutorialStep(stepIndex)
  const openedCurrentStep = isWorkspaceCanvasTutorialStepOpened(
    clampedStepIndex,
    openedStepIds,
  )
  if (isTutorialShortcutStep(step) && openedCurrentStep && step.targetCardId) {
    return [step.targetCardId]
  }

  return [...step.revealedCardIds]
}

export function resolveWorkspaceCanvasTutorialActiveVisibleCardIds(
  stepIndex: number,
  openedStepIds: WorkspaceCanvasTutorialStepId[] = [],
) {
  return resolveWorkspaceCanvasTutorialVisibleCardIds(stepIndex, openedStepIds)
}

export function resolveWorkspaceCanvasTutorialPromptTargetCardId(
  stepIndex: number,
  openedStepIds: WorkspaceCanvasTutorialStepId[] = [],
) {
  const callout = resolveWorkspaceCanvasTutorialCallout(stepIndex, openedStepIds)
  if (!callout || callout.kind !== "shortcut-button") {
    return null
  }
  return callout.cardId
}

export function resolveWorkspaceCanvasTutorialSelectedCardId(
  stepIndex: number,
  openedStepIds: WorkspaceCanvasTutorialStepId[] = [],
) {
  if (resolveWorkspaceCanvasTutorialContinueMode(stepIndex, openedStepIds) === "shortcut") {
    return null
  }

  return resolveWorkspaceCanvasTutorialStep(stepIndex).targetCardId
}

export function resolveWorkspaceCanvasTutorialSceneFocusCardIds(
  stepIndex: number,
  openedStepIds: WorkspaceCanvasTutorialStepId[] = [],
) {
  const step = resolveWorkspaceCanvasTutorialStep(stepIndex)

  if (step.id === "welcome") {
    return []
  }

  const continueMode = resolveWorkspaceCanvasTutorialContinueMode(
    stepIndex,
    openedStepIds,
  )

  if (continueMode === "shortcut") {
    return ["organization-overview"] satisfies WorkspaceCanvasTutorialCardId[]
  }

  if (step.targetCardId && step.targetCardId !== "organization-overview") {
    return [step.targetCardId]
  }

  if (
    step.revealedCardIds.includes("organization-overview") ||
    step.calloutTarget === "team-access"
  ) {
    return ["organization-overview"] satisfies WorkspaceCanvasTutorialCardId[]
  }

  return step.revealedCardIds.slice(0, 1)
}

export function resolveWorkspaceCanvasTutorialShortcutInstruction(
  stepIndex: number,
  openedStepIds: WorkspaceCanvasTutorialStepId[] = [],
) {
  const callout = resolveWorkspaceCanvasTutorialCallout(stepIndex, openedStepIds)
  if (!callout || callout.kind !== "shortcut-button") {
    return null
  }
  return callout.instruction
}

export function resolveWorkspaceCanvasTutorialCallout(
  stepIndex: number,
  openedStepIds: WorkspaceCanvasTutorialStepId[] = [],
): WorkspaceCanvasTutorialCallout | null {
  const step = resolveWorkspaceCanvasTutorialStep(stepIndex)
  const label = step.targetLabel ?? step.title
  const instruction = step.calloutInstruction ?? null

  if (!instruction || !step.calloutTarget) {
    return null
  }

  if (step.calloutTarget === "team-access") {
    return {
      kind: "team-access",
      label,
      instruction,
    }
  }

  if (
    step.calloutTarget === "organization-map-button" &&
    resolveWorkspaceCanvasTutorialContinueMode(stepIndex, openedStepIds) ===
      "action"
  ) {
    return {
      kind: "organization-map-button",
      label,
      instruction,
    }
  }

  const continueMode = resolveWorkspaceCanvasTutorialContinueMode(
    stepIndex,
    openedStepIds,
  )

  if (
    step.calloutTarget === "shortcut-button" &&
    continueMode === "shortcut" &&
    step.targetCardId
  ) {
    return {
      kind: "shortcut-button",
      cardId: step.targetCardId,
      label,
      instruction,
    }
  }

  if (
    step.calloutTarget === "accelerator-first-module" &&
    continueMode === "action"
  ) {
    return {
      kind: "accelerator-first-module",
      label,
      instruction,
    }
  }

  if (
    step.calloutTarget === "accelerator-picker" ||
    step.calloutTarget === "accelerator-progress" ||
    (step.calloutTarget === "accelerator-close-module" &&
      continueMode === "action")
  ) {
    return {
      kind: step.calloutTarget,
      label,
      instruction,
    }
  }

  return null
}

export function resolveWorkspaceCanvasTutorialHighlightShortcutButtons(
  stepIndex: number,
) {
  return (
    resolveWorkspaceCanvasTutorialStep(stepIndex).highlightShortcutButtons ??
    false
  )
}

export function isWorkspaceCanvasTutorialFinalStep(stepIndex: number) {
  return (
    clampWorkspaceCanvasTutorialStepIndex(stepIndex) ===
    WORKSPACE_CANVAS_TUTORIAL_STEPS.length - 1
  )
}

// Backward-compatible alias for code still reading the old helper name.
export const isWorkspaceCanvasTutorialStepCompleted =
  isWorkspaceCanvasTutorialStepAcknowledged

export function buildWorkspaceCanvasTutorialCompletionHiddenCardIds() {
  const visibleOnRest: WorkspaceCanvasTutorialCardId[] = [
    ...WORKSPACE_REST_VISIBLE_CARD_IDS,
  ]
  const allCards: WorkspaceCanvasTutorialCardId[] = [
    "organization-overview",
    "programs",
    "roadmap",
    "accelerator",
    "brand-kit",
    "economic-engine",
    "calendar",
    "communications",
    "deck",
    "atlas",
  ]

  return allCards.filter((cardId) => !visibleOnRest.includes(cardId))
}
