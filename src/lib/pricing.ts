import Stripe from "stripe"

import { env } from "@/lib/env"

export type PricingPlan = {
  id: string
  name: string
  amount: number
  currency: string
  interval: string
  description?: string | null
  features: string[]
  highlight?: boolean
}

const FALLBACK_PLANS: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    amount: 2900,
    currency: "usd",
    interval: "month",
    description: "Launch your first cohort with up to 50 learners.",
    features: [
      "Unlimited public lessons",
      "Email-based support",
      "Stripe test mode",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    amount: 7900,
    currency: "usd",
    interval: "month",
    description: "Everything you need to scale classes and automate billing.",
    features: [
      "Automated enrollment rules",
      "Supabase row-level security presets",
      "Priority support & onboarding",
    ],
    highlight: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    amount: 0,
    currency: "usd",
    interval: "month",
    description: "Dedicated success manager, custom SLAs, and enterprise compliance.",
    features: [
      "Single sign-on (SSO)",
      "Enterprise-grade observability",
      "Custom rollout & migrations",
    ],
  },
]

const stripeClient = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY)
  : null

export async function getPricingPlans(): Promise<PricingPlan[]> {
  if (!stripeClient) {
    return FALLBACK_PLANS
  }

  try {
    const prices = await stripeClient.prices.list({
      active: true,
      type: "recurring",
      expand: ["data.product"],
      limit: 10,
    })

    const plans: PricingPlan[] = prices.data
      .filter((price) => price.unit_amount && price.currency && price.recurring)
      .map((price) => {
        const product = price.product as Stripe.Product | null
        const featureMetadata = product?.metadata?.features ?? ""
        const features = featureMetadata
          ? featureMetadata.split("|").map((entry) => entry.trim()).filter(Boolean)
          : []

        return {
          id: price.id,
          name: price.nickname || product?.name || "Monthly",
          amount: price.unit_amount ?? 0,
          currency: price.currency,
          interval: price.recurring?.interval ?? "month",
          description: product?.description ?? null,
          features,
          highlight: product?.metadata?.highlight === "true",
        }
      })
      .sort((a, b) => a.amount - b.amount)

    if (plans.length === 0) {
      return FALLBACK_PLANS
    }

    return plans
  } catch (error) {
    console.warn("Failed to load Stripe pricing, falling back to defaults", error)
    return FALLBACK_PLANS
  }
}
