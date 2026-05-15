import { describe, expect, it } from "vitest"

import {
  resolveAcceleratorHeaderDetails,
  resolveAcceleratorHeaderMeta,
} from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-node-card-accelerator-support"
import type {
  WorkspaceAcceleratorCardRuntimeActions,
  WorkspaceAcceleratorCardRuntimeSnapshot,
} from "@/features/workspace-accelerator-card"

describe("workspace board accelerator header support", () => {
  it("does not render module and step count badges in the card header", () => {
    const snapshot = {
      checklistModuleCount: 4,
      filteredStepCount: 12,
    } as WorkspaceAcceleratorCardRuntimeSnapshot

    expect(
      resolveAcceleratorHeaderDetails({
        acceleratorRuntimeSnapshot: snapshot,
      }),
    ).toBeUndefined()
  })

  it("does not render the class picker in the card header", () => {
    const snapshot = {
      lessonGroupOptions: [{ key: "formation", label: "Formation" }],
      selectedLessonGroupKey: "formation",
      isModuleViewerOpen: false,
    } as WorkspaceAcceleratorCardRuntimeSnapshot
    const actions = {
      selectLessonGroup: () => {},
    } as WorkspaceAcceleratorCardRuntimeActions

    expect(
      resolveAcceleratorHeaderMeta({
        acceleratorRuntimeActions: actions,
        acceleratorRuntimeSnapshot: snapshot,
        acceleratorTutorialCallout: null,
        acceleratorTutorialInteractionPolicy: null,
      }),
    ).toBeUndefined()
  })
})
