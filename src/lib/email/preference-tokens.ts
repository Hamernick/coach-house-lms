import { env } from "@/lib/env"

export const DEFAULT_EMAIL_TOPIC_ID = "product_updates"
export const GLOBAL_UNSUBSCRIBE_TOPIC_ID = "all"

type EmailPreferenceTokenPayload = {
  v: 1
  email: string
  topicId: string
  campaignId?: string | null
  deliveryId?: string | null
  personId?: string | null
  exp: number
  nonce: string
}

export type CreateEmailPreferenceTokenInput = {
  email: string
  topicId?: string | null
  campaignId?: string | null
  deliveryId?: string | null
  personId?: string | null
  expiresInSeconds?: number
}

export type VerifiedEmailPreferenceToken =
  | { ok: true; payload: EmailPreferenceTokenPayload }
  | { ok: false; error: string }

const DEFAULT_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 365
const SAFE_TOPIC_ID_PATTERN = /^[a-z0-9_:-]{1,80}$/
const encoder = new TextEncoder()
const decoder = new TextDecoder()

function normalizeEmailAddress(email: string) {
  return email.trim().toLowerCase()
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function base64UrlToBytes(input: string) {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/").padEnd(
    Math.ceil(input.length / 4) * 4,
    "="
  )
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

function encodeBase64Url(input: string) {
  return bytesToBase64Url(encoder.encode(input))
}

function decodeBase64Url(input: string) {
  return decoder.decode(base64UrlToBytes(input))
}

function resolveEmailOpsTokenSecret() {
  return (
    env.EMAIL_OPS_TOKEN_SECRET?.trim() ||
    env.RESEND_WEBHOOK_SECRET?.trim() ||
    env.SUPABASE_JWT_SECRET?.trim() ||
    null
  )
}

async function importHmacKey(secret: string, keyUsages: KeyUsage[]) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    keyUsages
  )
}

async function signTokenPayload(encodedPayload: string, secret: string) {
  const key = await importHmacKey(secret, ["sign"])
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(encodedPayload)
  )
  return bytesToBase64Url(new Uint8Array(signature))
}

async function verifyTokenSignature(
  encodedPayload: string,
  signature: string,
  secret: string
) {
  const key = await importHmacKey(secret, ["verify"])
  return crypto.subtle.verify(
    "HMAC",
    key,
    base64UrlToBytes(signature),
    encoder.encode(encodedPayload)
  )
}

function createNonce() {
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  return bytesToBase64Url(bytes)
}

export function canCreateEmailPreferenceTokens() {
  return Boolean(resolveEmailOpsTokenSecret())
}

export async function createEmailPreferenceToken(
  input: CreateEmailPreferenceTokenInput
) {
  const secret = resolveEmailOpsTokenSecret()
  if (!secret) {
    throw new Error("EMAIL_OPS_TOKEN_SECRET is not configured.")
  }

  const email = normalizeEmailAddress(input.email)
  const topicId = input.topicId?.trim() || DEFAULT_EMAIL_TOPIC_ID
  if (!email || !SAFE_TOPIC_ID_PATTERN.test(topicId)) {
    throw new Error("Invalid email preference token payload.")
  }

  const payload: EmailPreferenceTokenPayload = {
    v: 1,
    email,
    topicId,
    campaignId: input.campaignId ?? null,
    deliveryId: input.deliveryId ?? null,
    personId: input.personId ?? null,
    exp:
      Math.floor(Date.now() / 1000) +
      (input.expiresInSeconds ?? DEFAULT_TOKEN_TTL_SECONDS),
    nonce: createNonce(),
  }
  const encodedPayload = encodeBase64Url(JSON.stringify(payload))
  const signature = await signTokenPayload(encodedPayload, secret)

  return `${encodedPayload}.${signature}`
}

export async function verifyEmailPreferenceToken(
  token: string
): Promise<VerifiedEmailPreferenceToken> {
  const secret = resolveEmailOpsTokenSecret()
  if (!secret) return { ok: false, error: "Email preference token secret is not configured." }

  const [encodedPayload, signature] = token.split(".")
  if (!encodedPayload || !signature) return { ok: false, error: "Invalid unsubscribe token." }

  const signatureValid = await verifyTokenSignature(
    encodedPayload,
    signature,
    secret
  )
  if (!signatureValid) {
    return { ok: false, error: "Invalid unsubscribe token signature." }
  }

  let payload: EmailPreferenceTokenPayload
  try {
    payload = JSON.parse(decodeBase64Url(encodedPayload)) as EmailPreferenceTokenPayload
  } catch {
    return { ok: false, error: "Invalid unsubscribe token payload." }
  }

  if (
    payload.v !== 1 ||
    !payload.email ||
    !payload.topicId ||
    !SAFE_TOPIC_ID_PATTERN.test(payload.topicId)
  ) {
    return { ok: false, error: "Invalid unsubscribe token payload." }
  }

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    return { ok: false, error: "This unsubscribe link has expired." }
  }

  return {
    ok: true,
    payload: {
      ...payload,
      email: normalizeEmailAddress(payload.email),
    },
  }
}

export function resolveEmailOpsPublicBaseUrl(origin?: string | null) {
  return (
    env.NEXT_PUBLIC_SITE_URL?.trim() ||
    env.NEXT_PUBLIC_APP_URL?.trim() ||
    origin?.trim() ||
    "http://localhost:3000"
  ).replace(/\/+$/, "")
}

export async function buildEmailUnsubscribeUrls(
  input: CreateEmailPreferenceTokenInput & { origin?: string | null }
) {
  const token = await createEmailPreferenceToken(input)
  const baseUrl = resolveEmailOpsPublicBaseUrl(input.origin)
  const encodedToken = encodeURIComponent(token)

  return {
    token,
    pageUrl: `${baseUrl}/unsubscribe?token=${encodedToken}`,
    oneClickUrl: `${baseUrl}/api/email/unsubscribe?token=${encodedToken}`,
  }
}
