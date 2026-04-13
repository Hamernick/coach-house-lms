import { describe, expect, it } from "vitest"

import { shouldSeedMemberWorkspaceStarterData } from "@/features/member-workspace/server/project-persistence"

describe("member workspace project persistence", () => {
  it("seeds starter data only for editable orgs with no projects and no prior starter-state record", () => {
    expect(
      shouldSeedMemberWorkspaceStarterData({
        canEdit: true,
        existingProjectCount: 0,
        hasStarterState: false,
      }),
    ).toBe(true)

    expect(
      shouldSeedMemberWorkspaceStarterData({
        canEdit: true,
        existingProjectCount: 0,
        hasStarterState: true,
      }),
    ).toBe(false)

    expect(
      shouldSeedMemberWorkspaceStarterData({
        canEdit: true,
        existingProjectCount: 3,
        hasStarterState: false,
      }),
    ).toBe(false)

    expect(
      shouldSeedMemberWorkspaceStarterData({
        canEdit: false,
        existingProjectCount: 0,
        hasStarterState: false,
      }),
    ).toBe(false)
  })
})
