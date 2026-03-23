import { env } from "@/lib/env"

type SendResendEmailInput = {
  to: string | string[]
  subject: string
  html: string
  text: string
  replyTo?: string | null
  tags?: Array<{ name: string; value: string }>
}

type SendResendEmailResult =
  | { ok: true; id: string | null }
  | { ok: false; error: string }

const RESEND_API_URL = "https://api.resend.com/emails"
const DEFAULT_FROM_EMAIL = "no-reply@coachhouse.app"
const DEFAULT_FROM_NAME = "Coach House"

function resolveReplyTo(input: string | null | undefined) {
  if (typeof input === "string" && input.trim().length > 0) return input.trim()
  if (typeof env.RESEND_REPLY_TO_EMAIL === "string" && env.RESEND_REPLY_TO_EMAIL.trim().length > 0) {
    return env.RESEND_REPLY_TO_EMAIL.trim()
  }
  return null
}

export function canSendResendEmail() {
  return Boolean(env.RESEND_API_KEY?.trim())
}

export async function sendResendEmail(
  input: SendResendEmailInput,
): Promise<SendResendEmailResult> {
  if (!canSendResendEmail()) {
    return { ok: false, error: "RESEND_API_KEY is not configured." }
  }

  const fromEmail =
    typeof env.RESEND_FROM_EMAIL === "string" && env.RESEND_FROM_EMAIL.trim().length > 0
      ? env.RESEND_FROM_EMAIL.trim()
      : DEFAULT_FROM_EMAIL

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${DEFAULT_FROM_NAME} <${fromEmail}>`,
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      reply_to: resolveReplyTo(input.replyTo),
      tags: input.tags,
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => "")
    return {
      ok: false,
      error: body.trim() || `Resend request failed with status ${response.status}.`,
    }
  }

  const payload = (await response.json().catch(() => null)) as
    | { id?: string | null }
    | null

  return { ok: true, id: payload?.id ?? null }
}
