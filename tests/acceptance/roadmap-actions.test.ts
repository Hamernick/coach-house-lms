import { beforeEach, describe, expect, it } from "vitest"

import { getRoadmapWorkspaceRevalidationPaths } from "@/lib/roadmap"

import { revalidatePathMock, resetTestMocks } from "./test-utils"

describe("roadmap actions", () => {
  beforeEach(() => {
    resetTestMocks()
  })

  it("revalidates the workspace canvas when a roadmap section changes", () => {
    const paths = getRoadmapWorkspaceRevalidationPaths({
      publicSlug: "coach-house",
      sectionSlug: "origin-story",
    })

    expect(paths).toEqual([
      "/workspace",
      "/my-organization",
      "/workspace/roadmap",
      "/workspace/roadmap/origin-story",
      "/coach-house/roadmap",
    ])
    expect(revalidatePathMock).not.toHaveBeenCalled()
  })

  it("can skip public roadmap revalidation for private-only updates", () => {
    const paths = getRoadmapWorkspaceRevalidationPaths({
      publicSlug: "coach-house",
      includePublicRoadmap: false,
    })

    expect(paths).toEqual([
      "/workspace",
      "/my-organization",
      "/workspace/roadmap",
    ])
    expect(revalidatePathMock).not.toHaveBeenCalled()
  })
})
