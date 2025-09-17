"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Stripe from "stripe"
import type { SupabaseClient } from "@supabase/supabase-js"

import { createSupabaseServerClient } from "@/lib/supabase"
import { env } from "@/lib/env"
import type { Database } from "@/lib/supabase"

const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null

export async function startCheckout(formData: FormData) {
  const priceIdEntry = formData.get("priceId")
  const priceId = typeof priceIdEntry === "string" ? priceIdEntry : null
  const planNameEntry = formData.get("planName")
  const planName = typeof planNameEntry === "string" ? planNameEntry : undefined

  const supabase: SupabaseClient<Database> = createSupabaseServerClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uncheckedSupabase = supabase as SupabaseClient<any>
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login?redirect=/pricing")
  }

  const requestHeaders = await headers()
  const origin =
    requestHeaders.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

  const userId = session.user.id

  type SubscriptionInsert = Database["public"]["Tables"]["subscriptions"]["Insert"]

  const redirectToDashboard = async (status: Database["public"]["Enums"]["subscription_status"]) => {
    const payload: SubscriptionInsert = {
      user_id: userId,
      stripe_subscription_id: `stub_${Date.now()}`,
      status,
      metadata: planName ? { planName } : null,
    }

    await uncheckedSupabase
      .from("subscriptions")
      .upsert(payload, { onConflict: "stripe_subscription_id" })

    redirect(`/dashboard?subscription=${status}`)
  }

  if (!stripe || !priceId || !priceId.startsWith("price_")) {
    await redirectToDashboard("trialing")
  }

  try {
    const stripeClient = stripe!
    const safePriceId = priceId!
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      allow_promotion_codes: true,
      customer_email: session.user.email ?? undefined,
      line_items: [
        {
          price: safePriceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?cancelled=true`,
    }

    const checkout = await stripeClient.checkout.sessions.create(sessionParams)

    if (!checkout.url) {
      await redirectToDashboard("trialing")
    }

    const checkoutUrl = checkout.url!
    redirect(checkoutUrl)
  } catch (error) {
    console.warn("Unable to start Stripe checkout", error)
    await redirectToDashboard("trialing")
  }
}
