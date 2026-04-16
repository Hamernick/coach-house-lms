import { beforeEach, describe, expect, it, vi } from "vitest"

import { captureRedirect, resetTestMocks } from "./test-utils"

describe("workspace route aliases", () => {
  beforeEach(() => {
    resetTestMocks()
    vi.resetModules()
    vi.clearAllMocks()
  })

  it("builds the canonical workspace destination with no query string when params are absent", async () => {
    const { buildWorkspaceAliasRedirectDestination } = await import(
      "@/app/(dashboard)/_lib/workspace-route-aliases"
    )

    expect(buildWorkspaceAliasRedirectDestination(undefined)).toBe("/workspace")
  })

  it("preserves scalar and repeated query params when alias routes forward to workspace", async () => {
    const { buildWorkspaceAliasRedirectDestination } = await import(
      "@/app/(dashboard)/_lib/workspace-route-aliases"
    )

    expect(
      buildWorkspaceAliasRedirectDestination({
        view: "editor",
        tab: "programs",
        programId: ["alpha", "beta"],
        ignored: [null, 42, "gamma"] as unknown as string[],
      }),
    ).toBe("/workspace?view=editor&tab=programs&programId=alpha&programId=beta&ignored=gamma")
  })

  it("redirects /my-organization to /workspace and preserves query params", async () => {
    const { default: Page } = await import("@/app/(dashboard)/my-organization/page")

    const destination = await captureRedirect(() =>
      Page({
        searchParams: Promise.resolve({
          view: "editor",
          tab: "people",
        }),
      }),
    )

    expect(destination).toBe("/workspace?view=editor&tab=people")
  })

  it("redirects /organization to /workspace and preserves repeated query params", async () => {
    const { default: Page } = await import("@/app/(dashboard)/organization/page")

    const destination = await captureRedirect(() =>
      Page({
        searchParams: Promise.resolve({
          programId: ["one", "two"],
        }),
      }),
    )

    expect(destination).toBe("/workspace?programId=one&programId=two")
  })

  it("redirects /organization/workspace to /workspace and preserves query params", async () => {
    const { default: Page } = await import("@/app/(dashboard)/organization/workspace/page")

    const destination = await captureRedirect(() =>
      Page({
        searchParams: Promise.resolve({
          source: "legacy_alias",
          onboarding_flow: "1",
        }),
      }),
    )

    expect(destination).toBe("/workspace?source=legacy_alias&onboarding_flow=1")
  })

  it("redirects /my-tasks to /tasks and preserves query params", async () => {
    const { default: Page } = await import("@/app/(dashboard)/my-tasks/page")

    const destination = await captureRedirect(() =>
      Page({
        searchParams: Promise.resolve({
          view: "week",
          assignee: ["me", "team"],
        }),
      }),
    )

    expect(destination).toBe("/tasks?view=week&assignee=me&assignee=team")
  })
})
