import type { FormationStatus } from "@/components/organization/org-profile-card/types"
import { isCoreFormationModule } from "@/lib/accelerator/module-order"
import type {
  AcceleratorProgressSummary,
  ModuleCardStatus,
} from "@/lib/accelerator/progress"

function buildAcceleratorProgressTotals(groups: AcceleratorProgressSummary["groups"]) {
  let totalModules = 0
  let completedModules = 0
  let inProgressModules = 0

  for (const group of groups) {
    for (const moduleItem of group.modules) {
      totalModules += 1
      if (moduleItem.status === "completed") completedModules += 1
      if (moduleItem.status === "in_progress") inProgressModules += 1
    }
  }

  return {
    totalModules,
    completedModules,
    inProgressModules,
    percent:
      totalModules > 0
        ? Math.round((completedModules / totalModules) * 100)
        : 0,
  }
}

function resolveFormationOverrideStatus({
  formationStatus,
  moduleStatus,
  isFormationModule,
}: {
  formationStatus: FormationStatus | null | undefined
  moduleStatus: ModuleCardStatus
  isFormationModule: boolean
}): ModuleCardStatus {
  if (formationStatus !== "approved") return moduleStatus
  if (!isFormationModule) return moduleStatus
  return "completed"
}

export function applyFormationStatusAcceleratorProgressOverrides(
  summary: AcceleratorProgressSummary,
  formationStatus: FormationStatus | null | undefined,
): AcceleratorProgressSummary {
  const groups = summary.groups.map((group) => {
    let groupChanged = false
    const modules = group.modules.map((module) => {
      const nextStatus = resolveFormationOverrideStatus({
        formationStatus,
        moduleStatus: module.status,
        isFormationModule: isCoreFormationModule(module),
      })
      if (nextStatus === module.status) return module
      groupChanged = true
      return {
        ...module,
        status: nextStatus,
      }
    })

    if (!groupChanged) return group
    return {
      ...group,
      modules,
    }
  })

  const changed = groups.some((group, index) => group !== summary.groups[index])
  if (!changed) return summary

  return {
    ...summary,
    groups,
    ...buildAcceleratorProgressTotals(groups),
  }
}
