/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import Stripe from "stripe"
import type { SupabaseClient } from "@supabase/supabase-js"

import { env } from "@/lib/env"
import { createSupabaseAdminClient } from "@/lib/supabase"
import { supabaseErrorToError } from "@/lib/supabase/errors"
import type { Database } from "@/lib/supabase"

export const runtime = "nodejs"

const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null

async function upsertSubscription({
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

  await uncheckedAdmin.from("subscriptions").upsert(payload, { onConflict: "stripe_subscription_id" })
}

async function upsertAcceleratorPurchase({
  userId,
  checkoutSessionId,
  paymentIntentId,
  customerId,
  status,
}: {
  userId: string
  checkoutSessionId: string
  paymentIntentId?: string | null
  customerId?: string | null
  status: Database["public"]["Tables"]["accelerator_purchases"]["Row"]["status"]
}) {
  const admin = createSupabaseAdminClient()
  const uncheckedAdmin = admin as SupabaseClient<any>
  const payload: Database["public"]["Tables"]["accelerator_purchases"]["Insert"] = {
    user_id: userId,
    stripe_checkout_session_id: checkoutSessionId,
    stripe_payment_intent_id: paymentIntentId ?? null,
    stripe_customer_id: customerId ?? null,
    status,
  }

  await uncheckedAdmin
    .from("accelerator_purchases")
    .upsert(payload, { onConflict: "stripe_checkout_session_id" })
}

type WebhookEventPayload = {
  stripe_event: unknown
  processed: boolean
  received_at: string
  processed_at?: string
  failed_at?: string
  error?: string
}

function toWebhookPayload(event: Stripe.Event, patch: Partial<WebhookEventPayload>): WebhookEventPayload {
  return {
    stripe_event: event,
    processed: false,
    received_at: new Date().toISOString(),
    ...patch,
  }
}

async function shouldProcessEvent(event: Stripe.Event): Promise<boolean> {
  const admin = createSupabaseAdminClient()
  const uncheckedAdmin = admin as SupabaseClient<any>

  const initialPayload = toWebhookPayload(event, { processed: false })

  const { error: insertError } = await uncheckedAdmin.from("stripe_webhook_events").insert({
    id: event.id,
    type: event.type,
    payload: initialPayload as unknown as Database["public"]["Tables"]["stripe_webhook_events"]["Insert"]["payload"],
  })

  if (!insertError) {
    return true
  }

  // Duplicate key => we need to see if it was actually processed, or if a previous attempt failed.
  if (insertError.code !== "23505") {
    throw supabaseErrorToError(insertError, "Stripe webhook: unable to store event.")
  }

  const { data: existing, error } = await admin
    .from("stripe_webhook_events")
    .select("payload")
    .eq("id", event.id)
    .maybeSingle<{ payload: unknown }>()

  if (error) {
    throw supabaseErrorToError(error, "Stripe webhook: unable to load event.")
  }

  const payload = existing?.payload as Partial<WebhookEventPayload> | null | undefined
  const processed = payload?.processed

  // Back-compat: if the payload isn't in our new format, treat it as processed.
  if (processed === undefined) {
    return false
  }

  return processed === false
}

function extractUserIdFromMetadata(metadata: Stripe.Metadata) {
  const candidate = metadata.user_id ?? metadata.userId
  if (candidate && typeof candidate === "string") {
    return candidate
  }
  return undefined
}

function toStatus(value: string): Database["public"]["Enums"]["subscription_status"] {
  const allowed: Database["public"]["Enums"]["subscription_status"][] = [
    "trialing",
    "active",
    "past_due",
    "canceled",
    "incomplete",
    "incomplete_expired",
  ]
  if (allowed.includes(value as Database["public"]["Enums"]["subscription_status"])) {
    return value as Database["public"]["Enums"]["subscription_status"]
  }
  return "trialing"
}

async function maybeStartOrganizationTrial({
  userId,
  customerId,
  idempotencyKey,
}: {
  userId: string
  customerId: string
  idempotencyKey: string
}) {
  const organizationPriceId = env.STRIPE_ORGANIZATION_PRICE_ID

  if (!stripe || !organizationPriceId) {
    return
  }

  const admin = createSupabaseAdminClient()
  const { data: existing, error } = await admin
    .from("subscriptions")
    .select("id, status")
    .eq("user_id", userId)
    .in("status", ["active", "trialing"])
    .limit(1)
    .maybeSingle<{ id: string; status: string }>()

  if (error) {
    throw supabaseErrorToError(error, "Stripe webhook: unable to load subscription.")
  }

  if (existing) {
    return
  }

  const subscription = await stripe.subscriptions.create(
    {
      customer: customerId,
      items: [{ price: organizationPriceId }],
      trial_period_days: 30,
      metadata: {
        user_id: userId,
        planName: "Organization",
        context: "accelerator_bundle",
      },
    },
    { idempotencyKey },
  )

  const periodUnix = (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end ?? null
  const currentPeriodEnd = periodUnix ? new Date(periodUnix * 1000).toISOString() : null

  await upsertSubscription({
    userId,
    customerId,
    subscriptionId: subscription.id,
    status: toStatus(subscription.status),
    currentPeriodEnd,
    metadata: { planName: "Organization", context: "accelerator_bundle" },
  })
}

export async function POST(request: NextRequest) {
  const secret = env.STRIPE_WEBHOOK_SECRET

  if (!stripe || !secret) {
    return NextResponse.json({ ignored: true }, { status: 200 })
  }

  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, secret)
  } catch (error) {
    console.error("Stripe signature verification failed", error)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    const shouldProcess = await shouldProcessEvent(event)
    if (!shouldProcess) return NextResponse.json({ received: true, duplicate: true }, { status: 200 })
  } catch (error) {
    console.error("Stripe webhook idempotency check failed", error)
    return NextResponse.json({ received: true, error: "processing_failed" }, { status: 500 })
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : undefined
      const userId = session.client_reference_id ?? undefined

      if (session.mode === "payment" && session.metadata?.kind === "accelerator") {
        const resolvedUserId = userId ?? extractUserIdFromMetadata(session.metadata) ?? undefined
        if (resolvedUserId) {
          const customerId = typeof session.customer === "string" ? session.customer : null
          await upsertAcceleratorPurchase({
            userId: resolvedUserId,
            checkoutSessionId: session.id,
            paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
            customerId,
            status: "active",
          })

          if (customerId) {
            await maybeStartOrganizationTrial({
              userId: resolvedUserId,
              customerId,
              idempotencyKey: `accelerator_bundle_${session.id}`,
            })
          }
        }
      }

      if (subscriptionId && userId) {
        await upsertSubscription({
          userId,
          customerId: typeof session.customer === "string" ? session.customer : null,
          subscriptionId,
          status: toStatus(session.status ?? "trialing"),
          metadata: { planName: session.metadata?.planName ?? null },
        })
      }
    }

    if (event.type.startsWith("customer.subscription")) {
      const subscription = event.data.object as Stripe.Subscription
      const userId = extractUserIdFromMetadata(subscription.metadata)

      if (userId) {
        await upsertSubscription({
          userId,
          customerId: typeof subscription.customer === "string" ? subscription.customer : null,
          subscriptionId: subscription.id,
          status: toStatus(subscription.status),
          currentPeriodEnd: (() => {
            const periodUnix =
              (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end ?? null
            return periodUnix ? new Date(periodUnix * 1000).toISOString() : null
          })(),
          metadata: subscription.metadata as Record<string, string> | null,
        })
      }
    }
  } catch (error) {
    console.error("Failed to process Stripe webhook", error)
    try {
      const admin = createSupabaseAdminClient()
      const uncheckedAdmin = admin as SupabaseClient<any>
      await uncheckedAdmin
        .from("stripe_webhook_events")
        .update({
          payload: toWebhookPayload(event, {
            processed: false,
            failed_at: new Date().toISOString(),
            error: error instanceof Error ? error.message : "processing_failed",
          }) as unknown as Database["public"]["Tables"]["stripe_webhook_events"]["Update"]["payload"],
        })
        .eq("id", event.id)
    } catch (cleanupError) {
      console.error("Unable to cleanup failed webhook lock", cleanupError)
    }
    return NextResponse.json({ received: true, error: "processing_failed" }, { status: 500 })
  }

  try {
    const admin = createSupabaseAdminClient()
    const uncheckedAdmin = admin as SupabaseClient<any>
    await uncheckedAdmin
      .from("stripe_webhook_events")
      .update({
        payload: toWebhookPayload(event, { processed: true, processed_at: new Date().toISOString() }) as unknown as Database["public"]["Tables"]["stripe_webhook_events"]["Update"]["payload"],
      })
      .eq("id", event.id)
  } catch (error) {
    console.error("Unable to mark Stripe webhook processed", error)
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
