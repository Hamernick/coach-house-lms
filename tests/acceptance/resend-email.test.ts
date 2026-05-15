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

  it("normalizes tags before sending to Resend", async () => {
    env.RESEND_API_KEY = "re_canonical"
    env.RESEND_AUTH_EMAIL_API_KEY = undefined
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "email_tags" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )
    vi.stubGlobal("fetch", fetchMock)

    await sendResendEmail({
      to: "recipient@example.com",
      subject: "Invite",
      html: "<p>Hello</p>",
      text: "Hello",
      tags: [
        { name: "category", value: "organization-access-request" },
        { name: "organization", value: "Coach House Solutions Group, NFP" },
      ],
    })

    const [, init] = fetchMock.mock.calls[0] ?? []
    const body = JSON.parse(String(init?.body)) as {
      tags?: Array<{ name: string; value: string }>
    }

    expect(body.tags).toEqual([
      { name: "category", value: "organization-access-request" },
      { name: "organization", value: "Coach-House-Solutions-Group-NFP" },
    ])
  })
})
