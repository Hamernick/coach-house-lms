import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

import {
  resolveGoogleAuthErrorMessage,
  sanitizeGoogleSignupMetadata,
} from "@/features/google-auth"

describe("google-auth feature contract", () => {
  it("sanitizes onboarding metadata before admin provisioning", () => {
    expect(
      sanitizeGoogleSignupMetadata({
        onboarding_role_interest: "board_member",
        member_home_source: "x".repeat(300),
        "not allowed": "discarded",
        nested: { ignored: true },
      })
    ).toEqual({
      onboarding_role_interest: "board_member",
      member_home_source: "x".repeat(256),
    })
  })

  it("keeps first-time login guidance generic", () => {
    expect(resolveGoogleAuthErrorMessage({ mode: "login" })).toContain(
      "create an account first"
    )
    expect(
      resolveGoogleAuthErrorMessage({
        mode: "signup",
        result: { ok: false, code: "invalid" },
      })
    ).toContain("could not verify")
  })

  it("verifies Google identity and nonce before provisioning", () => {
    const action = readFileSync("src/lib/google-auth-provisioning.ts", "utf8")
    const controller = readFileSync(
      "src/features/google-auth/hooks/use-google-auth-controller.ts",
      "utf8"
    )
    const route = readFileSync(
      "src/app/api/auth/google/signup/route.ts",
      "utf8"
    )

    expect(action).toContain("verifyIdToken")
    expect(action).toContain("audience: env.NEXT_PUBLIC_GOOGLE_CLIENT_ID")
    expect(action).toContain("payload.email_verified !== true")
    expect(action).toContain("payload.nonce !== expectedNonce")
    expect(action).toContain("legal_consent: createSignupLegalConsent()")
    expect(action).not.toContain("GOOGLE_CLIENT_SECRET")
    expect(controller).toContain("window.crypto.subtle.digest(")
    expect(controller).toContain('provider: "google"')
    expect(controller).toContain("nonce,")
    expect(controller).toContain('fetch("/api/auth/google/signup"')
    expect(route).toContain("preprovisionGoogleSignup(input)")
  })

  it("adds feature-flagged Google auth to both shared forms", () => {
    const loginForm = readFileSync("src/components/auth/login-form.tsx", "utf8")
    const signUpForm = readFileSync(
      "src/components/auth/sign-up-form.tsx",
      "utf8"
    )
    const panel = readFileSync(
      "src/features/google-auth/components/google-auth-panel.tsx",
      "utf8"
    )

    expect(loginForm).toContain('<GoogleAuthPanel mode="login"')
    expect(loginForm).toContain('import("@/features/google-auth")')
    expect(signUpForm).toContain('mode="signup"')
    expect(signUpForm).toContain("disabled={!acceptedLegal || isPending}")
    expect(panel).toContain("NEXT_PUBLIC_GOOGLE_AUTH_ENABLED")
    expect(panel).toContain("https://accounts.google.com/gsi/client")
    expect(panel).toContain("renderButton")
    expect(panel).toContain('role="alert"')
  })
})
