import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

import {
  WORKSPACE_ACCELERATOR_PATH,
  WORKSPACE_PATH,
  WORKSPACE_ROADMAP_PATH,
  getWorkspaceAcceleratorPaywallPath,
  getWorkspaceEditorPath,
  getMemberWorkspacePaywallPath,
  getWorkspaceRoadmapSectionPath,
} from "@/lib/workspace/routes"

const ROOT = process.cwd()

describe("workspace routes", () => {
  it("exposes canonical workspace surface paths", () => {
    expect(WORKSPACE_PATH).toBe("/workspace")
    expect(WORKSPACE_ROADMAP_PATH).toBe("/workspace/roadmap")
    expect(WORKSPACE_ACCELERATOR_PATH).toBe("/workspace/accelerator")
  })

  it("builds editor and roadmap detail links", () => {
    expect(getWorkspaceEditorPath({ tab: "company" })).toBe(
      "/workspace?view=editor&tab=company",
    )
    expect(
      getWorkspaceEditorPath({
        tab: "programs",
        programId: "program-1",
      }),
    ).toBe("/workspace?view=editor&tab=programs&programId=program-1")
    expect(getWorkspaceRoadmapSectionPath("origin-story")).toBe(
      "/workspace/roadmap/origin-story",
    )
  })

  it("builds the accelerator paywall link with a source", () => {
    expect(getWorkspaceAcceleratorPaywallPath("guide")).toBe(
      "/workspace?paywall=organization&plan=organization&upgrade=accelerator-access&source=guide",
    )
  })

  it("builds the member workspace paywall link with a source", () => {
    expect(getMemberWorkspacePaywallPath("tasks")).toBe(
      "/workspace?paywall=organization&plan=organization&upgrade=member-workspace-access&source=tasks",
    )
  })

  it("keeps self-only free users from landing on the workspace canvas", () => {
    const source = readFileSync(
      join(ROOT, "src/app/(dashboard)/workspace/page.tsx"),
      "utf8",
    )

    expect(source).toContain("resolveDashboardLayoutState")
    expect(source).toContain("!state.showMemberWorkspace")
    expect(source).toContain("member_onboarding=1")
    expect(source).toContain("redirect(FIND_PATH)")
  })
})
