import { beforeEach, describe, expect, it, vi } from "vitest"

import { captureRedirect, redirectMock, resetTestMocks } from "./test-utils"

describe("onboarding gate", () => {
  beforeEach(() => {
    resetTestMocks()
    vi.resetModules()
  })

  it("redirects to my organization when onboarding already completed", async () => {
    const supabase = {
      from: () => ({
        select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: { full_name: null, headline: null } }) }) }),
      }),
    }

    vi.doMock("@/lib/auth", () => ({
      requireServerSession: async () => ({
        supabase,
        session: {
          user: {
            id: "u1",
            email: "u1@example.com",
            user_metadata: { onboarding_completed: true },
          },
        },
      }),
    }))

    // Re-import after mock
    const { default: Page } = await import("@/app/(dashboard)/onboarding/page")
    const destination = await captureRedirect(() => Page())
    expect(destination).toBe("/my-organization")
  })

  it("renders onboarding page when onboarding is not completed", async () => {
    const supabase = {
      from: () => ({
        select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: { full_name: "User", headline: null } }) }) }),
      }),
    }

    vi.doMock("@/lib/auth", () => ({
      requireServerSession: async () => ({
        supabase,
        session: {
          user: {
            id: "u2",
            email: "u2@example.com",
            user_metadata: { onboarding_completed: false },
          },
        },
      }),
    }))

    const { default: Page } = await import("@/app/(dashboard)/onboarding/page")
    const result = await Page()

    expect(result).toBeTruthy()
    expect(redirectMock).not.toHaveBeenCalled()
  })

  // Rendering path is covered in E2E; this suite focuses on gating redirect.
})
