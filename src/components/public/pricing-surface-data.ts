export type PricingTier = {
  id: string
  eyebrow: string
  title: string
  subtitle: string
  priceLine: string
  priceNote?: string
  ctaLabel: string
  ctaHref: string
  featured?: boolean
  badge?: string
  featureHeading: string
  features: Array<string | TierFeature>
}

export type TierFeature = {
  label: string
  badge?: string
  detail?: string
}

const TIERS: PricingTier[] = [
  {
    id: "formation",
    eyebrow: "The Platform (Free)",
    title: "Individual",
    subtitle:
      "For founders and early nonprofit teams building core structure and fundability from day one.",
    priceLine: "Free",
    ctaLabel: "Get started",
    ctaHref: "/?section=signup",
    featureHeading: "Includes",
    features: [
      "1 Admin Seat (founder only)",
      "Organization Profile",
      "Guided 501(c)(3) formation",
      "Strategic Roadmap",
      { label: "Organizational Profile", badge: "Private" },
      "Discord + WhatsApp Community access",
      "Secure & Centralized Document Storage",
    ],
  },
  {
    id: "organization",
    eyebrow: "The Platform (Growth)",
    title: "Organization",
    subtitle:
      "For organizations strengthening impact storytelling and growing real programs through structured learning and collaboration.",
    priceLine: "$20",
    priceNote: "per month",
    ctaLabel: "Get started",
    ctaHref: "/?section=signup",
    featured: true,
    badge: "Recommended",
    featureHeading: "Everything in Individual, plus",
    features: [
      "8 Admin, Staff, and Board Seats",
      { label: "Organizational Profile", badge: "Public" },
      "Accelerator Access",
      "Electives & additional learning",
      "Fiscal Sponsorship Opportunities",
      "Quantitative Fundability Readiness Tracker",
      "Qualitative Through-Line analysis",
      "Weekly members only programming",
      "Board Member Portal",
    ],
  },
  {
    id: "operations",
    eyebrow: "The Platform (Support)",
    title: "Operations Support",
    subtitle:
      "For nonprofits that need ongoing coaching and shared operations support so teams can focus on delivery.",
    priceLine: "$58",
    priceNote: "per month",
    ctaLabel: "Get started",
    ctaHref: "/?section=signup",
    featureHeading: "Everything in Organization, plus",
    features: [
      "Monthly 1:1 Coaching",
      "Access expert network (bookkeeping, grant writing, accounting)",
      "Expanded delivery and operations support",
      "Discounted coaching",
    ],
  },
]

export const PLATFORM_TIERS = TIERS

export type FeatureState = "included" | "not-included" | "na"
export type FeatureRow = {
  label: string
  labelBadge?: string
  tier1: FeatureState
  tier2: FeatureState
  tier3: FeatureState
}
export type FeatureGroup = {
  title: string
  rows: FeatureRow[]
}

export const FEATURE_GROUPS: FeatureGroup[] = [
  {
    title: "Platform foundations",
    rows: [
      { label: "Guided 501(c)(3) formation", tier1: "included", tier2: "included", tier3: "included" },
      { label: "Strategic roadmap", tier1: "included", tier2: "included", tier3: "included" },
      { label: "Organization profile", tier1: "included", tier2: "included", tier3: "included" },
      {
        label: "Organizational profile",
        labelBadge: "Private",
        tier1: "included",
        tier2: "included",
        tier3: "included",
      },
      {
        label: "Organizational profile",
        labelBadge: "Public",
        tier1: "not-included",
        tier2: "included",
        tier3: "included",
      },
      { label: "Secure & centralized document storage", tier1: "included", tier2: "included", tier3: "included" },
    ],
  },
  {
    title: "Team + community",
    rows: [
      { label: "1 Admin Seat (founder only)", tier1: "included", tier2: "not-included", tier3: "not-included" },
      { label: "8 Admin, Staff, and Board Seats", tier1: "not-included", tier2: "included", tier3: "included" },
      { label: "Discord + WhatsApp community access", tier1: "included", tier2: "included", tier3: "included" },
      { label: "Weekly members only programming", tier1: "not-included", tier2: "included", tier3: "included" },
      { label: "Board Member Portal", tier1: "not-included", tier2: "included", tier3: "included" },
    ],
  },
  {
    title: "Learning + readiness",
    rows: [
      { label: "Accelerator access", tier1: "not-included", tier2: "included", tier3: "included" },
      { label: "Electives & additional learning", tier1: "not-included", tier2: "included", tier3: "included" },
      { label: "Fiscal sponsorship opportunities", tier1: "not-included", tier2: "included", tier3: "included" },
      { label: "Quantitative fundability readiness tracker", tier1: "not-included", tier2: "included", tier3: "included" },
      { label: "Qualitative through-line analysis", tier1: "not-included", tier2: "included", tier3: "included" },
    ],
  },
  {
    title: "Operations + delivery support",
    rows: [
      { label: "Monthly 1:1 Coaching", tier1: "not-included", tier2: "not-included", tier3: "included" },
      {
        label: "Access expert network (bookkeeping, grant writing, accounting)",
        tier1: "not-included",
        tier2: "not-included",
        tier3: "included",
      },
      { label: "Expanded delivery and operations support", tier1: "not-included", tier2: "not-included", tier3: "included" },
      { label: "Discounted coaching", tier1: "not-included", tier2: "not-included", tier3: "included" },
    ],
  },
]
