import { afterEach, describe, expect, it, vi } from "vitest"

import { canSendResendEmail, sendResendEmail } from "@/lib/email/resend"
import { env } from "@/lib/env"

const originalEnv = {
  RESEND_API_KEY: env.RESEND_API_KEY,
  RESEND_AUTH_EMAIL_API_KEY: env.RESEND_AUTH_EMAIL_API_KEY,
}

describe("resend email helper", () => {
  afterEach(() => {
    env.RESEND_API_KEY = originalEnv.RESEND_API_KEY
    env.RESEND_AUTH_EMAIL_API_KEY = originalEnv.RESEND_AUTH_EMAIL_API_KEY
    vi.unstubAllGlobals()
  })

  it("uses the canonical Resend API key when configured", async () => {
    env.RESEND_API_KEY = "re_canonical"
    env.RESEND_AUTH_EMAIL_API_KEY = "re_auth_alias"
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "email_canonical" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )
    vi.stubGlobal("fetch", fetchMock)

    expect(canSendResendEmail()).toBe(true)

    const result = await sendResendEmail({
      to: "recipient@example.com",
      subject: "Invite",
      html: "<p>Hello</p>",
      text: "Hello",
    })

    expect(result).toEqual({ ok: true, id: "email_canonical" })
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer re_canonical",
        }),
      }),
    )
  })

  it("accepts the auth email Resend key alias used in Vercel", async () => {
    env.RESEND_API_KEY = undefined
    env.RESEND_AUTH_EMAIL_API_KEY = "re_auth_alias"
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "email_alias" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )
    vi.stubGlobal("fetch", fetchMock)

    expect(canSendResendEmail()).toBe(true)

    const result = await sendResendEmail({
      to: "recipient@example.com",
      subject: "Invite",
      html: "<p>Hello</p>",
      text: "Hello",
    })

    expect(result).toEqual({ ok: true, id: "email_alias" })
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer re_auth_alias",
        }),
      }),
    )
  })

  it("reports unavailable email delivery when no Resend key is configured", () => {
    env.RESEND_API_KEY = undefined
    env.RESEND_AUTH_EMAIL_API_KEY = undefined

    expect(canSendResendEmail()).toBe(false)
  })
})
