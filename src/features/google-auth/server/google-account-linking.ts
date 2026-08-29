import "server-only"

import { createHash } from "node:crypto"

import { OAuth2Client } from "google-auth-library"
import { z } from "zod"

import { env } from "@/lib/env"
import { createSupabaseServerClient } from "@/lib/supabase/server"

import type { GoogleLinkValidationResult } from "../types"

const googleLinkSchema = z.object({
  credential: z.string().min(100).max(10_000),
  nonce: z.string().regex(/^[A-Za-z0-9_-]{32,256}$/),
})

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

export async function validateGoogleAccountLink(
  input: unknown
): Promise<GoogleLinkValidationResult> {
  if (
    process.env.NEXT_PUBLIC_GOOGLE_LINKING_ENABLED !== "true" ||
    !env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  ) {
    return { ok: false, code: "unavailable" }
  }

  const parsed = googleLinkSchema.safeParse(input)
  if (!parsed.success) return { ok: false, code: "invalid" }

  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user?.email || !user.email_confirmed_at) {
      return { ok: false, code: "unauthorized" }
    }

    const ticket = await new OAuth2Client().verifyIdToken({
      idToken: parsed.data.credential,
      audience: env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    })
    const payload = ticket.getPayload()
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

    if (normalizeEmail(payload.email) !== normalizeEmail(user.email)) {
      return { ok: false, code: "email_mismatch" }
    }

    return { ok: true }
  } catch {
    return { ok: false, code: "invalid" }
  }
}
