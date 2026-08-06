import type {
  WorkspaceOntologyInput,
  WorkspaceOntologyNodeInput,
  WorkspaceOntologyStatus,
} from "@/features/workspace-ontology"
import {
  buildWorkspaceAcceleratorFullscreenHref,
  buildWorkspaceAcceleratorLessonGroupOptions,
  isWorkspaceAcceleratorControllerStepVisible,
} from "@/features/workspace-accelerator-card"
import {
  getWorkspaceAcceleratorPaywallPath,
  WORKSPACE_ACCELERATOR_PATH,
} from "@/lib/workspace/routes"

import type { WorkspaceSeedData } from "../../workspace-board-types"

type WorkspaceAcceleratorSteps = NonNullable<
  WorkspaceSeedData["acceleratorTimeline"]
>

export function isWorkspaceAcceleratorOntologyStepVisible(
  step: WorkspaceAcceleratorSteps[number]
) {
  return step.published !== false && !step.moduleContext?.workspaceOnboarding
}

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
  const ontologyTimeline = (seed.acceleratorTimeline ?? []).filter(
    isWorkspaceAcceleratorOntologyStepVisible
  )
  const modules = new Map<string, WorkspaceAcceleratorSteps>()
  for (const step of ontologyTimeline) {
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
      const destinationSteps = steps.filter(
        isWorkspaceAcceleratorControllerStepVisible
      )
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
        destinationSteps.find((step) => step.status === "in_progress") ??
        destinationSteps.find(
          (step) => statusFromProgress(step.status) !== "complete"
        ) ??
        destinationSteps[0]
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
        href:
          seed.hasAcceleratorAccess && destinationStep
            ? buildWorkspaceAcceleratorFullscreenHref({
                stepId: destinationStep.id,
                moduleId: destinationStep.moduleId,
              })
            : seed.hasAcceleratorAccess
              ? WORKSPACE_ACCELERATOR_PATH
              : getWorkspaceAcceleratorPaywallPath("workspace-ontology"),
        actionLabel: status === "complete" ? "Review lesson" : "Open lesson",
        keywords: [...includedKinds, ...buildLessonKeywords(steps)],
      }
    })
  const lessonByModuleId = new Map(
    lessons.map((lesson) => [
      lesson.id.replace("ontology:accelerator:module:", ""),
      lesson,
    ])
  )
  const phases = buildWorkspaceAcceleratorLessonGroupOptions(
    ontologyTimeline
  ).flatMap<WorkspaceOntologyNodeInput>((group) => {
    const phaseLessons = group.moduleIds.flatMap((moduleId) => {
      const lesson = lessonByModuleId.get(moduleId)
      return lesson ? [lesson] : []
    })
    if (phaseLessons.length === 0) return []
    const completeCount = phaseLessons.filter(
      (lesson) => lesson.status === "complete"
    ).length
    const status: WorkspaceOntologyStatus = phaseLessons.some(
      (lesson) => lesson.status === "blocked"
    )
      ? "blocked"
      : completeCount === phaseLessons.length
        ? "complete"
        : phaseLessons.some(
              (lesson) =>
                lesson.status === "in-progress" || lesson.status === "complete"
            )
          ? "in-progress"
          : "missing"
    return [
      {
        id: `ontology:accelerator:phase:${group.key}`,
        label: group.label,
        description: `${phaseLessons.length} ${phaseLessons.length === 1 ? "lesson" : "lessons"} in this Accelerator phase.`,
        category: "accelerator",
        kind: "Accelerator phase",
        status,
        statusLabel: `${completeCount}/${phaseLessons.length} complete`,
        relationshipLabel: "includes",
        href: null,
        actionLabel: null,
        visibility: "source-card-only",
        children: phaseLessons,
      },
    ]
  })

  return {
    id: "accelerator",
    label: "Accelerator",
    children: phases,
  }
}
