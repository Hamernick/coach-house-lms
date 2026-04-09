import { describe, expect, it } from "vitest"

import { resolveWorkspaceAcceleratorLessonGroupFilter } from "@/features/workspace-accelerator-card/components/workspace-accelerator-card-panel-lesson-groups-state"

const lessonGroupOptions = [
  {
    key: "formation",
    label: "Formation",
    moduleIds: ["formation-module"],
  },
  {
    key: "fundraising",
    label: "Fundraising",
    moduleIds: ["fundraising-module"],
  },
]

describe("workspace accelerator lesson group state", () => {
  it("defaults to the current lesson group when no prior filter exists", () => {
    expect(
      resolveWorkspaceAcceleratorLessonGroupFilter({
        lessonGroupOptions,
        currentLessonGroupKey: "formation",
        previousCurrentLessonGroupKey: "",
        previousLessonGroupFilter: "",
        pendingLessonGroupSelectionKey: null,
      }),
    ).toEqual({
      nextLessonGroupFilter: "formation",
      nextPendingLessonGroupSelectionKey: null,
    })
  })

  it("keeps a pending user selection until the controller catches up", () => {
    expect(
      resolveWorkspaceAcceleratorLessonGroupFilter({
        lessonGroupOptions,
        currentLessonGroupKey: "formation",
        previousCurrentLessonGroupKey: "formation",
        previousLessonGroupFilter: "fundraising",
        pendingLessonGroupSelectionKey: "fundraising",
      }),
    ).toEqual({
      nextLessonGroupFilter: "fundraising",
      nextPendingLessonGroupSelectionKey: "fundraising",
    })
  })

  it("clears the pending selection once the current step reaches that lesson group", () => {
    expect(
      resolveWorkspaceAcceleratorLessonGroupFilter({
        lessonGroupOptions,
        currentLessonGroupKey: "fundraising",
        previousCurrentLessonGroupKey: "formation",
        previousLessonGroupFilter: "fundraising",
        pendingLessonGroupSelectionKey: "fundraising",
      }),
    ).toEqual({
      nextLessonGroupFilter: "fundraising",
      nextPendingLessonGroupSelectionKey: null,
    })
  })

  it("follows an external current-step lesson-group change when there is no pending user selection", () => {
    expect(
      resolveWorkspaceAcceleratorLessonGroupFilter({
        lessonGroupOptions,
        currentLessonGroupKey: "fundraising",
        previousCurrentLessonGroupKey: "formation",
        previousLessonGroupFilter: "formation",
        pendingLessonGroupSelectionKey: null,
      }),
    ).toEqual({
      nextLessonGroupFilter: "fundraising",
      nextPendingLessonGroupSelectionKey: null,
    })
  })
})
