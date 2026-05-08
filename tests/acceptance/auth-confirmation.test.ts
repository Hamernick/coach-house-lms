import { describe, expect, it } from "vitest"

import { buildSupabaseAuthEmailPreviews } from "@/features/organization-access"
import {
  buildLoginUrlWithAuthConfirmationError,
  getSafeEmailOtpType,
  resolvePostAuthConfirmationRedirect,
  resolveAuthConfirmationDestination,
} from "@/lib/supabase/auth-confirmation"

describe("auth confirmation", () => {
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
