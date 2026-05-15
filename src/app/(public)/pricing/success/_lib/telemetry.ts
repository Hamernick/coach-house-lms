import type Stripe from "stripe"

import { trackUserJourneyMilestone } from "@/lib/user-journey"

import { resolveSuccessfulCheckoutPlanTier } from "./onboarding-return"

type SuccessfulSubscriptionCheckoutInput = {
  userId: string
  orgId: string
  checkout: Stripe.Checkout.Session
  subscriptionId: string
  subscriptionStatus: string
  planTier: string
  stripeMode: string
  kind: string | null
  redirectTarget: string | null
}

type SuccessfulCheckoutWithoutSubscriptionInput = {
  userId: string
  checkout: Stripe.Checkout.Session
  stripeMode: string
  redirectTarget: string | null
}

export async function trackSuccessfulSubscriptionCheckout({
  userId,
  orgId,
  checkout,
  subscriptionId,
  subscriptionStatus,
  planTier,
  stripeMode,
  kind,
  redirectTarget,
}: SuccessfulSubscriptionCheckoutInput) {
  await trackUserJourneyMilestone({
    userId,
    orgId,
    eventName: "checkout_completed",
    journey: "paid_builder",
    source: "pricing_success_page",
    surface: "pricing_success",
    planTier,
    checkpoint: "paid_plan_confirmed",
    metadata: {
      checkoutSessionId: checkout.id,
      subscriptionId,
      subscriptionStatus,
      checkoutContext: checkout.metadata?.context ?? null,
      stripeMode,
      kind,
      hasRedirectTarget: Boolean(redirectTarget),
    },
  })
}

export async function trackSuccessfulCheckoutWithoutSubscription({
  userId,
  checkout,
  stripeMode,
  redirectTarget,
}: SuccessfulCheckoutWithoutSubscriptionInput) {
  const planTier = resolveSuccessfulCheckoutPlanTier(checkout)
  const orgId =
    typeof checkout.metadata?.org_user_id === "string" && checkout.metadata.org_user_id.length > 0
      ? checkout.metadata.org_user_id
      : userId

  await trackUserJourneyMilestone({
    userId,
    orgId,
    eventName: "checkout_completed",
    journey: "paid_builder",
    source: "pricing_success_page",
    surface: "pricing_success",
    planTier,
    checkpoint: "paid_plan_confirmed",
    metadata: {
      checkoutSessionId: checkout.id,
      checkoutStatus: checkout.status ?? null,
      paymentStatus: checkout.payment_status ?? null,
      checkoutContext: checkout.metadata?.context ?? null,
      subscriptionAvailable: false,
      stripeMode,
      hasRedirectTarget: Boolean(redirectTarget),
    },
  })

  return planTier
}
