import { describe, expect, it } from "vitest"
import {
  getMemberWorkspaceSectionLabel,
  isDonorAudience,
  MEMBER_WORKSPACE_SECTIONS,
} from "@/features/member-workspace"

describe("member-workspace feature contract", () => {
  it("exposes the canonical member workspace sections in order", () => {
    expect(MEMBER_WORKSPACE_SECTIONS).toEqual([
      "projects",
      "my-tasks",
      "people",
    ])
  })

  it("labels each section for the shell header", () => {
    expect(
      MEMBER_WORKSPACE_SECTIONS.map((section) =>
        getMemberWorkspaceSectionLabel(section),
      ),
    ).toEqual([
      "Projects",
      "My Tasks",
      "People",
    ])
  })

  it("treats the fund onboarding track as donor-only", () => {
    expect(isDonorAudience("fund")).toBe(true)
    expect(isDonorAudience("build")).toBe(false)
    expect(isDonorAudience("find")).toBe(false)
    expect(isDonorAudience("support")).toBe(false)
    expect(isDonorAudience(null)).toBe(false)
  })
})
