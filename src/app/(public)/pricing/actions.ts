"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Stripe from "stripe"

import { env } from "@/lib/env"
import { requireServerSession } from "@/lib/auth"
import type { Database } from "@/lib/supabase"

const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null

type CheckoutMode = "organization" | "accelerator_bundle"

export async function startCheckout(formData: FormData) {
  const checkoutModeEntry = formData.get("checkoutMode")
  const checkoutMode = typeof checkoutModeEntry === "string" ? (checkoutModeEntry as CheckoutMode) : "organization"

  const priceIdEntry = formData.get("priceId")
  const priceId = typeof priceIdEntry === "string" ? priceIdEntry : null
  const planNameEntry = formData.get("planName")
  const planName = typeof planNameEntry === "string" ? planNameEntry : undefined

  const { supabase, session } = await requireServerSession("/pricing")

  const user = session.user

  const requestHeaders = await headers()
  const origin =
    requestHeaders.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

  const userId = user.id

  type SubscriptionStatus = Database["public"]["Enums"]["subscription_status"]
  type SubscriptionInsert = Database["public"]["Tables"]["subscriptions"]["Insert"]

  const redirectToApp = async (status: SubscriptionStatus) => {
    const resolvedPlanName =
      planName ??
      (checkoutMode === "accelerator_bundle" ? "Accelerator bundle" : "Organization")

    const payload: SubscriptionInsert = {
      user_id: userId,
      stripe_subscription_id: `stub_${Date.now()}`,
      status,
      metadata: resolvedPlanName ? { planName: resolvedPlanName } : null,
    }

    await supabase
      .from("subscriptions" satisfies keyof Database["public"]["Tables"])
      .upsert<SubscriptionInsert>(payload, { onConflict: "stripe_subscription_id" })

    redirect(`/my-organization?subscription=${status}`)
  }

  if (!stripe) {
    await redirectToApp("trialing")
  }

  try {
    const stripeClient = stripe!
    const resolvedPlanName =
      planName ??
      (checkoutMode === "accelerator_bundle" ? "Accelerator bundle" : "Organization")

    const resolvePriceId = (candidate: string | null | undefined) =>
      candidate && candidate.startsWith("price_") ? candidate : null

    const organizationPriceId = resolvePriceId(priceId) ?? resolvePriceId(env.STRIPE_ORGANIZATION_PRICE_ID)
    const acceleratorPriceId = resolvePriceId(env.STRIPE_ACCELERATOR_PRICE_ID)

    if (checkoutMode === "accelerator_bundle") {
      if (!organizationPriceId || !acceleratorPriceId) {
        await redirectToApp("trialing")
      }

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: "subscription",
        allow_promotion_codes: true,
        client_reference_id: userId,
        customer_email: user.email ?? undefined,
        line_items: [
          { price: organizationPriceId!, quantity: 1 },
          { price: acceleratorPriceId!, quantity: 1 },
        ],
        subscription_data: {
          trial_period_days: 30,
          metadata: {
            user_id: userId,
            planName: resolvedPlanName,
          },
        },
        success_url: `${origin}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/pricing?cancelled=true`,
      }

      const checkout = await stripeClient.checkout.sessions.create(sessionParams)

      if (!checkout.url) {
        await redirectToApp("trialing")
      }

      redirect(checkout.url!)
    }

    if (!organizationPriceId) {
      await redirectToApp("trialing")
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
      subscription_data: {
        metadata: {
          user_id: userId,
          planName: resolvedPlanName,
        },
      },
      success_url: `${origin}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?cancelled=true`,
    }

    const checkout = await stripeClient.checkout.sessions.create(sessionParams)

    if (!checkout.url) {
      await redirectToApp("trialing")
    }

    redirect(checkout.url!)
  } catch (error) {
    console.warn("Unable to start Stripe checkout", error)
    await redirectToApp("trialing")
  }
}
