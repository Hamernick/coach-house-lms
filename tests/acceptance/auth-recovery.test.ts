import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

const { createSupabaseRouteHandlerClientMock } = vi.hoisted(() => ({
  createSupabaseRouteHandlerClientMock: vi.fn(),
}))

vi.mock("@/lib/supabase/route", () => ({
  createSupabaseRouteHandlerClient: createSupabaseRouteHandlerClientMock,
}))

function buildRouteSupabaseStub(options?: {
  verifyOtpError?: { message: string } | null
  exchangeCodeError?: { message: string } | null
}) {
  return {
    auth: {
      verifyOtp: vi.fn().mockResolvedValue({ error: options?.verifyOtpError ?? null }),
      exchangeCodeForSession: vi.fn().mockResolvedValue({ error: options?.exchangeCodeError ?? null }),
    },
  }
}

describe("auth recovery flow", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("redirects recovery OTP failures back to update-password with a retry state", async () => {
    const supabase = buildRouteSupabaseStub({
      verifyOtpError: { message: "otp expired" },
    })
    createSupabaseRouteHandlerClientMock.mockReturnValue(supabase)

    const { handleSupabaseAuthCallback } = await import("@/lib/supabase/auth-callback")
    const response = await handleSupabaseAuthCallback(
      new NextRequest(
        "http://localhost/auth/callback?token_hash=test-token&type=recovery&redirect=%2Fupdate-password%3Fredirect%3D%252Fworkspace",
      ),
    )

    const location = new URL(response.headers.get("location") ?? "http://localhost/")
    expect(location.pathname).toBe("/update-password")
    expect(location.searchParams.get("redirect")).toBe("/workspace")
    expect(location.searchParams.get("recovery_error")).toBe("invalid_or_expired")
  })

  it("redirects recovery code exchange failures back to update-password instead of login", async () => {
    const supabase = buildRouteSupabaseStub({
      exchangeCodeError: { message: "session exchange failed" },
    })
    createSupabaseRouteHandlerClientMock.mockReturnValue(supabase)

    const { handleSupabaseAuthCallback } = await import("@/lib/supabase/auth-callback")
    const response = await handleSupabaseAuthCallback(
      new NextRequest(
        "http://localhost/auth/callback?code=test-code&redirect=%2Fupdate-password",
      ),
    )

    const location = new URL(response.headers.get("location") ?? "http://localhost/")
    expect(location.pathname).toBe("/update-password")
    expect(location.searchParams.get("recovery_error")).toBe("invalid_or_expired")
  })

  it("keeps signup PKCE fallback on the login notice path", async () => {
    const supabase = buildRouteSupabaseStub({
      exchangeCodeError: { message: "PKCE code verifier not found in storage" },
    })
    createSupabaseRouteHandlerClientMock.mockReturnValue(supabase)

    const { handleSupabaseAuthCallback } = await import("@/lib/supabase/auth-callback")
    const response = await handleSupabaseAuthCallback(
      new NextRequest("http://localhost/auth/callback?code=test-code&type=signup"),
    )

    const location = new URL(response.headers.get("location") ?? "http://localhost/")
    expect(location.pathname).toBe("/login")
    expect(location.searchParams.get("notice")).toBe("email_confirmed_sign_in")
  })

  it("keeps PKCE fallback on the login notice path even when the callback lacks an explicit signup type", async () => {
    const supabase = buildRouteSupabaseStub({
      exchangeCodeError: { message: "PKCE code verifier not found in storage" },
    })
    createSupabaseRouteHandlerClientMock.mockReturnValue(supabase)

    const { handleSupabaseAuthCallback } = await import("@/lib/supabase/auth-callback")
    const response = await handleSupabaseAuthCallback(
      new NextRequest("http://localhost/auth/callback?code=test-code"),
    )

    const location = new URL(response.headers.get("location") ?? "http://localhost/")
    expect(location.pathname).toBe("/login")
    expect(location.searchParams.get("notice")).toBe("email_confirmed_sign_in")
  })

  it("falls back to workspace after a successful non-recovery auth callback without an explicit redirect", async () => {
    const supabase = buildRouteSupabaseStub()
    createSupabaseRouteHandlerClientMock.mockReturnValue(supabase)

    const { handleSupabaseAuthCallback } = await import("@/lib/supabase/auth-callback")
    const response = await handleSupabaseAuthCallback(
      new NextRequest("http://localhost/auth/callback?code=test-code"),
    )

    const location = new URL(response.headers.get("location") ?? "http://localhost/")
    expect(location.pathname).toBe("/workspace")
  })

  it("resolves the update-password page to retry immediately when recovery is invalid", async () => {
    const { resolveUpdatePasswordPageState } = await import("@/app/(auth)/update-password/page")

    expect(
      resolveUpdatePasswordPageState(
        {
          redirect: "/workspace",
          recovery_error: "invalid_or_expired",
        },
        { hasServerUser: false },
      ),
    ).toEqual({
      redirect: "/workspace",
      recoveryError: "invalid_or_expired",
      initialStatus: "retry",
    })
  })

  it("keeps the reset form ready when the recovery session is already present", async () => {
    const { resolveUpdatePasswordPageState } = await import("@/app/(auth)/update-password/page")
    const { getUpdatePasswordRetryMessage } = await import("@/components/auth/update-password-form")
    const { buildForgotPasswordCallbackRedirect } = await import(
      "@/components/auth/forgot-password-form"
    )

    expect(
      resolveUpdatePasswordPageState({}, { hasServerUser: true }),
    ).toEqual({
      redirect: undefined,
      recoveryError: null,
      initialStatus: "ready",
    })
    expect(getUpdatePasswordRetryMessage("missing_code")).toBe(
      "This reset link is incomplete. Request a new reset email and try again.",
    )
    expect(buildForgotPasswordCallbackRedirect("/workspace")).toBe(
      "/update-password?redirect=%2Fworkspace",
    )
  })
})
