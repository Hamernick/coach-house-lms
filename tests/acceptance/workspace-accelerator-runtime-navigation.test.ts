import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import { buildAcceleratorRuntimeSnapshot } from "@/features/workspace-accelerator-card/components/workspace-accelerator-card-panel-runtime"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("workspace accelerator runtime navigation", () => {
  it("uses module navigation availability in the shared runtime snapshot", () => {
    const snapshot = buildAcceleratorRuntimeSnapshot({
      controller: {
        currentIndex: 0,
        steps: [{ id: "intro:video" }],
        canGoPrevious: true,
        canGoNext: true,
        currentModuleStepIndex: 0,
        currentModuleSteps: [{ id: "intro:video" }, { id: "intro:notes" }],
        currentModuleCompletedCount: 0,
        isCurrentModuleCompleted: false,
        isCurrentStepCompleted: false,
      } as never,
      runtimeStep: null,
      selectedLessonGroupKey: "formation",
      selectedLessonGroupLabel: "Formation",
      lessonGroupOptions: [{ key: "formation", label: "Formation" }],
      firstVisibleChecklistStepId: "intro:video",
      isModuleViewerOpen: true,
      openModuleId: "intro",
      placeholderVideoUrl: null,
      readinessSummary: null,
      checklistModuleCount: 1,
      filteredStepCount: 2,
      filteredProgressPercent: 50,
      canGoPrevious: false,
      canGoNext: false,
    })

    expect(snapshot.canGoPrevious).toBe(false)
    expect(snapshot.canGoNext).toBe(false)
    expect(snapshot.currentModuleStepTotal).toBe(2)
    expect(snapshot.filteredProgressPercent).toBe(50)
  })

  it("keeps the board execution runtime from publishing global step navigation", () => {
    const source = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-node-tool-card-execution.tsx"
    )

    expect(source).toContain("resolveWorkspaceAcceleratorModuleStepNavigation")
    expect(source).toContain("goPrevious: goPreviousWithinModule")
    expect(source).toContain("goNext: goNextWithinModule")
    expect(source).toContain(
      "canGoPrevious: moduleStepNavigation.canGoPrevious"
    )
    expect(source).toContain("canGoNext: moduleStepNavigation.canGoNext")
    expect(source).not.toContain("goPrevious: controller.goPrevious")
    expect(source).not.toContain("goNext: controller.goNext")
    expect(source).not.toContain("canGoPrevious: controller.canGoPrevious")
    expect(source).not.toContain("canGoNext: controller.canGoNext")
  })
})
