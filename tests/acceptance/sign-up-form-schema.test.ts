import { describe, expect, it } from "vitest"

import { isCaptchaConfigured, signUpSchema } from "@/components/auth/sign-up-form-schema"

describe("sign-up form schema", () => {
  it("accepts matching passwords", () => {
    const result = signUpSchema.safeParse({
      email: "user@example.com",
      password: "password123",
      confirmPassword: "password123",
    })

    expect(result.success).toBe(true)
  })

  it("rejects mismatched passwords", () => {
    const result = signUpSchema.safeParse({
      email: "user@example.com",
      password: "password123",
      confirmPassword: "different123",
    })

    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.confirmPassword).toEqual(["Passwords do not match"])
  })

  it("treats blank site keys as captcha not configured", () => {
    expect(isCaptchaConfigured(undefined)).toBe(false)
    expect(isCaptchaConfigured(null)).toBe(false)
    expect(isCaptchaConfigured("")).toBe(false)
    expect(isCaptchaConfigured("   ")).toBe(false)
    expect(isCaptchaConfigured("10000000-ffff-ffff-ffff-000000000001")).toBe(false)
    expect(isCaptchaConfigured("10000000-ffff-ffff-ffff-000000000001", false)).toBe(false)
    expect(isCaptchaConfigured("10000000-ffff-ffff-ffff-000000000001", "false")).toBe(false)
    expect(isCaptchaConfigured("10000000-ffff-ffff-ffff-000000000001", "true")).toBe(true)
    expect(isCaptchaConfigured("10000000-ffff-ffff-ffff-000000000001", " TRUE ")).toBe(true)
  })
})
