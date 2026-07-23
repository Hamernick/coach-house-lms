import type {
  WorkspaceOntologyInput,
  WorkspaceOntologyNodeInput,
  WorkspaceOntologyStatus,
} from "@/features/workspace-ontology"
import { buildWorkspaceAcceleratorFullscreenHref } from "@/features/workspace-accelerator-card"
import { getWorkspaceAcceleratorPaywallPath } from "@/lib/workspace/routes"

import type { WorkspaceSeedData } from "../../workspace-board-types"

type WorkspaceAcceleratorSteps = NonNullable<
  WorkspaceSeedData["acceleratorTimeline"]
>

function statusFromProgress(
  status: "not_started" | "in_progress" | "complete" | "completed"
): WorkspaceOntologyStatus {
  if (status === "complete" || status === "completed") return "complete"
  if (status === "in_progress") return "in-progress"
  return "missing"
}

function statusLabel(status: WorkspaceOntologyStatus) {
  if (status === "complete") return "Complete"
  if (status === "in-progress") return "In progress"
  if (status === "blocked") return "Blocked"
  return "Missing information"
}

function buildLessonKeywords(steps: WorkspaceAcceleratorSteps) {
  const terms = steps.flatMap((step) => {
    const context = step.moduleContext
    return [
      step.groupTitle,
      step.moduleTitle,
      step.stepKind,
      step.stepTitle,
      step.stepDescription ?? "",
      ...(step.resources ?? []).map((resource) => resource.title),
      context?.classTitle ?? "",
      context?.lessonNotesContent ?? "",
      ...(context?.moduleResources ?? []).map((resource) => resource.label),
      ...(context?.assignmentFields ?? []).flatMap((field) => [
        field.label,
        field.description ?? "",
        field.placeholder ?? "",
        ...(field.options ?? []),
      ]),
    ]
  })

  return Array.from(new Set(terms.map((term) => term.trim()).filter(Boolean)))
}

export function buildWorkspaceAcceleratorOntologyRoot(
  seed: WorkspaceSeedData
): WorkspaceOntologyInput["roots"][number] {
  const modules = new Map<string, WorkspaceAcceleratorSteps>()
  for (const step of seed.acceleratorTimeline ?? []) {
    const existing = modules.get(step.moduleId) ?? []
    modules.set(step.moduleId, [...existing, step])
  }

  const lessons = [...modules.entries()]
    .sort(
      ([, leftSteps], [, rightSteps]) =>
        (leftSteps[0].moduleSequenceIndex ?? Number.MAX_SAFE_INTEGER) -
        (rightSteps[0].moduleSequenceIndex ?? Number.MAX_SAFE_INTEGER)
    )
    .map<WorkspaceOntologyNodeInput>(([moduleId, steps]) => {
      const firstStep = steps[0]
      const statuses = steps.map((step) => statusFromProgress(step.status))
      const status: WorkspaceOntologyStatus = !seed.hasAcceleratorAccess
        ? "blocked"
        : statuses.every((entry) => entry === "complete")
          ? "complete"
          : statuses.some(
                (entry) => entry === "in-progress" || entry === "complete"
              )
            ? "in-progress"
            : "missing"
      const destinationStep =
        steps.find((step) => step.status === "in_progress") ??
        steps.find(
          (step) =>
            statusFromProgress(step.status) !== "complete" &&
            step.stepKind !== "complete"
        ) ??
        steps.find((step) => step.stepKind === "lesson") ??
        firstStep
      const lessonDescription = steps
        .find((step) => step.stepKind === "lesson")
        ?.stepDescription?.trim()
      const includedKinds = Array.from(
        new Set(
          steps
            .map((step) => step.stepKind)
            .filter((stepKind) => stepKind !== "complete")
        )
      )

      return {
        id: `ontology:accelerator:module:${moduleId}`,
        label: firstStep.moduleTitle,
        description:
          lessonDescription ||
          `${firstStep.groupTitle} lesson${
            includedKinds.length > 0 ? ` with ${includedKinds.join(", ")}` : ""
          }.`,
        category: "accelerator",
        kind: "Accelerator lesson",
        status,
        statusLabel: seed.hasAcceleratorAccess
          ? statusLabel(status)
          : "Access required",
        relationshipLabel: "teaches",
        href: seed.hasAcceleratorAccess
          ? buildWorkspaceAcceleratorFullscreenHref({
              stepId: destinationStep.id,
              moduleId: destinationStep.moduleId,
            })
          : getWorkspaceAcceleratorPaywallPath("workspace-ontology"),
        actionLabel: status === "complete" ? "Review lesson" : "Open lesson",
        keywords: [...includedKinds, ...buildLessonKeywords(steps)],
      }
    })

  return {
    id: "accelerator",
    label: "Accelerator",
    children: lessons,
  }
}
