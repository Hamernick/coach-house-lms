"use client"

import { resolveAcceleratorReadiness } from "@/lib/accelerator/readiness"

import type { WorkspaceBoardNodeData } from "./workspace-board-node-types"

export function resolveWorkspaceAcceleratorReadinessSummary({
  acceleratorState,
  programs,
  seed,
}: Pick<WorkspaceBoardNodeData, "acceleratorState" | "seed"> & {
  programs: Array<{ goal_cents: number | null }>
}) {
  const roadmapSections = seed.roadmapSections
  const moduleStatusById = new Map<
    string,
    { slug: string; completed: boolean; touched: boolean }
  >()

  for (const step of seed.acceleratorTimeline ?? []) {
    const slugCandidate = step.moduleSlug?.trim().toLowerCase()
    const slug =
      slugCandidate && slugCandidate.length > 0 ? slugCandidate : step.moduleId
    const existing = moduleStatusById.get(step.moduleId)
    const isCompleted =
      step.status === "completed" ||
      acceleratorState.completedStepIds.includes(step.id)
    const isTouched =
      isCompleted ||
      step.status === "in_progress" ||
      acceleratorState.activeStepId === step.id

    if (!existing) {
      moduleStatusById.set(step.moduleId, {
        slug,
        completed: isCompleted,
        touched: isTouched,
      })
      continue
    }

    moduleStatusById.set(step.moduleId, {
      slug: existing.slug,
      completed: existing.completed && isCompleted,
      touched: existing.touched || isTouched,
    })
  }

  return resolveAcceleratorReadiness({
    profile: seed.initialProfile,
    modules: Array.from(moduleStatusById.values()).map((module) => ({
      slug: module.slug,
      status: module.completed
        ? "completed"
        : module.touched
          ? "in_progress"
          : "not_started",
    })),
    roadmapSections,
    programs,
    peopleCount: seed.peopleCount,
  })
}
