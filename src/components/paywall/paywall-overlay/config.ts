import type { PricingPlanTier } from "@/lib/billing/plan-tier"

export const PAYWALL_QUERY_KEYS = [
  "paywall",
  "plan",
  "upgrade",
  "module",
  "source",
  "checkout_error",
  "checkout_detail",
  "checkout_debug",
] as const

type SearchParamsLike = Pick<URLSearchParams, "toString">

export type OverlayTier = {
  id: PricingPlanTier
  eyebrow: string
  title: string
  subtitle: string
  priceLine: string
  priceNote?: string
  featured?: boolean
  defaultBadge?: string
  planName?: "Organization" | "Operations Support"
  features: string[]
}

export type OverlayTierDetails = {
  badge?: string
  note: string
  cta: string | null
}

export const OVERLAY_TIERS: OverlayTier[] = [
  {
    id: "free",
    eyebrow: "The Platform (Free)",
    title: "Individual",
    subtitle: "For founders and early nonprofit teams building core structure and fundability.",
    priceLine: "Free",
    defaultBadge: "Included",
    features: [
      "1 Admin Seat (founder only)",
      "Guided 501(c)(3) formation",
      "Strategic Roadmap (private)",
      "Organizational Profile (private)",
    ],
  },
  {
    id: "organization",
    eyebrow: "The Platform (Growth)",
    title: "Organization",
    subtitle: "For organizations strengthening impact storytelling and growing programs.",
    priceLine: "$20",
    priceNote: "per month",
    featured: true,
    defaultBadge: "Most popular",
    planName: "Organization",
    features: [
      "Everything in Individual",
      "Unlimited Admin & Staff Seats",
      "Asynchronous Accelerator Access",
      "Fiscal Sponsorship Opportunities",
    ],
  },
  {
    id: "operations_support",
    eyebrow: "The Platform (Support)",
    title: "Operations Support",
    subtitle: "For teams that want coaching and hands-on operational support.",
    priceLine: "$58",
    priceNote: "per month",
    planName: "Operations Support",
    features: [
      "Everything in Organization",
      "Monthly 1:1 Coaching",
      "Access to Expert Network",
      "Back-office support options",
    ],
  },
]

export function resolveTierLabel({
  tier,
  currentPlanTier,
}: {
  tier: OverlayTier
  currentPlanTier: PricingPlanTier
}): OverlayTierDetails {
  const isCurrent = tier.id === currentPlanTier
  if (tier.id === "free") {
    return {
      badge: isCurrent ? "Current plan" : tier.defaultBadge,
      note: isCurrent ? "You are currently on the free plan." : "Start free and upgrade anytime.",
      cta: null,
    }
  }

  if (tier.id === "organization") {
    if (isCurrent) {
      return {
        badge: "Current plan",
        note: "Team access and accelerator are active for this workspace.",
        cta: null,
      }
    }
    if (currentPlanTier === "operations_support") {
      return {
        badge: "Downgrade option",
        note: "Switch to Organization at your next renewal with Stripe-managed proration.",
        cta: "Downgrade to Organization",
      }
    }
    return {
      badge: tier.defaultBadge,
      note: "Unlock team workflows and accelerator access.",
      cta: "Upgrade to Organization",
    }
  }

  if (isCurrent) {
    return {
      badge: "Current plan",
      note: "Operations Support is active with expert network access.",
      cta: null,
    }
  }
  if (currentPlanTier === "organization") {
    return {
      badge: "Upgrade option",
      note: "Move to Operations Support for coaching and expanded delivery support.",
      cta: "Upgrade to Operations Support",
    }
  }
  return {
    badge: tier.defaultBadge ?? "Premium",
    note: "Start with full support from day one.",
    cta: "Choose Operations Support",
  }
}

export function getCheckoutErrorMessage(checkoutErrorCode: string | null) {
  switch (checkoutErrorCode) {
    case "missing_price":
      return "Checkout is not configured for this plan yet."
    case "operations_unavailable":
      return "Operations Support checkout is not available right now."
    case "stripe_unavailable":
      return "Stripe is temporarily unavailable. Please try again in a moment."
    case "stripe_auth_error":
      return "Checkout credentials are misconfigured. Please contact support."
    case "price_not_found":
      return "This plan is not linked to a valid Stripe price yet."
    case "stripe_permission_error":
      return "Checkout is blocked by Stripe account permissions."
    case "stripe_invalid_request":
      return "Checkout request was rejected by Stripe."
    case "session_url_missing":
      return "Stripe could not create a checkout link. Please try again."
    case "checkout_failed":
      return "We could not start checkout. Please try again."
    default:
      return null
  }
}

export function getPaywallReasonCopy({
  isOnboardingSource,
  paywallKind,
}: {
  isOnboardingSource: boolean
  paywallKind: string | null
}) {
  if (isOnboardingSource) {
    return "Start on free, finish onboarding, and upgrade when your team is ready."
  }
  if (paywallKind === "organization") {
    return "Team management and collaboration workflows are unlocked on paid plans."
  }
  if (paywallKind === "accelerator") {
    return "Accelerator and guided learning workflows are included with paid plans."
  }
  if (paywallKind === "elective") {
    return "Electives are included with paid plans."
  }
  return "Pick the plan that fits your current stage. You can switch between paid tiers anytime."
}

export function shouldAutoDismissPaywallOverlay({
  currentPlanTier,
  paywallKind,
}: {
  currentPlanTier: PricingPlanTier
  paywallKind: string | null
}) {
  return currentPlanTier !== "free" && Boolean(paywallKind)
}

export function buildDismissedPaywallHref({
  pathname,
  searchParams,
}: {
  pathname: string
  searchParams: SearchParamsLike
}) {
  const next = new URLSearchParams(searchParams.toString())
  for (const key of PAYWALL_QUERY_KEYS) {
    next.delete(key)
  }
  const query = next.toString()
  return query ? `${pathname}?${query}` : pathname
}
