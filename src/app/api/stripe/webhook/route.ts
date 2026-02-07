/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import Stripe from "stripe"
import type { SupabaseClient } from "@supabase/supabase-js"

import { env } from "@/lib/env"
import { createSupabaseAdminClient } from "@/lib/supabase"
import { supabaseErrorToError } from "@/lib/supabase/errors"
import {
  ACCELERATOR_MONTHLY_INSTALLMENT_LIMIT,
  ACCELERATOR_PLATFORM_INCLUDED_TRIAL_DAYS,
} from "@/lib/accelerator/billing"
import {
  parseInstallmentCount,
  resolveNextInstallmentProgress,
  shouldRollToOrganizationPlan,
} from "@/lib/accelerator/billing-lifecycle"
import { isElectiveAddOnModuleSlug } from "@/lib/accelerator/elective-modules"
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

  await uncheckedAdmin
    .from("accelerator_purchases")
    .upsert(payload, { onConflict: "stripe_checkout_session_id" })
}

async function upsertElectivePurchase({
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

  await uncheckedAdmin
    .from("elective_purchases")
    .upsert(payload, { onConflict: "user_id,module_slug" })
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

function getCurrentPeriodEndIso(subscription: Stripe.Subscription) {
  const periodUnix = (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end ?? null
  return periodUnix ? new Date(periodUnix * 1000).toISOString() : null
}

async function maybeStartOrganizationSubscription({
  userId,
  customerId,
  idempotencyKey,
  trialPeriodDays,
  context,
}: {
  userId: string
  customerId: string
  idempotencyKey: string
  trialPeriodDays?: number
  context: "accelerator_bundle_one_time" | "accelerator_rollover"
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

  const subscriptionParams: Stripe.SubscriptionCreateParams = {
    customer: customerId,
    items: [{ price: organizationPriceId }],
    metadata: {
      user_id: userId,
      planName: "Organization",
      context,
    },
  }

  if (trialPeriodDays && trialPeriodDays > 0) {
    subscriptionParams.trial_period_days = trialPeriodDays
  }

  const subscription = await stripe.subscriptions.create(subscriptionParams, { idempotencyKey })

  const periodUnix = (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end ?? null
  const currentPeriodEnd = periodUnix ? new Date(periodUnix * 1000).toISOString() : null

  await upsertSubscription({
    userId,
    customerId,
    subscriptionId: subscription.id,
    status: toStatus(subscription.status),
    currentPeriodEnd,
    metadata: { planName: "Organization", context },
  })
}

async function handleAcceleratorMonthlyInstallmentInvoice(invoice: Stripe.Invoice) {
  if (!stripe) return

  const billingReason = invoice.billing_reason ?? ""

  const parentSubscription = invoice.parent?.subscription_details?.subscription
  const subscriptionId =
    typeof parentSubscription === "string"
      ? parentSubscription
      : parentSubscription && typeof parentSubscription === "object" && "id" in parentSubscription
        ? String(parentSubscription.id)
        : null
  if (!subscriptionId) return

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const metadata = subscription.metadata as Record<string, string | undefined>
  const installmentProgress = resolveNextInstallmentProgress({
    billingReason,
    metadata,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    fallbackLimit: ACCELERATOR_MONTHLY_INSTALLMENT_LIMIT,
  })
  if (!installmentProgress.eligible) return

  const userId = extractUserIdFromMetadata(subscription.metadata)
  if (!userId) return

  const { installmentLimit, nextInstallmentsPaid, shouldSetCancelAtPeriodEnd } = installmentProgress

  let effectiveSubscription = subscription
  const needsMetadataUpdate =
    metadata.accelerator_installment_limit !== String(installmentLimit) ||
    metadata.accelerator_installments_paid !== String(nextInstallmentsPaid)

  if (needsMetadataUpdate || shouldSetCancelAtPeriodEnd) {
    effectiveSubscription = await stripe.subscriptions.update(subscription.id, {
      metadata: {
        ...metadata,
        accelerator_installment_limit: String(installmentLimit),
        accelerator_installments_paid: String(nextInstallmentsPaid),
      },
      ...(shouldSetCancelAtPeriodEnd ? { cancel_at_period_end: true } : {}),
    })
  }

  await upsertSubscription({
    userId,
    customerId: typeof effectiveSubscription.customer === "string" ? effectiveSubscription.customer : null,
    subscriptionId: effectiveSubscription.id,
    status: toStatus(effectiveSubscription.status),
    currentPeriodEnd: getCurrentPeriodEndIso(effectiveSubscription),
    metadata: effectiveSubscription.metadata as Record<string, string> | null,
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
          const variant =
            session.metadata?.accelerator_variant === "without_coaching"
              ? "without_coaching"
              : "with_coaching"
          const coachingIncluded =
            session.metadata?.coaching_included != null
              ? session.metadata.coaching_included === "true"
              : variant === "with_coaching"
          await upsertAcceleratorPurchase({
            userId: resolvedUserId,
            checkoutSessionId: session.id,
            paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
            customerId,
            coachingIncluded,
            status: "active",
          })

          if (customerId) {
            await maybeStartOrganizationSubscription({
              userId: resolvedUserId,
              customerId,
              idempotencyKey: `accelerator_bundle_${session.id}`,
              trialPeriodDays: ACCELERATOR_PLATFORM_INCLUDED_TRIAL_DAYS,
              context: "accelerator_bundle_one_time",
            })
          }
        }
      }

      if (session.mode === "payment" && session.metadata?.kind === "elective") {
        const resolvedUserId = userId ?? extractUserIdFromMetadata(session.metadata) ?? undefined
        const moduleSlug = session.metadata?.elective_module_slug ?? ""

        if (resolvedUserId && isElectiveAddOnModuleSlug(moduleSlug)) {
          await upsertElectivePurchase({
            userId: resolvedUserId,
            moduleSlug,
            checkoutSessionId: session.id,
            paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
            customerId: typeof session.customer === "string" ? session.customer : null,
            status: "active",
          })
        }
      }

      if (subscriptionId && userId) {
        await upsertSubscription({
          userId,
          customerId: typeof session.customer === "string" ? session.customer : null,
          subscriptionId,
          status: toStatus(session.status ?? "trialing"),
          metadata:
            session.metadata && Object.keys(session.metadata).length > 0
              ? (session.metadata as Record<string, string>)
              : { planName: session.metadata?.planName ?? null },
        })
      }
    }

    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice
      await handleAcceleratorMonthlyInstallmentInvoice(invoice)
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
          currentPeriodEnd: getCurrentPeriodEndIso(subscription),
          metadata: subscription.metadata as Record<string, string> | null,
        })

        if (
          typeof subscription.customer === "string" &&
          shouldRollToOrganizationPlan({
            eventType: event.type,
            subscriptionStatus: subscription.status,
            metadata: subscription.metadata as Record<string, string | undefined>,
            fallbackLimit: ACCELERATOR_MONTHLY_INSTALLMENT_LIMIT,
          })
        ) {
          await maybeStartOrganizationSubscription({
            userId,
            customerId: subscription.customer,
            idempotencyKey: `accelerator_rollover_${subscription.id}_${event.id}`,
            context: "accelerator_rollover",
          })
        }
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
