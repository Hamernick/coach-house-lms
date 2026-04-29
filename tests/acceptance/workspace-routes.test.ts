import { describe, expect, it } from "vitest"

import {
  WORKSPACE_ACCELERATOR_PATH,
  WORKSPACE_PATH,
  WORKSPACE_ROADMAP_PATH,
  getWorkspaceAcceleratorPaywallPath,
  getWorkspaceEditorPath,
  getWorkspaceRoadmapSectionPath,
} from "@/lib/workspace/routes"

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
})
