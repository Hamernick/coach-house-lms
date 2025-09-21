import type { ModuleRecord, ModuleProgressStatus } from "@/lib/modules"

export type ModuleState = {
  module: ModuleRecord
  completed: boolean
  locked: boolean
  status: ModuleProgressStatus
}

export function buildModuleStates(
  modules: ModuleRecord[],
  progressMap: Record<string, ModuleProgressStatus>
): ModuleState[] {
  const ordered = [...modules].sort((a, b) => a.idx - b.idx)
  const states: ModuleState[] = []
  let allPreviousCompleted = true

  for (const record of ordered) {
    const status = progressMap[record.id] ?? "not_started"
    const completed = status === "completed"
    const locked = !allPreviousCompleted

    states.push({
      module: record,
      completed,
      locked,
      status,
    })

    if (!completed) {
      allPreviousCompleted = false
    }
  }

  return states
}
