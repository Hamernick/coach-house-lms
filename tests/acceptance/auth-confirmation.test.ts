import "./test-utils"
import { describe, expect, it, vi } from "vitest"

import { captureRedirect, createSupabaseServerClientServerMock, headersMock } from "./test-utils"

import { buildSupabaseAuthEmailPreviews } from "@/features/organization-access"
import {
  buildLoginUrlWithAuthConfirmationError,
  getSafeEmailOtpType,
  resolvePostAuthConfirmationRedirect,
  resolveAuthConfirmationDestination,
  resolveConfirmedSignupDestination,
} from "@/lib/supabase/auth-confirmation"

describe("auth confirmation", () => {
  it.each([false, true])("only resumes the selected plan after successful human confirmation (OTP error: %s)", async (otpError) => {
    headersMock.mockResolvedValue({ get: (name: string) => name === "host" ? "coachhouse.app" : undefined })
    const verifyOtp = vi.fn().mockResolvedValue({
      data: { user: { user_metadata: { onboarding_intent_focus: "build", onboarding_selected_builder_plan_tier: "organization" } } },
      error: otpError ? { message: "Expired token" } : null,
    })
    createSupabaseServerClientServerMock.mockResolvedValue({ auth: { verifyOtp } })
    const { default: ConfirmEmailPage } = await import("@/app/auth/confirm/page")
    const page = await ConfirmEmailPage({ searchParams: Promise.resolve({ token_hash: "test-token", type: "email", next: "https://coachhouse.app" }) })
    const form = page.props.children.props.children
    expect(form.type).toBe("form")
    expect(verifyOtp).not.toHaveBeenCalled()
    const formData = new FormData()
    for (const input of form.props.children.filter((child: { type: string }) => child.type === "input")) {
      formData.set(input.props.name, input.props.value)
    }
    const result = new URL(await captureRedirect(() => form.props.action(formData)), "https://coachhouse.app")
    expect(verifyOtp).toHaveBeenCalledWith({ token_hash: "test-token", type: "email" })
    expect(result.pathname).toBe(otpError ? "/login" : "/api/stripe/checkout")
    if (otpError) expect(result.searchParams.get("error")).toContain("invalid or expired")
    else expect(result.searchParams.get("plan")).toBe("organization")
  })

  it.each(["organization", "operations_support", "free"])("recovers the %s signup when the provider replaces the callback with its Site URL", (plan) => {
    const destination = resolveAuthConfirmationDestination("https://coachhouse.app", "https://coachhouse.app")
    const result = new URL(resolveConfirmedSignupDestination({
      destination,
      type: "email",
      userMetadata: { onboarding_intent_focus: "build", onboarding_selected_builder_plan_tier: plan },
    }))
    expect(result.origin).toBe("https://coachhouse.app")
    expect(result.pathname).toBe(plan === "free" ? "/onboarding" : "/api/stripe/checkout")
    expect(result.searchParams.get("plan")).toBe(plan)
    if (plan !== "free") {
      expect(result.searchParams.get("redirect")).toBe("/onboarding?source=onboarding_pricing")
      expect(result.searchParams.get("context")).toBe("onboarding_builder")
    }
  })

  it("recovers missing signup destinations without replacing explicit application or recovery destinations", () => {
    expect(resolveConfirmedSignupDestination({ destination: "/workspace", type: "signup" })).toBe("/onboarding?source=signup")
    for (const destination of ["/documentation/fiscal-sponsorship#application", "/find", "/onboarding?source=signup"]) {
      expect(resolveConfirmedSignupDestination({ destination, type: "email" })).toBe(destination)
    }
    expect(resolveConfirmedSignupDestination({ destination: "/", type: "recovery" })).toBe("/")
    expect(resolveConfirmedSignupDestination({ destination: "/", type: "email", userMetadata: { onboarding_completed: true } })).toBe("/")
  })

  it("routes signup confirmation emails through the human-confirm page", () => {
    const preview = buildSupabaseAuthEmailPreviews("https://coachhouse.app").find(
      (item) => item.id === "supabase-confirm-sign-up",
    )

    expect(preview?.html).toContain(
      "https://coachhouse.app/auth/confirm?token_hash={{ .TokenHash }}",
    )
    expect(preview?.html).toContain("type=email")
    expect(preview?.html).toContain("next={{ .RedirectTo }}")
    expect(preview?.html).not.toContain("{{ .ConfirmationURL }}")
  })

  it("unwraps the legacy callback redirect into the real post-confirmation path", () => {
    expect(
      resolveAuthConfirmationDestination(
        "https://coachhouse.app/auth/callback?redirect=%2Fonboarding%3Fsource%3Dhome_signup",
        "https://coachhouse.app",
      ),
    ).toBe("https://coachhouse.app/onboarding?source=home_signup")

    expect(
      resolveAuthConfirmationDestination(
        "/auth/callback?redirect=%2Fonboarding%3Fsource%3Dhome_signup",
        "https://coachhouse.app",
      ),
    ).toBe("/onboarding?source=home_signup")
  })

  it("rejects external or unsafe confirmation destinations", () => {
    expect(
      resolveAuthConfirmationDestination(
        "https://coachhouse.app/auth/callback?redirect=%2Fonboarding",
        "https://legacy-confirm-host.example",
      ),
    ).toBe("https://coachhouse.app/onboarding")
    expect(
      resolveAuthConfirmationDestination(
        "https://example.com/auth/callback?redirect=%2Fonboarding",
        "https://coachhouse.app",
      ),
    ).toBe("/workspace")
    expect(resolveAuthConfirmationDestination("//example.com/onboarding")).toBe("/workspace")
  })

  it("keeps confirmation error redirects on the login route", () => {
    expect(
      buildLoginUrlWithAuthConfirmationError({
        destination: "/onboarding?source=home_signup",
        message: "Invalid link.",
      }),
    ).toBe(
      "/login?redirect=%2Fonboarding%3Fsource%3Dhome_signup&error=Invalid+link.",
    )
    expect(
      buildLoginUrlWithAuthConfirmationError({
        destination: "https://coachhouse.app/onboarding?source=home_signup",
        message: "Invalid link.",
      }),
    ).toBe(
      "https://coachhouse.app/login?redirect=%2Fonboarding%3Fsource%3Dhome_signup&error=Invalid+link.",
    )
  })

  it("accepts the Supabase email OTP type used by custom confirmation templates", () => {
    expect(getSafeEmailOtpType("email")).toBe("email")
    expect(getSafeEmailOtpType("unsupported")).toBeNull()
  })

  it("sends cross-origin confirmations to branded login with the redirect preserved", () => {
    expect(
      resolvePostAuthConfirmationRedirect(
        "https://coachhouse.app/onboarding?source=home_signup",
        "https://legacy-confirm-host.example",
      ),
    ).toBe(
      "https://coachhouse.app/login?redirect=%2Fonboarding%3Fsource%3Dhome_signup&notice=email_confirmed_sign_in",
    )
    expect(
      resolvePostAuthConfirmationRedirect(
        "https://coachhouse.app/onboarding?source=home_signup",
        "https://coachhouse.app",
      ),
    ).toBe("https://coachhouse.app/onboarding?source=home_signup")
    expect(resolvePostAuthConfirmationRedirect("/onboarding", "http://localhost:3000")).toBe(
      "/onboarding",
    )
  })
})
