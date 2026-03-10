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
    id: "free",
    name: "Free",
    amount: 0,
    currency: "usd",
    interval: "month",
    description: "Everything you need to get organized and fundraising-ready.",
    features: [
      "501(c)(3) formation (articles of incorporation, bylaws, basic financial manual)",
      "Core documents",
      "CRM + org chart",
      "Fundraising tools",
      "Brand kit",
      "Public + shareable assets with a donate button",
      "Reports",
    ],
  },
  {
    id: "paid",
    name: "Paid",
    amount: 9900,
    currency: "usd",
    interval: "month",
    description: "Expert guidance, accelerator workflows, and advanced templates.",
    features: [
      "Everything in Free",
      "AI tooling (token limits)",
      "4 expert sessions (45 minutes each)",
      "Accelerator",
      "Verified badge upon completion",
      "Strategic roadmap",
      "Multiple seats (admins + employees)",
      "Advanced templates (board policy, bylaws)",
    ],
    highlight: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    amount: 0,
    currency: "usd",
    interval: "month",
    description: "Everything in Paid plus higher-touch coaching for larger teams.",
    features: [
      "Everything in Paid",
      "AI tooling (higher token limits)",
      "1:1 coaching (3x a month)",
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
