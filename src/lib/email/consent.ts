import { createHmac } from "node:crypto"

import { env } from "@/lib/env"
import {
  GLOBAL_UNSUBSCRIBE_TOPIC_ID,
  verifyEmailPreferenceToken,
} from "@/lib/email/preference-tokens"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

export type ApplyEmailUnsubscribeInput = {
  token: string
  scope?: "topic" | "global"
  source: "one_click_header" | "preference_page"
  userAgent?: string | null
  ipAddress?: string | null
}

export type ApplyEmailUnsubscribeResult =
  | {
      ok: true
      email: string
      topicId: string | null
      scope: "topic" | "global"
    }
  | { ok: false; error: string }

function normalizeEmailAddress(email: string) {
  return email.trim().toLowerCase()
}

function resolveEmailOpsTokenSecret() {
  return (
    env.EMAIL_OPS_TOKEN_SECRET?.trim() ||
    env.RESEND_WEBHOOK_SECRET?.trim() ||
    env.SUPABASE_JWT_SECRET?.trim() ||
    null
  )
}

function hashRequestValue(value: string | null | undefined) {
  const secret = resolveEmailOpsTokenSecret()
  if (!secret || !value) return null
  return createHmac("sha256", secret).update(value).digest("hex")
}

async function ensureGlobalSuppression(email: string, metadata: Record<string, unknown>) {
  const supabase = createSupabaseAdminClient()
  const { data: existing, error: existingError } = await supabase
    .from("platform_email_suppressions")
    .select("id")
    .eq("email", email)
    .eq("reason", "unsubscribe")
    .maybeSingle()

  if (existingError) return existingError.message
  if (existing) return null

  const { error } = await supabase.from("platform_email_suppressions").insert({
    email,
    reason: "unsubscribe",
    source: "email_preferences",
    metadata,
  })

  return error?.message ?? null
}

export async function applyEmailUnsubscribeToken(
  input: ApplyEmailUnsubscribeInput
): Promise<ApplyEmailUnsubscribeResult> {
  const verified = await verifyEmailPreferenceToken(input.token)
  if (!verified.ok) return { ok: false, error: verified.error }

  const payload = verified.payload
  const email = normalizeEmailAddress(payload.email)
  const requestedScope =
    input.scope === "global" || payload.topicId === GLOBAL_UNSUBSCRIBE_TOPIC_ID
      ? "global"
      : "topic"
  const topicId = requestedScope === "global" ? null : payload.topicId

  if (topicId === "transactional") {
    return {
      ok: false,
      error: "Required account and security notices cannot be unsubscribed.",
    }
  }

  const supabase = createSupabaseAdminClient()
  const metadata = {
    tokenVersion: payload.v,
    tokenNonce: payload.nonce,
    requestedScope,
  }
  const ipHash = hashRequestValue(input.ipAddress)

  if (requestedScope === "global") {
    const suppressionError = await ensureGlobalSuppression(email, metadata)
    if (suppressionError) return { ok: false, error: suppressionError }
  } else if (topicId) {
    const { error: preferenceError } = await supabase
      .from("platform_email_preferences")
      .upsert(
        {
          email,
          topic_id: topicId,
          status: "unsubscribed",
          source: input.source,
          person_id: payload.personId ?? null,
          metadata,
        },
        { onConflict: "email,topic_id" }
      )

    if (preferenceError) return { ok: false, error: preferenceError.message }
  }

  const { error: eventError } = await supabase
    .from("platform_email_consent_events")
    .insert({
      email,
      topic_id: topicId,
      action: requestedScope === "global" ? "global_unsubscribe" : "unsubscribe",
      source: input.source,
      person_id: payload.personId ?? null,
      campaign_id: payload.campaignId ?? null,
      delivery_id: payload.deliveryId ?? null,
      user_agent: input.userAgent ?? null,
      ip_hash: ipHash,
      metadata,
    })

  if (eventError) return { ok: false, error: eventError.message }

  if (payload.deliveryId) {
    await supabase
      .from("platform_email_deliveries")
      .update({ status: "unsubscribed" })
      .eq("id", payload.deliveryId)
  }

  return {
    ok: true,
    email,
    topicId,
    scope: requestedScope,
  }
}
