import type {
  WorkspaceCanvasTutorialCallout,
  WorkspaceCanvasTutorialCardId,
  WorkspaceCanvasTutorialStepId,
  WorkspaceCanvasTutorialStep,
} from "../types"

export const WORKSPACE_CANVAS_TUTORIAL_STEPS: WorkspaceCanvasTutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome to Workspace",
    message:
      "This canvas keeps your organization, documents, programs, accelerator, calendar, fundraising, and communications in one place.",
    targetCardId: null,
    targetLabel: "Workspace",
    revealedCardIds: [],
    continueMode: "next",
  },
  {
    id: "organization",
    title: "Build your Organization",
    message:
      "Update your public and private organization details, connect data to your organization like programs, core documents, fundraising efforts, teams, and communications.",
    targetCardId: "organization-overview",
    targetLabel: "Organization",
    revealedCardIds: ["organization-overview"],
    continueMode: "next",
  },
  {
    id: "tool-buttons",
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
    title: "Accelerator",
    message:
      "The accelerator is a series of guides to help you move fast and get to whats important. It's a series of lessons built from 30+ years building sustainable nfp's, having raised $25m+.",
    targetCardId: "accelerator",
    targetLabel: "Accelerator",
    revealedCardIds: ["organization-overview"],
    continueMode: "shortcut",
    calloutTarget: "shortcut-button",
    calloutInstruction: "Click to open the Accelerator tool and continue.",
  },
  {
    id: "accelerator-nav",
    title: "Accelerator Navigation",
    message:
      "Use the header arrows to move between accelerator lessons without leaving the workspace.",
    targetCardId: "accelerator",
    targetLabel: "Accelerator navigation",
    revealedCardIds: ["organization-overview", "accelerator"],
    continueMode: "next",
    calloutTarget: "accelerator-nav",
    calloutInstruction:
      "Use these arrows to move backward and forward through the accelerator.",
  },
  {
    id: "accelerator-picker",
    title: "Lesson Groups",
    message:
      "Use the lesson picker to jump between lesson groups and narrow the checklist to the part of the accelerator you want to work on.",
    targetCardId: "accelerator",
    targetLabel: "Lesson picker",
    revealedCardIds: ["organization-overview", "accelerator"],
    continueMode: "next",
    calloutTarget: "accelerator-picker",
    calloutInstruction:
      "Switch lesson groups here to move between lessons in the accelerator.",
  },
  {
    id: "accelerator-progress",
    title: "Progress",
    message:
      "This strip shows your accelerator progress and the Fundable and Verified milestones you are working toward.",
    targetCardId: "accelerator",
    targetLabel: "Accelerator progress",
    revealedCardIds: ["organization-overview", "accelerator"],
    continueMode: "next",
    calloutTarget: "accelerator-progress",
    calloutInstruction:
      "Hover the milestone markers to see what it takes to reach Fundable and Verified.",
  },
  {
    id: "accelerator-first-module",
    title: "Open Your First Module",
    message:
      "Click the first visible module step in the checklist to open it and continue the walkthrough.",
    targetCardId: "accelerator",
    targetLabel: "First module",
    revealedCardIds: ["organization-overview", "accelerator"],
    continueMode: "action",
    calloutTarget: "accelerator-first-module",
    calloutInstruction:
      "Click the first module step here to continue.",
  },
  {
    id: "accelerator-close-module",
    title: "Close the Module",
    message:
      "Use the close button in the module header to dismiss this lesson and return to the accelerator card.",
    targetCardId: "accelerator",
    targetLabel: "Close module",
    revealedCardIds: ["organization-overview", "accelerator"],
    continueMode: "action",
    calloutTarget: "accelerator-close-module",
    calloutInstruction:
      "Click here to close this module and return to the accelerator.",
  },
  {
    id: "calendar",
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
    id: "documents",
    title: "Documents",
    message:
      "Keep policies, decks, budgets, and source files in one place so the rest of the workspace stays grounded in real materials.",
    targetCardId: "vault",
    targetLabel: "Documents",
    revealedCardIds: ["organization-overview"],
    continueMode: "shortcut",
    calloutTarget: "shortcut-button",
    calloutInstruction: "Click to open the Documents tool and continue.",
  },
  {
    id: "fundraising",
    title: "Fundraising",
    message:
      "Connect funding goals to the programs and progress you are actually building so your asks stay tied to the work.",
    targetCardId: "economic-engine",
    targetLabel: "Fundraising",
    revealedCardIds: ["organization-overview"],
    continueMode: "shortcut",
    calloutTarget: "shortcut-button",
    calloutInstruction: "Click to open the Fundraising tool and continue.",
  },
  {
    id: "communications",
    title: "Communications",
    message:
      "Turn milestones into updates, shape your public story, and keep supporters aligned with the work in motion.",
    targetCardId: "communications",
    targetLabel: "Communications",
    revealedCardIds: ["organization-overview"],
    continueMode: "shortcut",
    calloutTarget: "shortcut-button",
    calloutInstruction: "Click to open the Communications tool and continue.",
  },
  {
    id: "collaboration",
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
  {
    id: "finish",
    title: "Next Steps",
    message:
      "Start with Organization and Documents, then move into Programs and the Accelerator to keep each part of the work connected.",
    targetCardId: "organization-overview",
    targetLabel: "Organization",
    revealedCardIds: ["organization-overview"],
    continueMode: "next",
  },
]

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

export const WORKSPACE_CANVAS_TUTORIAL_MANAGED_CARD_IDS = [
  "organization-overview",
  "accelerator",
  "calendar",
  "programs",
  "vault",
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
  const visibleCardIds = new Set<WorkspaceCanvasTutorialCardId>(step.revealedCardIds)
  const openedStepIdSet = resolveTutorialStepIdSet(
    resolveWorkspaceCanvasTutorialTrimmedStepIds(clampedStepIndex, openedStepIds),
  )

  for (let index = 0; index <= clampedStepIndex; index += 1) {
    const tutorialStep = WORKSPACE_CANVAS_TUTORIAL_STEPS[index]
    if (!tutorialStep || !isTutorialShortcutStep(tutorialStep)) {
      continue
    }
    if (!openedStepIdSet.has(tutorialStep.id)) {
      continue
    }
    const { targetCardId } = tutorialStep
    if (!targetCardId) {
      continue
    }
    visibleCardIds.add(targetCardId)
  }

  return Array.from(visibleCardIds)
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
    step.calloutTarget === "accelerator-nav" ||
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
    "organization-overview",
    "accelerator",
  ]
  const allCards: WorkspaceCanvasTutorialCardId[] = [
    "organization-overview",
    "programs",
    "vault",
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
