import "server-only"

import { createHash } from "node:crypto"

import { OAuth2Client, type TokenPayload } from "google-auth-library"
import { z } from "zod"

import { createSignupLegalConsent } from "@/features/legal-consent"
import { env } from "@/lib/env"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

export type GoogleSignupProvisionResult =
  | { ok: true }
  | { ok: false; code: "invalid" | "unavailable" }

const metadataValueSchema = z.union([
  z.string().max(256),
  z.number().finite(),
  z.boolean(),
  z.null(),
])

const googleSignupSchema = z.object({
  credential: z.string().min(100).max(10_000),
  nonce: z.string().regex(/^[A-Za-z0-9_-]{32,256}$/),
  acceptedLegal: z.literal(true),
  accountIntent: z.string().min(1).max(64),
  intentFocus: z.enum(["build", "find", "fund", "support"]),
  signUpMetadata: z.record(z.string(), metadataValueSchema).optional(),
})

function isExistingUserError(error: { code?: string; message?: string }) {
  const message = error.message?.toLowerCase() ?? ""
  return (
    error.code === "email_exists" ||
    message.includes("already been registered") ||
    message.includes("already registered")
  )
}

function sanitizeMetadata(
  value: Record<string, string | number | boolean | null> | undefined
) {
  if (!value) return {}

  return Object.fromEntries(
    Object.entries(value)
      .slice(0, 20)
      .filter(([key]) => /^[a-z][a-z0-9_]{0,63}$/i.test(key))
  )
}

export async function preprovisionGoogleSignup(
  input: unknown
): Promise<GoogleSignupProvisionResult> {
  if (
    process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED !== "true" ||
    !env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  ) {
    return { ok: false, code: "unavailable" }
  }

  const parsed = googleSignupSchema.safeParse(input)
  if (!parsed.success) return { ok: false, code: "invalid" }

  let payload: TokenPayload | undefined

  try {
    const ticket = await new OAuth2Client().verifyIdToken({
      idToken: parsed.data.credential,
      audience: env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    })
    payload = ticket.getPayload()
  } catch {
    return { ok: false, code: "invalid" }
  }

  const expectedNonce = createHash("sha256")
    .update(parsed.data.nonce)
    .digest("hex")

  if (
    !payload?.sub ||
    !payload.email ||
    payload.email_verified !== true ||
    payload.nonce !== expectedNonce
  ) {
    return { ok: false, code: "invalid" }
  }

  try {
    const admin = createSupabaseAdminClient()
    const { error } = await admin.auth.admin.createUser({
      email: payload.email,
      email_confirm: true,
      user_metadata: {
        ...sanitizeMetadata(parsed.data.signUpMetadata),
        account_intent: parsed.data.accountIntent,
        onboarding_intent_focus: parsed.data.intentFocus,
        full_name: payload.name ?? undefined,
        avatar_url: payload.picture ?? undefined,
        legal_consent: createSignupLegalConsent(),
      },
    })

    if (error && !isExistingUserError(error)) {
      return { ok: false, code: "unavailable" }
    }

    return { ok: true }
  } catch {
    return { ok: false, code: "unavailable" }
  }
}
