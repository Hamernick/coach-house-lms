import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import Stripe from "stripe"

import { resolveStripeWebhookRuntimeConfigs } from "@/lib/billing/stripe-runtime"
import { processStripeWebhookEvent } from "./_lib/process-event"
import {
  markWebhookEventFailed,
  markWebhookEventProcessed,
  shouldProcessEvent,
} from "./_lib/persistence"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const runtimeConfigs = resolveStripeWebhookRuntimeConfigs()
  if (runtimeConfigs.length === 0) {
    return NextResponse.json({ ignored: true }, { status: 200 })
  }

  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  let event: Stripe.Event | null = null
  let stripeClient: Stripe | null = null
  let stripeMode: "live" | "test" = "live"
  let organizationPriceId: string | null = null

  for (const config of runtimeConfigs) {
    try {
      event = config.client.webhooks.constructEvent(
        body,
        signature,
        config.webhookSecret!,
      )
      stripeClient = config.client
      stripeMode = config.mode
      organizationPriceId = config.organizationPriceId
      break
    } catch {
      event = null
      stripeClient = null
    }
  }

  if (!event || !stripeClient) {
    console.error("Stripe signature verification failed")
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    const shouldProcess = await shouldProcessEvent(event)
    if (!shouldProcess) {
      return NextResponse.json(
        { received: true, duplicate: true },
        { status: 200 },
      )
    }
  } catch (error) {
    console.error("Stripe webhook idempotency check failed", error)
    return NextResponse.json(
      { received: true, error: "processing_failed" },
      { status: 500 },
    )
  }

  try {
    await processStripeWebhookEvent({
      event,
      stripeClient,
      stripeMode,
      organizationPriceId,
    })
  } catch (error) {
    console.error("Failed to process Stripe webhook", error)
    try {
      await markWebhookEventFailed(event, error)
    } catch (cleanupError) {
      console.error("Unable to cleanup failed webhook lock", cleanupError)
    }
    return NextResponse.json(
      { received: true, error: "processing_failed" },
      { status: 500 },
    )
  }

  try {
    await markWebhookEventProcessed(event)
  } catch (error) {
    console.error("Unable to mark Stripe webhook processed", error)
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
