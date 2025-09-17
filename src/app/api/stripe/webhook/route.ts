/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import Stripe from "stripe"
import type { SupabaseClient } from "@supabase/supabase-js"

import { env } from "@/lib/env"
import { createSupabaseAdminClient } from "@/lib/supabase"
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

async function logEvent(event: Stripe.Event) {
  const admin = createSupabaseAdminClient()
  const { data: existing } = await admin
    .from("stripe_webhook_events")
    .select("id")
    .eq("id", event.id)
    .maybeSingle()

  if (existing) {
    return false
  }

  const uncheckedAdmin = admin as SupabaseClient<any>
  await uncheckedAdmin.from("stripe_webhook_events").insert({
    id: event.id,
    type: event.type,
    payload: event as unknown as Database["public"]["Tables"]["stripe_webhook_events"]["Insert"]["payload"],
  })

  return true
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

  const inserted = await logEvent(event)
  if (!inserted) {
    return NextResponse.json({ received: true, duplicate: true }, { status: 200 })
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : undefined
      const userId = session.client_reference_id ?? undefined

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
            const periodUnix = (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end ?? null
            return periodUnix ? new Date(periodUnix * 1000).toISOString() : null
          })(),
          metadata: subscription.metadata as Record<string, string> | null,
        })
      }
    }
  } catch (error) {
    console.error("Failed to process Stripe webhook", error)
    return NextResponse.json({ received: true, error: "processing_failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
