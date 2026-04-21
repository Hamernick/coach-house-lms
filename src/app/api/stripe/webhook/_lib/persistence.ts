/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from "@supabase/supabase-js"
import Stripe from "stripe"

import { createSupabaseAdminClient } from "@/lib/supabase"
import { supabaseErrorToError } from "@/lib/supabase/errors"
import type { Database } from "@/lib/supabase"
import { toWebhookPayload } from "./metadata"

export async function upsertSubscription({
  userId,
  customerId,
  subscriptionId,
  status,
  currentPeriodEnd,
  metadata,
}: {
  userId: string
  customerId?: string | null
  subscriptionId: string
  status: Database["public"]["Enums"]["subscription_status"]
  currentPeriodEnd?: string | null
  metadata?: Database["public"]["Tables"]["subscriptions"]["Insert"]["metadata"]
}) {
  const admin = createSupabaseAdminClient()
  const uncheckedAdmin = admin as SupabaseClient<any>
  const payload: Database["public"]["Tables"]["subscriptions"]["Insert"] = {
    user_id: userId,
    stripe_customer_id: customerId ?? null,
    stripe_subscription_id: subscriptionId,
    status,
    current_period_end: currentPeriodEnd ?? null,
    metadata: metadata ?? null,
  }

  const { error } = await uncheckedAdmin
    .from("subscriptions")
    .upsert(payload, { onConflict: "user_id,stripe_subscription_id" })

  if (error) {
    throw supabaseErrorToError(error, "Stripe webhook: unable to upsert subscription.")
  }
}

export async function upsertAcceleratorPurchase({
  userId,
  checkoutSessionId,
  paymentIntentId,
  customerId,
  coachingIncluded,
  status,
}: {
  userId: string
  checkoutSessionId: string
  paymentIntentId?: string | null
  customerId?: string | null
  coachingIncluded: boolean
  status: Database["public"]["Tables"]["accelerator_purchases"]["Row"]["status"]
}) {
  const admin = createSupabaseAdminClient()
  const uncheckedAdmin = admin as SupabaseClient<any>
  const payload: Database["public"]["Tables"]["accelerator_purchases"]["Insert"] = {
    user_id: userId,
    stripe_checkout_session_id: checkoutSessionId,
    stripe_payment_intent_id: paymentIntentId ?? null,
    stripe_customer_id: customerId ?? null,
    coaching_included: coachingIncluded,
    status,
  }

  const { error } = await uncheckedAdmin
    .from("accelerator_purchases")
    .upsert(payload, { onConflict: "stripe_checkout_session_id" })

  if (error) {
    throw supabaseErrorToError(
      error,
      "Stripe webhook: unable to upsert accelerator purchase.",
    )
  }
}

export async function upsertElectivePurchase({
  userId,
  moduleSlug,
  checkoutSessionId,
  paymentIntentId,
  customerId,
  status,
}: {
  userId: string
  moduleSlug: string
  checkoutSessionId: string
  paymentIntentId?: string | null
  customerId?: string | null
  status: Database["public"]["Tables"]["elective_purchases"]["Row"]["status"]
}) {
  const admin = createSupabaseAdminClient()
  const uncheckedAdmin = admin as SupabaseClient<any>
  const payload: Database["public"]["Tables"]["elective_purchases"]["Insert"] = {
    user_id: userId,
    module_slug: moduleSlug,
    stripe_checkout_session_id: checkoutSessionId,
    stripe_payment_intent_id: paymentIntentId ?? null,
    stripe_customer_id: customerId ?? null,
    status,
  }

  const { error } = await uncheckedAdmin
    .from("elective_purchases")
    .upsert(payload, { onConflict: "user_id,module_slug" })

  if (error) {
    throw supabaseErrorToError(
      error,
      "Stripe webhook: unable to upsert elective purchase.",
    )
  }
}

export async function shouldProcessEvent(event: Stripe.Event): Promise<boolean> {
  const admin = createSupabaseAdminClient()
  const uncheckedAdmin = admin as SupabaseClient<any>

  const initialPayload = toWebhookPayload(event, { processed: false })

  const { error: insertError } = await uncheckedAdmin
    .from("stripe_webhook_events")
    .insert({
      id: event.id,
      type: event.type,
      payload:
        initialPayload as unknown as Database["public"]["Tables"]["stripe_webhook_events"]["Insert"]["payload"],
    })

  if (!insertError) {
    return true
  }

  // Duplicate key => we need to see if it was actually processed, or if a previous attempt failed.
  if (insertError.code !== "23505") {
    throw supabaseErrorToError(
      insertError,
      "Stripe webhook: unable to store event.",
    )
  }

  const { data: existing, error } = await admin
    .from("stripe_webhook_events")
    .select("payload")
    .eq("id", event.id)
    .maybeSingle<{ payload: unknown }>()

  if (error) {
    throw supabaseErrorToError(error, "Stripe webhook: unable to load event.")
  }

  const payload = existing?.payload as { processed?: boolean } | null | undefined
  const processed = payload?.processed

  // Back-compat: if the payload isn't in our new format, treat it as processed.
  if (processed === undefined) {
    return false
  }

  return processed === false
}

export async function markWebhookEventFailed(
  event: Stripe.Event,
  error: unknown,
) {
  const admin = createSupabaseAdminClient()
  const uncheckedAdmin = admin as SupabaseClient<any>
  const { error: updateError } = await uncheckedAdmin
    .from("stripe_webhook_events")
    .update({
      payload:
        toWebhookPayload(event, {
          processed: false,
          failed_at: new Date().toISOString(),
          error: error instanceof Error ? error.message : "processing_failed",
        }) as unknown as Database["public"]["Tables"]["stripe_webhook_events"]["Update"]["payload"],
    })
    .eq("id", event.id)

  if (updateError) {
    throw supabaseErrorToError(
      updateError,
      "Stripe webhook: unable to mark failed event.",
    )
  }
}

export async function markWebhookEventProcessed(event: Stripe.Event) {
  const admin = createSupabaseAdminClient()
  const uncheckedAdmin = admin as SupabaseClient<any>
  const { error } = await uncheckedAdmin
    .from("stripe_webhook_events")
    .update({
      payload:
        toWebhookPayload(event, {
          processed: true,
          processed_at: new Date().toISOString(),
        }) as unknown as Database["public"]["Tables"]["stripe_webhook_events"]["Update"]["payload"],
    })
    .eq("id", event.id)

  if (error) {
    throw supabaseErrorToError(
      error,
      "Stripe webhook: unable to mark processed event.",
    )
  }
}
