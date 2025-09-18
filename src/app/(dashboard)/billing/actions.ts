"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Stripe from "stripe"


import { env } from "@/lib/env"
import { logger } from "@/lib/logger"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function createBillingPortalSession() {
  const supabase = createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login?redirect=/billing")
  }

  if (!env.STRIPE_SECRET_KEY) {

    return { error: "Billing portal not available yet." }
  }

  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    logger.error("billing_portal_subscription_lookup_failed", error, { userId: session.user.id })
    return { error: "Unable to locate your subscription." }
  }

  const customerId = subscription?.stripe_customer_id
  if (!customerId) {
    return { error: "No Stripe customer linked to this account yet." }
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" })
  const origin = headers().get("origin") ?? "https://coachhouse.local"

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/billing`,
    })

    logger.info("billing_portal_session_created", { userId: session.user.id })

    return { url: portalSession.url }
  } catch (portalError) {
    logger.error("billing_portal_session_failed", portalError, { userId: session.user.id })
    return { error: "We couldn't open the billing portal. Contact support." }

  }
}
