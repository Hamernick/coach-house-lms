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
const DEFAULT_FROM_EMAIL = "hello@coachhouse.app"
const DEFAULT_FROM_NAME = "Coach House"
const RESEND_TAG_COMPONENT_PATTERN = /[^A-Za-z0-9_-]+/g
const RESEND_TAG_LIMIT = 75

function resolveReplyTo(input: string | null | undefined) {
  if (typeof input === "string" && input.trim().length > 0) return input.trim()
  if (typeof env.RESEND_REPLY_TO_EMAIL === "string" && env.RESEND_REPLY_TO_EMAIL.trim().length > 0) {
    return env.RESEND_REPLY_TO_EMAIL.trim()
  }
  return null
}

function resolveUnsubscribeHeaders(replyTo: string | null) {
  const unsubscribeEmail =
    typeof env.RESEND_UNSUBSCRIBE_EMAIL === "string" && env.RESEND_UNSUBSCRIBE_EMAIL.trim().length > 0
      ? env.RESEND_UNSUBSCRIBE_EMAIL.trim()
      : replyTo
  const unsubscribeUrl =
    typeof env.RESEND_UNSUBSCRIBE_URL === "string" && env.RESEND_UNSUBSCRIBE_URL.trim().length > 0
      ? env.RESEND_UNSUBSCRIBE_URL.trim()
      : null
  const listUnsubscribe = [
    unsubscribeEmail ? `<mailto:${unsubscribeEmail}>` : null,
    unsubscribeUrl ? `<${unsubscribeUrl}>` : null,
  ].filter(Boolean)

  if (listUnsubscribe.length === 0) return null

  return {
    "List-Unsubscribe": listUnsubscribe.join(", "),
    ...(unsubscribeUrl ? { "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } : {}),
  }
}

function resolveResendApiKey() {
  const canonicalKey = env.RESEND_API_KEY?.trim()
  if (canonicalKey) return canonicalKey

  return env.RESEND_AUTH_EMAIL_API_KEY?.trim() || null
}

export function normalizeResendTagComponent(value: string) {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(RESEND_TAG_COMPONENT_PATTERN, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "")

  return normalized || "unknown"
}

function normalizeResendTags(tags: SendResendEmailInput["tags"]) {
  if (!Array.isArray(tags) || tags.length === 0) return undefined

  return tags.slice(0, RESEND_TAG_LIMIT).map((tag) => ({
    name: normalizeResendTagComponent(tag.name),
    value: normalizeResendTagComponent(tag.value),
  }))
}

export function canSendResendEmail() {
  return Boolean(resolveResendApiKey())
}

export async function sendResendEmail(
  input: SendResendEmailInput,
): Promise<SendResendEmailResult> {
  const resendApiKey = resolveResendApiKey()

  if (!resendApiKey) {
    return { ok: false, error: "RESEND_API_KEY is not configured." }
  }

  const fromEmail =
    typeof env.RESEND_FROM_EMAIL === "string" && env.RESEND_FROM_EMAIL.trim().length > 0
      ? env.RESEND_FROM_EMAIL.trim()
      : DEFAULT_FROM_EMAIL
  const fromName =
    typeof env.RESEND_FROM_NAME === "string" && env.RESEND_FROM_NAME.trim().length > 0
      ? env.RESEND_FROM_NAME.trim()
      : DEFAULT_FROM_NAME
  const replyTo = resolveReplyTo(input.replyTo)
  const unsubscribeHeaders = resolveUnsubscribeHeaders(replyTo)
  const tags = normalizeResendTags(input.tags)

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${fromName} <${fromEmail}>`,
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      ...(replyTo ? { reply_to: replyTo } : {}),
      ...(unsubscribeHeaders ? { headers: unsubscribeHeaders } : {}),
      ...(tags ? { tags } : {}),
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
