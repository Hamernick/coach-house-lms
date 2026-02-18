"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import Stripe from "stripe"

import { env } from "@/lib/env"
import { requireServerSession } from "@/lib/auth"
import { resolveActiveOrganization } from "@/lib/organization/active-org"
import { resolveTesterMetadata } from "@/lib/devtools/audience"
import type { Database } from "@/lib/supabase"

const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null
const REUSABLE_STRIPE_SUBSCRIPTION_STATUSES = new Set(["trialing", "active", "past_due"])

type SubscriptionStatus = Database["public"]["Enums"]["subscription_status"]
type SubscriptionInsert = Database["public"]["Tables"]["subscriptions"]["Insert"]
type SubscriptionLookupRow = {
  id: string
  stripe_subscription_id: string
  stripe_customer_id: string | null
  status: SubscriptionStatus
  metadata: Record<string, string> | null
}

function toSubscriptionStatus(value: string): SubscriptionStatus {
  const allowed: SubscriptionStatus[] = [
    "trialing",
    "active",
    "past_due",
    "canceled",
    "incomplete",
    "incomplete_expired",
  ]
  return allowed.includes(value as SubscriptionStatus) ? (value as SubscriptionStatus) : "trialing"
}

function redirectCheckoutError({
  planTier,
  code,
  source = "billing",
}: {
  planTier: "organization" | "operations_support"
  code:
    | "stripe_unavailable"
    | "operations_unavailable"
    | "missing_price"
    | "session_url_missing"
    | "checkout_failed"
  source?: string
}): never {
  const params = new URLSearchParams()
  params.set("paywall", "organization")
  params.set("plan", planTier)
  params.set("checkout_error", code)
  params.set("source", source)
  redirect(`/organization?${params.toString()}`)
}

export async function startCheckout(formData: FormData) {
  const priceIdEntry = formData.get("priceId")
  const priceId = typeof priceIdEntry === "string" ? priceIdEntry : null
  const planNameEntry = formData.get("planName")
  const planName = typeof planNameEntry === "string" ? planNameEntry : undefined
  const sourceEntry = formData.get("source")
  const source = typeof sourceEntry === "string" && sourceEntry.trim().length > 0 ? sourceEntry.trim() : "billing"

  const { supabase, session } = await requireServerSession("/pricing")

  const user = session.user
  const metadataTester = resolveTesterMetadata(user.user_metadata ?? null)
  let profileTester = false
  try {
    const { data: testerProfile } = await supabase
      .from("profiles")
      .select("is_tester")
      .eq("id", user.id)
      .maybeSingle<{ is_tester: boolean | null }>()
    profileTester = Boolean(testerProfile?.is_tester)
  } catch {
    profileTester = false
  }
  const forceCheckoutForTester = metadataTester || profileTester

  const requestHeaders = await headers()
  const origin =
    requestHeaders.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

  const userId = user.id
  let orgId = userId
  try {
    const resolved = await resolveActiveOrganization(supabase, userId)
    orgId = resolved.orgId
  } catch {
    orgId = userId
  }

  if (!stripe) {
    redirectCheckoutError({ planTier: "organization", code: "stripe_unavailable", source })
  }

  try {
    const stripeClient = stripe!
    const resolvedPlanName = planName ?? "Organization"
    const planTier = resolvedPlanName.toLowerCase().includes("operations")
      ? "operations_support"
      : "organization"

    const resolvePriceId = (candidate: string | null | undefined) =>
      candidate && candidate.startsWith("price_") ? candidate : null

    const defaultPriceId =
      planTier === "operations_support"
        ? env.STRIPE_OPERATIONS_SUPPORT_PRICE_ID
        : env.STRIPE_ORGANIZATION_PRICE_ID
    const organizationPriceId =
      resolvePriceId(priceId) ??
      resolvePriceId(defaultPriceId)

    if (!organizationPriceId) {
      if (planTier === "operations_support") {
        redirectCheckoutError({ planTier, code: "operations_unavailable", source })
      }
      redirectCheckoutError({ planTier: "organization", code: "missing_price", source })
    }

    let existingSubscription: SubscriptionLookupRow | null = null
    try {
      const baseLookup = supabase
        .from("subscriptions")
        .select("id, stripe_subscription_id, stripe_customer_id, status, metadata")
        .eq("user_id", orgId)
        .in("status", ["active", "trialing", "past_due", "incomplete"])
        .not("stripe_subscription_id", "ilike", "stub_%")
      const orderedLookup =
        typeof (baseLookup as { order?: unknown }).order === "function"
          ? (baseLookup as { order: (column: string, options?: { ascending?: boolean }) => unknown }).order(
              "created_at",
              { ascending: false },
            )
          : baseLookup

      const lookupResult = await (orderedLookup as {
        limit: (count: number) => {
          maybeSingle: <T>() => Promise<{ data: T | null; error: { message?: string } | null }>
        }
      })
        .limit(1)
        .maybeSingle<SubscriptionLookupRow>()

      if (!lookupResult.error) {
        existingSubscription = lookupResult.data ?? null
      }
    } catch {
      existingSubscription = null
    }

    if (!forceCheckoutForTester && existingSubscription?.stripe_subscription_id) {
      let existingStripeSubscription: Stripe.Subscription | null = null
      try {
        existingStripeSubscription = await stripeClient.subscriptions.retrieve(
          existingSubscription.stripe_subscription_id,
        )
      } catch {
        existingStripeSubscription = null
      }

      if (existingStripeSubscription) {
        const stripeStatus = existingStripeSubscription.status
        const canReuseExistingSubscription = REUSABLE_STRIPE_SUBSCRIPTION_STATUSES.has(stripeStatus)

        if (!canReuseExistingSubscription) {
          existingStripeSubscription = null
        }
      }

      if (existingStripeSubscription) {
        const currentItem = existingStripeSubscription.items.data[0]
        const currentPriceId = currentItem?.price?.id ?? null

        if (currentItem?.id && currentPriceId !== organizationPriceId) {
          const updated = await stripeClient.subscriptions.update(existingStripeSubscription.id, {
            cancel_at_period_end: false,
            proration_behavior: "create_prorations",
            items: [{ id: currentItem.id, price: organizationPriceId }],
            metadata: {
              ...existingStripeSubscription.metadata,
              kind: "organization",
              user_id: userId,
              org_user_id: orgId,
              planName: resolvedPlanName,
              plan_tier: planTier,
            },
          })
          const currentPeriodEndUnix =
            (updated as Stripe.Subscription & { current_period_end?: number }).current_period_end ?? null
          const currentPeriodEnd = currentPeriodEndUnix ? new Date(currentPeriodEndUnix * 1000).toISOString() : null
          const updatePayload: SubscriptionInsert = {
            user_id: orgId,
            stripe_customer_id: typeof updated.customer === "string" ? updated.customer : null,
            stripe_subscription_id: updated.id,
            status: toSubscriptionStatus(updated.status),
            current_period_end: currentPeriodEnd,
            metadata: {
              ...(updated.metadata ?? {}),
              planName: resolvedPlanName,
              plan_tier: planTier,
              user_id: userId,
              org_user_id: orgId,
            },
          }
          await supabase
            .from("subscriptions" satisfies keyof Database["public"]["Tables"])
            .upsert(updatePayload, { onConflict: "user_id,stripe_subscription_id" })
          redirect(`/organization?subscription=${toSubscriptionStatus(updated.status)}&plan=${planTier}`)
        }

        if (currentPriceId === organizationPriceId) {
          redirect(`/organization?subscription=${toSubscriptionStatus(existingStripeSubscription.status)}&plan=${planTier}`)
        }
      }
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      allow_promotion_codes: true,
      client_reference_id: userId,
      customer_email: user.email ?? undefined,
      line_items: [
        {
          price: organizationPriceId!,
          quantity: 1,
        },
      ],
      metadata: {
        kind: "organization",
        user_id: userId,
        org_user_id: orgId,
        planName: resolvedPlanName,
        plan_tier: planTier,
      },
      subscription_data: {
        metadata: {
          kind: "organization",
          user_id: userId,
          org_user_id: orgId,
          planName: resolvedPlanName,
          plan_tier: planTier,
        },
      },
      success_url: `${origin}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?cancelled=true`,
    }

    const checkout = await stripeClient.checkout.sessions.create(sessionParams)

    if (!checkout.url) {
      redirectCheckoutError({ planTier, code: "session_url_missing", source })
    }

    redirect(checkout.url!)
  } catch (error) {
    if (
      isRedirectError(error) ||
      (error instanceof Error && error.message.startsWith("redirect:"))
    ) {
      throw error
    }
    console.warn("Unable to start Stripe checkout", error)
    redirectCheckoutError({ planTier: "organization", code: "checkout_failed", source })
  }
}
