import type {
  WorkspaceOntologyInput,
  WorkspaceOntologyNodeInput,
} from "@/features/workspace-ontology"
import { buildWorkspaceAcceleratorFullscreenHref } from "@/features/workspace-accelerator-card"
import {
  WORKSPACE_ACCELERATOR_PATH,
  getWorkspaceAcceleratorPaywallPath,
  getWorkspaceEditorPath,
} from "@/lib/workspace/routes"

import type {
  WorkspaceOrganizationEditorData,
  WorkspaceSeedData,
  WorkspaceTrackerState,
} from "../../workspace-board-types"
import { buildWorkspaceTasksOntologyNode } from "./workspace-canvas-ontology-input-tasks"

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim())
}

function resolveActivityHref({
  activity,
  seed,
}: {
  activity: WorkspaceSeedData["activityFeed"][number]
  seed: WorkspaceSeedData
}) {
  if (activity.source !== "accelerator") return activity.href ?? null
  if (!seed.hasAcceleratorAccess) {
    return getWorkspaceAcceleratorPaywallPath("workspace-ontology")
  }

  const moduleId =
    typeof activity.metadata?.moduleId === "string"
      ? activity.metadata.moduleId
      : null
  const moduleSteps =
    seed.acceleratorTimeline?.filter((step) => step.moduleId === moduleId) ?? []
  const destinationStep =
    moduleSteps.find((step) => step.status === "in_progress") ??
    moduleSteps.find((step) => {
      const status = String(step.status)
      return (
        status !== "completed" &&
        status !== "complete" &&
        step.stepKind !== "complete"
      )
    }) ??
    moduleSteps[0]

  return destinationStep
    ? buildWorkspaceAcceleratorFullscreenHref({
        stepId: destinationStep.id,
        moduleId: destinationStep.moduleId,
      })
    : WORKSPACE_ACCELERATOR_PATH
}

export function buildWorkspaceProgramsOntologyRoot({
  seed,
  editor,
  tracker,
}: {
  seed: WorkspaceSeedData
  editor: WorkspaceOrganizationEditorData
  tracker: WorkspaceTrackerState
}): WorkspaceOntologyInput["roots"][number] {
  const programNodes = editor.programs.map<WorkspaceOntologyNodeInput>(
    (program) => {
      const complete = hasText(program.title) && hasText(program.description)
      return {
        id: `ontology:program:${program.id}`,
        label: program.title?.trim() || "Untitled program",
        description:
          program.description?.trim() || "Add a clear program description.",
        category: "programs",
        kind: "Program",
        status: complete ? "complete" : "missing",
        statusLabel: complete
          ? program.status_label?.trim() || "Program defined"
          : "Needs definition",
        relationshipLabel: "delivers",
        href: getWorkspaceEditorPath({
          tab: "programs",
          programId: program.id,
        }),
        actionLabel:
          complete || !editor.canEdit ? "Open program" : "Complete program",
        keywords: [
          program.subtitle ?? "",
          program.location ?? "",
          ...(program.features ?? []),
        ],
      }
    }
  )
  const activityNodes = seed.activityFeed
    .filter((activity) => activity.source !== "calendar")
    .map<WorkspaceOntologyNodeInput>((activity) => ({
      id: `ontology:activity:${activity.id}`,
      label: activity.title,
      description:
        activity.description?.trim() || "Recent organization activity.",
      category: "activity",
      kind: "Activity",
      status: activity.status === "completed" ? "complete" : "in-progress",
      statusLabel: activity.status === "completed" ? "Completed" : "Scheduled",
      relationshipLabel: "produces",
      href: resolveActivityHref({ activity, seed }),
      actionLabel:
        activity.href || activity.source === "accelerator" ? "Open" : null,
      keywords: [activity.source, activity.type],
    }))

  return {
    id: "programs",
    label: "Activity",
    children: [
      {
        id: "ontology:programs:portfolio",
        label: "Program portfolio",
        description: "Services, initiatives, projects, and public offerings.",
        category: "programs",
        kind: "Portfolio",
        status: programNodes.length > 0 ? "in-progress" : "missing",
        statusLabel:
          programNodes.length > 0
            ? `${programNodes.length} programs`
            : "No programs yet",
        relationshipLabel: "contains",
        href: getWorkspaceEditorPath({ tab: "programs" }),
        actionLabel:
          programNodes.length > 0
            ? editor.canEdit
              ? "Manage programs"
              : "View programs"
            : editor.canEdit
              ? "Create program"
              : "View programs",
        children: programNodes,
      },
      {
        id: "ontology:programs:activity",
        label: "Operational activity",
        description: "Recent and scheduled work connected to the organization.",
        category: "activity",
        kind: "Activity stream",
        status: activityNodes.length > 0 ? "in-progress" : "missing",
        statusLabel:
          activityNodes.length > 0
            ? `${activityNodes.length} recent items`
            : "No activity yet",
        relationshipLabel: "generates",
        href: null,
        actionLabel: null,
        children: activityNodes,
      },
      buildWorkspaceTasksOntologyNode(seed, tracker),
    ],
  }
}
