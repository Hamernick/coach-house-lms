import type { StepperRailStep } from "@/components/ui/stepper-rail"

import type { AssignmentSection } from "./assignment-sections"
import type { ModuleAssignmentField, ModuleResource } from "../types"
import type { ModuleStepperStep, ModuleStepperStepStatus } from "./module-stepper-types"

const CACHEABLE_STEP_TYPES = new Set<ModuleStepperStep["type"]>([
  "video",
  "resources",
  "notes",
  "complete",
])

export function buildModuleStepperSteps({
  embedUrl,
  videoUrl,
  fallbackUrl,
  lessonNotesContent,
  resources,
  hasDeck,
  assignmentFields,
  tabSections,
}: {
  embedUrl: string | null
  videoUrl: string | null
  fallbackUrl: string | null
  lessonNotesContent?: string | null
  resources?: ModuleResource[]
  hasDeck: boolean
  assignmentFields: ModuleAssignmentField[]
  tabSections: AssignmentSection[]
}): ModuleStepperStep[] {
  const list: ModuleStepperStep[] = []
  let assignmentIndex = 0

  if (embedUrl || videoUrl || fallbackUrl) {
    list.push({ id: "video", label: "Class video", type: "video" })
  }
  if (lessonNotesContent) {
    list.push({ id: "notes", label: "Class notes", type: "notes" })
  }
  const hasAssignmentOverview = tabSections.some(
    (section) => section.id === "assignment-overview",
  )
  if (!hasAssignmentOverview && ((resources && resources.length > 0) || hasDeck)) {
    list.push({ id: "resources", label: "Resources", type: "resources" })
  }
  if (assignmentFields.length > 0) {
    tabSections.forEach((section, index) => {
      const hasVisibleInfo =
        section.fields.length === 0 &&
        Boolean(section.title?.trim() || section.description?.trim())
      if (section.fields.length === 0 && !hasVisibleInfo) return
      const isRoadmap = section.fields.some((field) => Boolean(field.roadmapSectionId))
      assignmentIndex += 1
      list.push({
        id: `assignment-${section.id}`,
        label: section.title ?? `Step ${index + 1}`,
        type: "assignment",
        sectionId: section.id,
        description: section.description,
        roadmap: isRoadmap,
        assignmentIndex,
      })
    })
  }

  list.push({ id: "complete", label: "Congratulations", type: "complete" })

  return list.map((step, index) => ({ ...step, stepIndex: index + 1 }))
}

export function buildModuleStepperRailSteps({
  steps,
  activeIndex,
}: {
  steps: ModuleStepperStep[]
  activeIndex: number
}): StepperRailStep[] {
  return steps.map((step, index) => {
    const isLast = index === steps.length - 1
    const status: ModuleStepperStepStatus =
      index < activeIndex || (isLast && index === activeIndex)
        ? "complete"
        : index === activeIndex
          ? "in_progress"
          : "not_started"
    const isRoadmapStep = step.type === "assignment" && step.roadmap
    return {
      id: step.id,
      label: step.label,
      status,
      roadmap: isRoadmapStep,
      stepIndex: step.stepIndex,
    }
  })
}

export function resolveModuleCompletionCount({
  activeStepType,
  isCurrentModuleCompleted,
  moduleCount,
  completedModuleCount,
}: {
  activeStepType: ModuleStepperStep["type"] | undefined
  isCurrentModuleCompleted: boolean
  moduleCount: number
  completedModuleCount: number
}) {
  const completedFromServer = Math.max(0, Math.min(moduleCount, completedModuleCount))
  if (activeStepType !== "complete" || isCurrentModuleCompleted) {
    return completedFromServer
  }
  return Math.min(moduleCount, completedFromServer + 1)
}

export function isCacheableModuleStepperStep(type: ModuleStepperStep["type"]) {
  return CACHEABLE_STEP_TYPES.has(type)
}
