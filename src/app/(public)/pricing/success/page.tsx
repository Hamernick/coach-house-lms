import { redirect } from "next/navigation"
import Stripe from "stripe"

import { env } from "@/lib/env"
import { requireServerSession } from "@/lib/auth"
import type { Database } from "@/lib/supabase"

type SearchParams = Promise<Record<string, string | string[] | undefined>>

const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null

export default async function PricingSuccessPage({
  searchParams,
}: {
  searchParams?: SearchParams
}) {
  const params = searchParams ? await searchParams : {}
  const sessionId = typeof params?.session_id === "string" ? params.session_id : undefined

  const { supabase, session } = await requireServerSession("/pricing/success")

  const userId = session.user.id
  let status: Database["public"]["Enums"]["subscription_status"] = "trialing"
  let subscriptionId: string | undefined
  let currentPeriodEnd: string | null = null
  let planName: string | undefined

  if (stripe && sessionId) {
    try {
      const checkout = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["subscription"],
      })

      const subscription = checkout.subscription as Stripe.Subscription | null
      if (subscription) {
        status = subscription.status as Database["public"]["Enums"]["subscription_status"]
        subscriptionId = subscription.id
        const currentPeriodEndUnix = (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end ?? null
        currentPeriodEnd = currentPeriodEndUnix
          ? new Date(currentPeriodEndUnix * 1000).toISOString()
          : null
        planName = typeof subscription.metadata?.planName === "string" ? subscription.metadata.planName : undefined
      }
    } catch (error) {
      console.warn("Unable to read Stripe checkout session", error)
    }
  }

  type SubscriptionInsert = Database["public"]["Tables"]["subscriptions"]["Insert"]

  const upsertPayload: SubscriptionInsert = {
    user_id: userId,
    stripe_subscription_id: subscriptionId ?? `stub_${Date.now()}`,
    status,
    current_period_end: currentPeriodEnd,
    metadata: planName ? { planName } : null,
  }

  await supabase
    .from("subscriptions" satisfies keyof Database["public"]["Tables"])
    .upsert<SubscriptionInsert>(upsertPayload, { onConflict: "stripe_subscription_id" })

  redirect(`/dashboard?subscription=${status}`)
}
