import type {
  WorkspaceBoardAcceleratorState,
  WorkspaceCardId,
  WorkspaceJourneyGuideState,
  WorkspaceJourneyStage,
  WorkspaceSeedData,
} from "./workspace-board-types"

const ACCELERATOR_PAYWALL_HREF =
  "/workspace?paywall=organization&plan=organization&upgrade=accelerator-access&source=accelerator"

function resolveWorkspaceDocumentStageComplete(seed: WorkspaceSeedData) {
  return seed.journeyReadiness.workspaceDocumentCount > 0
}

function resolveAcceleratorCompletedStepCount(
  seed: WorkspaceSeedData,
  acceleratorState: WorkspaceBoardAcceleratorState,
) {
  return Math.max(
    seed.journeyReadiness.acceleratorCompletedStepCount,
    acceleratorState.completedStepIds.length,
  )
}

function resolveOperatingTargetCard(seed: WorkspaceSeedData): WorkspaceCardId {
  if (seed.programsCount <= 0) {
    return "programs"
  }
  const hasBrandSignals = Boolean(
    seed.initialProfile.brandPrimary ||
      (Array.isArray(seed.initialProfile.brandColors) &&
        seed.initialProfile.brandColors.length > 0) ||
      seed.initialProfile.boilerplate,
  )
  if (!hasBrandSignals) return "communications"
  if (seed.fundingGoalCents <= 0) {
    return "economic-engine"
  }
  if (!seed.calendar.nextEvent && seed.calendar.upcomingEvents.length === 0) {
    return "calendar"
  }
  return "communications"
}

export function resolveWorkspaceJourneyStage({
  seed,
  acceleratorState,
  acceleratorStepNodeVisible,
}: {
  seed: WorkspaceSeedData
  acceleratorState: WorkspaceBoardAcceleratorState
  acceleratorStepNodeVisible: boolean
}): WorkspaceJourneyStage {
  if (
    !seed.journeyReadiness.organizationProfileComplete ||
    seed.journeyReadiness.teammateCount < 1
  ) {
    return "foundation"
  }
  if (!resolveWorkspaceDocumentStageComplete(seed)) {
    return "materials"
  }

  const completedStepCount = resolveAcceleratorCompletedStepCount(
    seed,
    acceleratorState,
  )
  const acceleratorStarted =
    seed.journeyReadiness.acceleratorStarted ||
    Boolean(acceleratorState.activeStepId) ||
    completedStepCount > 0 ||
    acceleratorStepNodeVisible

  if (!acceleratorStarted || completedStepCount < 1) {
    return "accelerator-entry"
  }

  return "operating"
}

export function resolveWorkspaceJourneyGuideState({
  seed,
  acceleratorState,
  acceleratorStepNodeVisible,
}: {
  seed: WorkspaceSeedData
  acceleratorState: WorkspaceBoardAcceleratorState
  acceleratorStepNodeVisible: boolean
}): WorkspaceJourneyGuideState {
  const stage = resolveWorkspaceJourneyStage({
    seed,
    acceleratorState,
    acceleratorStepNodeVisible,
  })

  if (stage === "foundation") {
    return {
      stage,
      title: "Build the organization foundation",
      description:
        "Give the workspace enough context to guide your next moves with confidence.",
      checklist: [
        "Complete the organization profile",
        "Add at least one teammate or board member",
        "Clarify the mission, need, or formation status",
      ],
      tone: "guide",
      targetCardId: "organization-overview",
      primaryAction: {
        kind: "focus-card",
        label: "Focus organization",
        cardId: "organization-overview",
      },
      accentLabel: "Step 1",
    }
  }

  if (stage === "materials") {
    return {
      stage,
      title: "Drop the source materials into Documents",
      description:
        "Use the vault as the working center so your accelerator steps reference real files and policies.",
      checklist: [
        "Upload the first operating document",
        "Open the vault search or viewer once",
        "Keep your source materials inside the workspace",
      ],
      tone: "guide",
      targetCardId: "vault",
      primaryAction: {
        kind: "focus-card",
        label: "Focus documents",
        cardId: "vault",
      },
      accentLabel: "Step 2",
    }
  }

  if (stage === "accelerator-entry") {
    return {
      stage,
      title: "Start the accelerator from inside the workspace",
      description:
        "Open the live step node and complete the first action so the rest of the operating system can guide you from real progress.",
      checklist: [
        "Open the live accelerator step",
        "Review the resources or assignment",
        "Complete the first accelerator action",
      ],
      tone: "guide",
      targetCardId: "accelerator",
      primaryAction: seed.hasAcceleratorAccess
        ? {
            kind: "open-step-node",
            label: acceleratorStepNodeVisible
              ? "Continue live step"
              : "Open live step",
          }
        : {
            kind: "open-accelerator",
            label: "Unlock accelerator",
            href: ACCELERATOR_PAYWALL_HREF,
          },
      accentLabel: "Step 3",
    }
  }

  const targetCardId = resolveOperatingTargetCard(seed)
  const targetLabelByCardId: Record<WorkspaceCardId, string> = {
    "organization-overview": "organization",
    programs: "programs",
    accelerator: "accelerator",
    "brand-kit": "brand kit",
    "economic-engine": "fundraising",
    calendar: "calendar",
    communications: "communications",
    deck: "deck",
    vault: "documents",
    atlas: "atlas",
  }

  return {
    stage,
    title: "Operate from the workspace",
    description:
      "You have enough context and progress. Keep moving by tightening the next operational card instead of jumping out of the board.",
    checklist: [
      "Advance the next accelerator step",
      `Tighten the ${targetLabelByCardId[targetCardId]} card`,
      "Return to the Dagre Tree when you want the board view",
    ],
    tone: "operating",
    targetCardId,
    primaryAction: {
      kind: "focus-card",
      label: `Focus ${targetLabelByCardId[targetCardId]}`,
      cardId: targetCardId,
    },
    accentLabel: "Operating",
  }
}
