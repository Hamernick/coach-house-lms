import type {
  WorkspaceCanvasTutorialPresentationSurface,
  WorkspaceCanvasTutorialStepId,
} from "../types"

const WORKSPACE_TUTORIAL_OVERVIEW_COPY_RAIL_CLASS = "h-[7.375rem]"
const WORKSPACE_TUTORIAL_ACCELERATOR_COPY_RAIL_CLASS = "min-h-[9rem]"
const WORKSPACE_TUTORIAL_ACCELERATOR_COMPACT_COPY_RAIL_CLASS = "min-h-[4.25rem]"
const WORKSPACE_TUTORIAL_ACCELERATOR_MODULE_COPY_RAIL_CLASS = "h-auto"
const WORKSPACE_TUTORIAL_MAP_COPY_RAIL_CLASS = "min-h-[8rem]"
const WORKSPACE_TUTORIAL_TOOL_COPY_RAIL_CLASS = "min-h-[6.75rem]"
const WORKSPACE_TUTORIAL_OVERVIEW_BODY_LAYOUT_CLASS = "gap-5 px-5 py-5 sm:px-5"
const WORKSPACE_TUTORIAL_COMPACT_ACCELERATOR_BODY_LAYOUT_CLASS =
  "gap-5 px-5 py-5 sm:px-5"
const WORKSPACE_TUTORIAL_TOOL_BODY_LAYOUT_CLASS = "gap-4 px-5 py-4 sm:px-5"
const WORKSPACE_TUTORIAL_DEFAULT_BODY_LAYOUT_CLASS = "gap-4 px-5 py-5 sm:px-6"
const WORKSPACE_TUTORIAL_CLOSE_MODULE_BODY_LAYOUT_CLASS =
  "gap-5 px-5 py-5 sm:px-5"
const WORKSPACE_TUTORIAL_TOOL_CARD_IDS = new Set<string>([
  "calendar",
  "programs",
  "roadmap",
  "economic-engine",
  "communications",
] as const)
const WORKSPACE_TUTORIAL_COMPACT_ACCELERATOR_STEP_IDS =
  new Set<WorkspaceCanvasTutorialStepId>([
    "accelerator-picker",
    "accelerator-first-module",
  ])

export function resolveWorkspaceTutorialCopyRailClass({
  stepId,
  presentationSurface,
}: {
  stepId: WorkspaceCanvasTutorialStepId
  presentationSurface?: WorkspaceCanvasTutorialPresentationSurface | null
}) {
  const cardId = presentationSurface?.cardId ?? null
  if (!cardId) return null

  if (cardId === "organization-overview") {
    return WORKSPACE_TUTORIAL_OVERVIEW_COPY_RAIL_CLASS
  }

  if (cardId === "accelerator") {
    if (stepId === "accelerator-close-module") {
      return WORKSPACE_TUTORIAL_ACCELERATOR_MODULE_COPY_RAIL_CLASS
    }
    if (WORKSPACE_TUTORIAL_COMPACT_ACCELERATOR_STEP_IDS.has(stepId)) {
      return WORKSPACE_TUTORIAL_ACCELERATOR_COMPACT_COPY_RAIL_CLASS
    }
    return WORKSPACE_TUTORIAL_ACCELERATOR_COPY_RAIL_CLASS
  }

  if (cardId === "atlas") {
    return WORKSPACE_TUTORIAL_MAP_COPY_RAIL_CLASS
  }

  if (WORKSPACE_TUTORIAL_TOOL_CARD_IDS.has(cardId)) {
    return WORKSPACE_TUTORIAL_TOOL_COPY_RAIL_CLASS
  }

  return null
}

export function resolveWorkspaceTutorialBodyLayoutClass({
  stepId,
  presentationSurface,
}: {
  stepId: WorkspaceCanvasTutorialStepId
  presentationSurface?: WorkspaceCanvasTutorialPresentationSurface | null
}) {
  const cardId = presentationSurface?.cardId ?? null

  if (stepId === "accelerator-close-module") {
    return WORKSPACE_TUTORIAL_CLOSE_MODULE_BODY_LAYOUT_CLASS
  }

  if (cardId === "organization-overview") {
    return WORKSPACE_TUTORIAL_OVERVIEW_BODY_LAYOUT_CLASS
  }

  if (
    cardId === "accelerator" &&
    WORKSPACE_TUTORIAL_COMPACT_ACCELERATOR_STEP_IDS.has(stepId)
  ) {
    return WORKSPACE_TUTORIAL_COMPACT_ACCELERATOR_BODY_LAYOUT_CLASS
  }

  if (cardId && WORKSPACE_TUTORIAL_TOOL_CARD_IDS.has(cardId)) {
    return WORKSPACE_TUTORIAL_TOOL_BODY_LAYOUT_CLASS
  }

  return WORKSPACE_TUTORIAL_DEFAULT_BODY_LAYOUT_CLASS
}

export function resolveWorkspaceTutorialPresentationSlotClass({
  presentationSurface,
}: {
  presentationSurface?: WorkspaceCanvasTutorialPresentationSurface | null
}) {
  if (presentationSurface?.heightMode === "fill") {
    return "relative h-full min-h-0"
  }

  return "relative h-auto min-h-0 self-start"
}

export function resolveWorkspaceTutorialBodyGridClass({
  presentationSurface,
}: {
  presentationSurface?: WorkspaceCanvasTutorialPresentationSurface | null
}) {
  if (presentationSurface?.heightMode === "fill") {
    return "relative grid min-h-0 h-full grid-rows-[auto_minmax(0,1fr)]"
  }

  return "relative grid min-h-0 h-auto content-start grid-rows-[auto_auto]"
}
