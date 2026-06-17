import "./test-utils"

import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  captureRedirect,
  createSupabaseServerClientServerMock,
  resetTestMocks,
} from "./test-utils"

describe("sign up page", () => {
  beforeEach(() => {
    resetTestMocks()
    vi.resetModules()
    vi.clearAllMocks()
  })

  it("redirects deprecated individual-plan links to the canonical signup flow", async () => {
    createSupabaseServerClientServerMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    })

    const { default: SignUpPage } = await import("@/app/(auth)/sign-up/page")
    const destination = await captureRedirect(() =>
      SignUpPage({
        searchParams: Promise.resolve({
          plan: "individual",
          redirect: "/find",
          source: "pricing",
        }),
      }),
    )

    expect(destination).toBe("/sign-up?redirect=%2Ffind&source=pricing")
  })

  it("routes signed-in member-intent users into find", async () => {
    createSupabaseServerClientServerMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "user_123",
              email: "member@example.com",
            },
          },
          error: null,
        }),
      },
    })

    const { default: SignUpPage } = await import("@/app/(auth)/sign-up/page")
    const destination = await captureRedirect(() =>
      SignUpPage({
        searchParams: Promise.resolve({
          intent: "find",
        }),
      }),
    )

    expect(destination).toBe("/find?member_onboarding=1&source=signup")
  })

  it("routes signed-in generic signup users into onboarding instead of find", async () => {
    createSupabaseServerClientServerMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "user_123",
              email: "builder@example.com",
            },
          },
          error: null,
        }),
      },
    })

    const { default: SignUpPage } = await import("@/app/(auth)/sign-up/page")
    const destination = await captureRedirect(() =>
      SignUpPage({
        searchParams: Promise.resolve({}),
      }),
    )

    expect(destination).toBe("/onboarding?source=signup")
  })

  it("routes signed-in paid-plan signup links straight into checkout", async () => {
    createSupabaseServerClientServerMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "user_123",
              email: "builder@example.com",
            },
          },
          error: null,
        }),
      },
    })

    const { default: SignUpPage } = await import("@/app/(auth)/sign-up/page")
    const destination = await captureRedirect(() =>
      SignUpPage({
        searchParams: Promise.resolve({
          plan: "operations_support",
        }),
      }),
    )

    expect(destination).toBe(
      "/api/stripe/checkout?plan=operations_support&source=signup&redirect=%2Fonboarding%3Fsource%3Donboarding_pricing&cancel=%2Fonboarding%3Fsource%3Donboarding_pricing&context=onboarding_builder",
    )
  })
})
