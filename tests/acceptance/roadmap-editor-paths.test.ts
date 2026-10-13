import { describe, expect, it } from "vitest"

import { resolveRoadmapBasePath } from "@/components/roadmap/roadmap-editor/paths"

describe("resolveRoadmapBasePath", () => {
  it("uses the workspace roadmap as the canonical default", () => {
    expect(resolveRoadmapBasePath(undefined)).toBe("/workspace/roadmap")
    expect(resolveRoadmapBasePath(null)).toBe("/workspace/roadmap")
  })

  it("normalizes legacy roadmap routes to the workspace roadmap base", () => {
    expect(resolveRoadmapBasePath("/roadmap/origin-story")).toBe(
      "/workspace/roadmap",
    )
    expect(resolveRoadmapBasePath("/accelerator/roadmap/origin-story")).toBe(
      "/workspace/roadmap",
    )
    expect(resolveRoadmapBasePath("/my-organization/roadmap")).toBe(
      "/workspace/roadmap",
    )
  })

  it("keeps the workspace roadmap path stable", () => {
    expect(resolveRoadmapBasePath("/workspace/roadmap")).toBe(
      "/workspace/roadmap",
    )
    expect(resolveRoadmapBasePath("/workspace/roadmap/origin-story")).toBe(
      "/workspace/roadmap",
    )
  })
})
