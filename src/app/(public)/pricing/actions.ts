"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Stripe from "stripe"

import { env } from "@/lib/env"
import { createSupabaseServerClient } from "@/lib/supabase"
import type { Database } from "@/lib/supabase"

const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null

export async function startCheckout(formData: FormData) {
  const priceIdEntry = formData.get("priceId")
  const priceId = typeof priceIdEntry === "string" ? priceIdEntry : null
  const planNameEntry = formData.get("planName")
  const planName = typeof planNameEntry === "string" ? planNameEntry : undefined

  const supabase = createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!user) {
    redirect("/login?redirect=/pricing")
  }

  const requestHeaders = await headers()
  const origin =
    requestHeaders.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

  const userId = user.id

  type SubscriptionStatus = Database["public"]["Enums"]["subscription_status"]
  type SubscriptionInsert = Database["public"]["Tables"]["subscriptions"]["Insert"]

  const redirectToDashboard = async (status: SubscriptionStatus) => {
    const payload: SubscriptionInsert = {
      user_id: userId,
      stripe_subscription_id: `stub_${Date.now()}`,
      status,
      metadata: planName ? { planName } : null,
    }

    await supabase
      .from("subscriptions" satisfies keyof Database["public"]["Tables"])
      .upsert<SubscriptionInsert>(payload, { onConflict: "stripe_subscription_id" })

    redirect(`/dashboard?subscription=${status}`)
  }

  if (!stripe || !priceId || !priceId.startsWith("price_")) {
    await redirectToDashboard("trialing")
  }

  const safePriceId = priceId as string

  try {
    const stripeClient = stripe!
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      allow_promotion_codes: true,
      client_reference_id: userId,
      customer_email: user.email ?? undefined,
      line_items: [
        {
          price: safePriceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          user_id: userId,
          planName: planName ?? "",
        },
      },
      success_url: `${origin}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?cancelled=true`,
    }

    const checkout = await stripeClient.checkout.sessions.create(sessionParams)

    if (!checkout.url) {
      await redirectToDashboard("trialing")
    }

    redirect(checkout.url!)
  } catch (error) {
    console.warn("Unable to start Stripe checkout", error)
    await redirectToDashboard("trialing")
  }
}
