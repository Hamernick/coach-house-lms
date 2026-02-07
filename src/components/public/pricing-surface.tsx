import Link from "next/link"
import { Fragment } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PublicHeader } from "@/components/public/public-header"
import { AcceleratorOptionCard } from "@/components/public/accelerator-option-card"
import { ELECTIVE_ADD_ON_MODULES } from "@/lib/accelerator/elective-modules"
import { env } from "@/lib/env"
import { cn } from "@/lib/utils"
import Check from "lucide-react/dist/esm/icons/check"
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right"
import Layers from "lucide-react/dist/esm/icons/layers"
import Minus from "lucide-react/dist/esm/icons/minus"
import Rocket from "lucide-react/dist/esm/icons/rocket"
import Sparkles from "lucide-react/dist/esm/icons/sparkles"
import Tag from "lucide-react/dist/esm/icons/tag"
import Users from "lucide-react/dist/esm/icons/users"
import X from "lucide-react/dist/esm/icons/x"

import { startCheckout } from "@/app/(public)/pricing/actions"

type PricingTier = {
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

type AcceleratorOption = {
  id: "with_coaching" | "without_coaching"
  title: string
  oneTimePriceLine: string
  monthlyPriceLine: string
  subtitle: string
  ctaHref: string
  planName: string
  features: Array<string | TierFeature>
}

type ElectiveOption = {
  slug: (typeof ELECTIVE_ADD_ON_MODULES)[number]["slug"]
  title: string
  priceLine: string
  subtitle: string
  ctaLabel: string
  planName: string
  features: Array<string | TierFeature>
}

type TierFeature = {
  label: string
  badge?: string
  detail?: string
}

const TIERS: PricingTier[] = [
  {
    id: "formation",
    eyebrow: "The Platform (Free)",
    title: "Individual",
    subtitle: "For founders forming their entity.",
    priceLine: "Free",
    ctaLabel: "Get started",
    ctaHref: "/sign-up?plan=individual",
    featureHeading: "Free, forever",
    features: [
      "1 Admin Seat (Founder only)",
      "Guided 501(c)(3) Formation Guidance",
      { label: "Roadmap", badge: "Private" },
      "Resource Map Listing (Get discovered)",
      "Community Access (Discord & WhatsApp)",
      "Stripe Connect (Accept and track donations)",
      "Secure Document Storage",
    ],
  },
  {
    id: "organization",
    eyebrow: "The Platform (Growth)",
    title: "Organization",
    subtitle: "For teams building momentum and funding.",
    priceLine: "$20",
    priceNote: "per month",
    ctaLabel: "Upgrade Organization",
    ctaHref: "/sign-up?plan=organization",
    featured: true,
    badge: "Recommended",
    featureHeading: "Everything in Individual, plus",
    features: [
      "Unlimited Admin & Staff Seats",
      { label: "Board Member Portal", badge: "Coming soon" },
      { label: "Roadmap", badge: "Public" },
      { label: "Fundraising tools and frameworks", badge: "Coming soon" },
      { label: "AI enabled NFP development", badge: "Coming soon" },
      { label: "Fundraising tools", badge: "Coming soon" },
    ],
  },
  {
    id: "accelerator",
    eyebrow: "The Accelerator (Add-On)",
    title: "The Accelerator",
    subtitle: "Choose Base or Coaching based on the support you want.",
    priceLine: "From $349",
    priceNote: "one-time or monthly",
    ctaLabel: "Choose an accelerator path",
    ctaHref: "/sign-up?plan=individual&addon=accelerator",
    featureHeading: "Add-on includes",
    features: [
      "42-Module Curriculum (Lifetime access)",
      "Strategic Templates (Budgets, Narratives)",
      { label: "Roadmap", badge: "Public" },
      "Single User License",
      "Coaching path option (+ coaching includes 4 credits)",
      "Priority Support",
      "Can be added to Individual or Organization plans",
    ],
  },
]

const ACCELERATOR_OPTIONS: AcceleratorOption[] = [
  {
    id: "with_coaching",
    title: "Accelerator Pro",
    oneTimePriceLine: "$499",
    monthlyPriceLine: "$49.90",
    subtitle: "Includes 4 coaching credits, then discounted coaching access.",
    ctaHref: "/sign-up?plan=individual&addon=accelerator&variant=with_coaching",
    planName: "Accelerator Pro",
    features: [
      "42-Module Curriculum (Lifetime access)",
      "Strategic Templates (Budgets, Narratives)",
      "4 included Pro coaching sessions",
      "Pro booking link for sessions 1-4",
      "Automatic switch to discounted coaching link after session 4",
      "Platform access during accelerator term, then $20/month unless canceled",
      "Priority support",
    ],
  },
  {
    id: "without_coaching",
    title: "Accelerator Base",
    oneTimePriceLine: "$349",
    monthlyPriceLine: "$34.90",
    subtitle: "Curriculum and templates only. Coaching is not included.",
    ctaHref: "/sign-up?plan=individual&addon=accelerator&variant=without_coaching",
    planName: "Accelerator Base",
    features: [
      "42-Module Curriculum (Lifetime access)",
      "Strategic Templates (Budgets, Narratives)",
      "Single User License",
      "Coaching available separately at full rate",
      "Platform access during accelerator term, then $20/month unless canceled",
      "Priority support",
    ],
  },
]

const ELECTIVE_OPTIONS: ElectiveOption[] = [
  {
    slug: "retention-and-security",
    title: "Retention and Security",
    priceLine: "$50",
    subtitle: "Retention planning, data handling, and security readiness for your organization.",
    ctaLabel: "Unlock module",
    planName: "Retention and Security (Elective)",
    features: [
      "Lifetime access to this elective module",
      "Formation-compatible workflow",
      "Instant unlock after purchase",
    ],
  },
  {
    slug: "due-diligence",
    title: "Due Diligence",
    priceLine: "$50",
    subtitle: "Readiness checks and compliance prep to keep your nonprofit launch clean.",
    ctaLabel: "Unlock module",
    planName: "Due Diligence (Elective)",
    features: [
      "Lifetime access to this elective module",
      "Formation-compatible workflow",
      "Instant unlock after purchase",
    ],
  },
  {
    slug: "financial-handbook",
    title: "Financial Handbook",
    priceLine: "$50",
    subtitle: "Financial planning structure, controls, and handbook templates for operations.",
    ctaLabel: "Unlock module",
    planName: "Financial Handbook (Elective)",
    features: [
      "Lifetime access to this elective module",
      "Formation-compatible workflow",
      "Instant unlock after purchase",
    ],
  },
]

const PLATFORM_TIERS = TIERS.filter((tier) => tier.id !== "accelerator")
const ACCELERATOR_TIER = TIERS.find((tier) => tier.id === "accelerator")!

type FeatureTone = "muted" | "solid"

function CheckBadge({ tone = "muted" }: { tone?: FeatureTone }) {
  return (
    <span
      className={cn(
        "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px]",
        tone === "solid"
          ? "border-transparent bg-foreground text-primary-foreground"
          : "border-border/70 bg-muted/50 text-foreground",
      )}
      aria-hidden
    >
      <Check className="h-3 w-3" />
    </span>
  )
}

function TierFeatures({
  heading,
  items,
  tone = "muted",
}: {
  heading: string
  items: Array<string | TierFeature>
  tone?: FeatureTone
}) {
  return (
    <div className="space-y-3">
      <p
        className={cn(
          "font-semibold",
          tone === "solid" ? "text-sm text-foreground" : "text-xs uppercase text-muted-foreground",
        )}
      >
        {heading}
      </p>
      <ul className="space-y-2 text-sm">
        {items.map((item) => {
          const feature = typeof item === "string" ? { label: item } : item
          const key =
            typeof item === "string"
              ? item
              : `${feature.label}-${feature.badge ?? ""}-${feature.detail ?? ""}`

          return (
            <li key={key} className="flex items-start gap-2">
              <CheckBadge tone={tone} />
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn(tone === "solid" ? "text-foreground" : "text-muted-foreground")}>
                  {feature.label}
                </span>
                {feature.badge ? (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      feature.badge.toLowerCase() === "coming soon" &&
                        "border border-border/70 bg-muted/60 text-muted-foreground",
                    )}
                  >
                    {feature.badge}
                  </Badge>
                ) : null}
                {feature.detail ? <span className="text-muted-foreground">{feature.detail}</span> : null}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

type FeatureState = "included" | "not-included" | "na"
type FeatureRow = {
  label: string
  labelBadge?: string
  formation: FeatureState
  organization: FeatureState
  accelerator: FeatureState
}
type FeatureGroup = {
  title: string
  rows: FeatureRow[]
}

const FEATURE_GROUPS: FeatureGroup[] = [
  {
    title: "Platform foundations",
    rows: [
      { label: "Guided 501(c)(3) Formation Guidance", formation: "included", organization: "included", accelerator: "na" },
      { label: "Private roadmap (internal planning)", formation: "included", organization: "included", accelerator: "na" },
      { label: "Resource map listing", labelBadge: "Coming soon", formation: "included", organization: "included", accelerator: "na" },
      { label: "Stripe Connect (accept and track donations)", formation: "included", organization: "included", accelerator: "na" },
      { label: "Secure document storage", formation: "included", organization: "included", accelerator: "na" },
    ],
  },
  {
    title: "Team + community",
    rows: [
      { label: "1 Admin Seat (Founder only)", formation: "included", organization: "na", accelerator: "na" },
      { label: "Unlimited admin + staff seats", formation: "not-included", organization: "included", accelerator: "na" },
      { label: "Board member portal", formation: "not-included", organization: "included", accelerator: "na" },
      { label: "Shareable public roadmap", formation: "not-included", organization: "included", accelerator: "na" },
      { label: "Community access (Discord + WhatsApp)", formation: "included", organization: "included", accelerator: "na" },
    ],
  },
  {
    title: "AI + fundraising tools",
    rows: [
      { label: "AI enabled NFP development", labelBadge: "Coming soon", formation: "not-included", organization: "included", accelerator: "na" },
      { label: "Fundraising tools", labelBadge: "Coming soon", formation: "not-included", organization: "included", accelerator: "na" },
    ],
  },
  {
    title: "Accelerator add-on",
    rows: [
      { label: "42-module curriculum (lifetime access)", formation: "not-included", organization: "not-included", accelerator: "included" },
      { label: "Strategic templates (budgets, narratives)", formation: "not-included", organization: "not-included", accelerator: "included" },
      { label: "Single-user license", formation: "not-included", organization: "not-included", accelerator: "included" },
      { label: "4 included coaching sessions on Pro tier", formation: "not-included", organization: "not-included", accelerator: "included" },
      {
        label: "Pro booking flow (first 4 included, then discounted link)",
        labelBadge: "Pro only",
        formation: "not-included",
        organization: "not-included",
        accelerator: "included",
      },
      {
        label: "Platform continuation after accelerator term ($20/month unless canceled)",
        formation: "not-included",
        organization: "not-included",
        accelerator: "included",
      },
      { label: "Priority support", formation: "not-included", organization: "not-included", accelerator: "included" },
    ],
  },
]

const FEATURE_GROUP_ICONS: Record<string, React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = {
  "Platform foundations": Layers,
  "Team + community": Users,
  "AI + fundraising tools": Sparkles,
  "Accelerator add-on": Rocket,
}

function FeatureStateIcon({ state, featured }: { state: FeatureState; featured?: boolean }) {
  if (state === "included") {
    return <Check className={cn("h-4 w-4", featured ? "text-background" : "text-foreground")} aria-hidden />
  }
  if (state === "na") {
    return <Minus className={cn("h-4 w-4", featured ? "text-background/50" : "text-muted-foreground")} aria-hidden />
  }
  return <X className={cn("h-4 w-4", featured ? "text-background/50" : "text-muted-foreground")} aria-hidden />
}

type PricingSurfaceProps = {
  embedded?: boolean
}

export async function PricingSurface({ embedded = false }: PricingSurfaceProps = {}) {
  const isEmbedded = embedded
  const canCheckoutOrganization = Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_ORGANIZATION_PRICE_ID)
  const acceleratorWithCoachingPriceId =
    env.STRIPE_ACCELERATOR_WITH_COACHING_PRICE_ID ?? env.STRIPE_ACCELERATOR_PRICE_ID
  const acceleratorWithoutCoachingPriceId = env.STRIPE_ACCELERATOR_WITHOUT_COACHING_PRICE_ID
  const acceleratorWithCoachingMonthlyPriceId = env.STRIPE_ACCELERATOR_WITH_COACHING_MONTHLY_PRICE_ID
  const acceleratorWithoutCoachingMonthlyPriceId = env.STRIPE_ACCELERATOR_WITHOUT_COACHING_MONTHLY_PRICE_ID
  const canCheckoutAcceleratorWithCoaching = Boolean(env.STRIPE_SECRET_KEY && acceleratorWithCoachingPriceId)
  const canCheckoutAcceleratorWithoutCoaching = Boolean(env.STRIPE_SECRET_KEY && acceleratorWithoutCoachingPriceId)
  const canCheckoutAcceleratorWithCoachingMonthly = Boolean(
    env.STRIPE_SECRET_KEY && acceleratorWithCoachingMonthlyPriceId,
  )
  const canCheckoutAcceleratorWithoutCoachingMonthly = Boolean(
    env.STRIPE_SECRET_KEY && acceleratorWithoutCoachingMonthlyPriceId,
  )
  const electivePriceIds: Record<ElectiveOption["slug"], string> = {
    "retention-and-security": env.STRIPE_ELECTIVE_RETENTION_AND_SECURITY_PRICE_ID ?? "",
    "due-diligence": env.STRIPE_ELECTIVE_DUE_DILIGENCE_PRICE_ID ?? "",
    "financial-handbook": env.STRIPE_ELECTIVE_FINANCIAL_HANDBOOK_PRICE_ID ?? "",
  }

  return (
    <main
      data-public-surface="pricing"
      className={cn(
        "relative bg-background pt-px [--background:var(--surface)]",
        isEmbedded ? "min-h-full" : "min-h-screen",
      )}
    >
      {isEmbedded ? null : <PublicHeader />}
      <div
        className={cn(
          "mx-auto flex w-[min(1000px,92%)] flex-col gap-16 pb-16 lg:pb-24",
          isEmbedded ? "pt-8 sm:pt-10" : "pt-24 sm:pt-28",
        )}
      >
        <section className="mx-auto max-w-3xl text-center">
          <Badge
            variant="secondary"
            className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-medium"
          >
            <Tag className="h-3.5 w-3.5" aria-hidden />
            Pricing
          </Badge>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Simple pricing
            <br />
            for nonprofit builders
          </h1>
          <p className="mt-5 text-balance text-base text-muted-foreground sm:text-lg">
            Start free to form your nonprofit, upgrade when your team grows, and add the Accelerator when you’re ready
            to become funder-ready.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          {PLATFORM_TIERS.map((tier) => {
            const isFormation = tier.id === "formation"

            return (
              <Card
                key={tier.id}
                className={cn(
                  "flex h-full flex-col rounded-3xl border border-border/70",
                  tier.featured && "border-primary/30 ring-1 ring-primary/15 shadow-md",
                )}
              >
                <CardHeader className={cn("p-6", isFormation ? "space-y-6" : "space-y-5")}>
                  <div className="flex items-center justify-between gap-4">
                  <p
                    className={cn(
                        "font-semibold",
                        isFormation ? "text-sm text-foreground" : "text-xs uppercase text-muted-foreground",
                      )}
                  >
                    {tier.eyebrow}
                  </p>
                    {tier.badge ? (
                      <Badge variant="secondary" className="rounded-full text-xs">
                        {tier.badge}
                      </Badge>
                    ) : null}
                  </div>

                  {isFormation ? (
                    <div className="space-y-3">
                      <CardTitle className="text-4xl font-semibold tracking-tight">{tier.title}</CardTitle>
                      <p className="text-sm font-medium text-muted-foreground">{tier.priceLine}</p>
                      <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                        {tier.subtitle}
                      </CardDescription>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <CardTitle className="text-xl font-semibold tracking-tight">{tier.title}</CardTitle>
                      <div className="flex items-end gap-2">
                        <span className="text-4xl font-semibold tracking-tight">{tier.priceLine}</span>
                        {tier.priceNote ? (
                          <span className="pb-1 text-sm font-medium text-muted-foreground">{tier.priceNote}</span>
                        ) : null}
                      </div>
                      <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                        {tier.subtitle}
                      </CardDescription>
                    </div>
                  )}

                  {tier.id === "organization" && canCheckoutOrganization ? (
                    <form action={startCheckout} className="w-full">
                      <input type="hidden" name="checkoutMode" value="organization" />
                      <input type="hidden" name="planName" value="Organization" />
                      <input type="hidden" name="priceId" value={env.STRIPE_ORGANIZATION_PRICE_ID ?? ""} />
                      <Button
                        type="submit"
                        className={cn("w-full", isFormation ? "rounded-xl" : "rounded-full")}
                        variant={isFormation ? "default" : tier.featured ? "default" : "secondary"}
                      >
                        <span>{tier.ctaLabel}</span>
                      </Button>
                    </form>
                  ) : (
                    <Button
                      asChild
                      className={cn("w-full", isFormation ? "rounded-xl" : "rounded-full")}
                      variant={isFormation ? "default" : tier.featured ? "default" : "secondary"}
                    >
                      <Link href={tier.ctaHref} className="flex items-center justify-center gap-2">
                        <span>{tier.ctaLabel}</span>
                        {isFormation ? <ChevronRight className="h-4 w-4" aria-hidden /> : null}
                      </Link>
                    </Button>
                  )}
                </CardHeader>

                <CardContent className="flex flex-1 flex-col gap-5 px-6 pb-6">
                  {isFormation ? (
                    <div className="h-px w-full border-t border-dashed border-border/80" aria-hidden />
                  ) : (
                    <div className="h-px w-full bg-border/70" aria-hidden />
                  )}
                  <TierFeatures
                    heading={tier.featureHeading}
                    items={tier.features}
                    tone={isFormation ? "solid" : "muted"}
                  />
                </CardContent>
              </Card>
            )
          })}
        </section>

        <section className="space-y-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase text-muted-foreground">{ACCELERATOR_TIER.eyebrow}</p>
            <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              {ACCELERATOR_TIER.title}
            </h2>
            <p className="mt-3 text-balance text-sm text-muted-foreground sm:text-base">{ACCELERATOR_TIER.subtitle}</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {ACCELERATOR_OPTIONS.map((option) => {
              const canCheckoutOneTime =
                option.id === "with_coaching"
                  ? canCheckoutAcceleratorWithCoaching
                  : canCheckoutAcceleratorWithoutCoaching
              const optionOneTimePriceId =
                option.id === "with_coaching"
                  ? acceleratorWithCoachingPriceId ?? ""
                  : acceleratorWithoutCoachingPriceId ?? ""
              const canCheckoutMonthly =
                option.id === "with_coaching"
                  ? canCheckoutAcceleratorWithCoachingMonthly
                  : canCheckoutAcceleratorWithoutCoachingMonthly
              const optionMonthlyPriceId =
                option.id === "with_coaching"
                  ? acceleratorWithCoachingMonthlyPriceId ?? ""
                  : acceleratorWithoutCoachingMonthlyPriceId ?? ""
              const isCoachingOption = option.id === "with_coaching"

              return (
                <AcceleratorOptionCard
                  key={option.id}
                  option={option}
                  featured={isCoachingOption}
                  canCheckoutOneTime={canCheckoutOneTime}
                  optionOneTimePriceId={optionOneTimePriceId}
                  canCheckoutMonthly={canCheckoutMonthly}
                  optionMonthlyPriceId={optionMonthlyPriceId}
                />
              )
            })}
          </div>
        </section>

        <section className="space-y-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Elective add-ons</p>
            <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Buy electives only</h2>
            <p className="mt-3 text-balance text-sm text-muted-foreground sm:text-base">
              Formation stays free with Naming your NFP, NFP Registration, and Filing 1023. Electives are $50 each.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {ELECTIVE_OPTIONS.map((option) => {
              const optionPriceId = electivePriceIds[option.slug]
              const canCheckoutOption = Boolean(env.STRIPE_SECRET_KEY && optionPriceId)

              return (
                <Card key={option.slug} className="flex h-full flex-col rounded-3xl border border-border/70">
                  <CardHeader className="space-y-4 p-6">
                    <div className="space-y-2">
                      <CardTitle className="text-xl font-semibold tracking-tight">{option.title}</CardTitle>
                      <div className="flex items-end gap-2">
                        <span className="text-3xl font-semibold tracking-tight">{option.priceLine}</span>
                        <span className="pb-1 text-sm font-medium text-muted-foreground">one-time</span>
                      </div>
                      <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                        {option.subtitle}
                      </CardDescription>
                    </div>
                    {canCheckoutOption ? (
                      <form action={startCheckout} className="w-full">
                        <input type="hidden" name="checkoutMode" value="elective" />
                        <input type="hidden" name="electiveModuleSlug" value={option.slug} />
                        <input type="hidden" name="planName" value={option.planName} />
                        <input type="hidden" name="priceId" value={optionPriceId} />
                        <Button type="submit" variant="outline" className="w-full rounded-xl">
                          {option.ctaLabel}
                        </Button>
                      </form>
                    ) : (
                      <Button asChild variant="outline" className="w-full rounded-xl">
                        <Link href="/sign-up?plan=individual&addon=elective">{option.ctaLabel}</Link>
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-5 px-6 pb-6">
                    <div className="h-px w-full bg-border/70" aria-hidden />
                    <TierFeatures heading="Includes" items={option.features} tone="muted" />
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        <section className="mx-auto max-w-3xl text-center">
          <Badge
            variant="secondary"
            className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-medium"
          >
            Features
          </Badge>
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Feature breakdown</h2>
          <p className="mt-4 text-balance text-sm text-muted-foreground sm:text-base">
            Compare Individual vs Organization, and see what’s included when you add the Accelerator.
          </p>
          <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
            <Button asChild className="rounded-full">
              <Link href="/sign-up?plan=individual">Get started</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <a href="mailto:contact@coachhousesolutions.org?subject=Coach%20House%20Features">Talk to us</a>
            </Button>
          </div>
        </section>

        <Card className="rounded-3xl border-border/70">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] border-collapse text-sm text-left [&_th]:text-left [&_td]:text-left">
              <thead>
                <tr className="text-left">
                  <th scope="col" className="px-6 py-4 text-xs font-semibold uppercase text-muted-foreground">
                    Features
                  </th>
                  <th scope="col" className="px-6 py-4 text-xs font-semibold uppercase text-muted-foreground">
                    Individual
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-xs font-semibold uppercase text-foreground bg-foreground/5 dark:bg-background/5"
                  >
                    Organization
                  </th>
                  <th scope="col" className="px-6 py-4 text-xs font-semibold uppercase text-muted-foreground">
                    Accelerator (Add-on)
                  </th>
                </tr>
              </thead>
              <tbody>
                {FEATURE_GROUPS.map((group) => {
                  const Icon = FEATURE_GROUP_ICONS[group.title]

                  return (
                    <Fragment key={group.title}>
                      <tr>
                        <th
                          scope="rowgroup"
                          colSpan={4}
                          className="px-6 py-4 align-middle text-xs font-semibold uppercase text-muted-foreground bg-foreground/5 dark:bg-background/5"
                        >
                          <span className="inline-flex items-center gap-2">
                            {Icon ? <Icon className="h-4 w-4 shrink-0" aria-hidden /> : null}
                            <span className="leading-none">{group.title}</span>
                          </span>
                        </th>
                      </tr>
                      {group.rows.map((row) => (
                        <tr key={`${group.title}-${row.label}`} className="border-t border-border/60">
                          <th scope="row" className="px-6 py-4 font-medium text-foreground">
                            <span className="inline-flex flex-wrap items-center gap-2">
                              <span>{row.label}</span>
                              {row.labelBadge ? (
                                <Badge
                                  variant="secondary"
                                  className="rounded-full border border-border/70 bg-muted/60 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground"
                                >
                                  {row.labelBadge}
                                </Badge>
                              ) : null}
                            </span>
                          </th>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-2 text-muted-foreground">
                              <FeatureStateIcon state={row.formation} />
                              <span className="sr-only">{row.formation}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 bg-foreground/5 dark:bg-background/5">
                            <span className="inline-flex items-center gap-2 text-muted-foreground">
                              <FeatureStateIcon state={row.organization} />
                              <span className="sr-only">{row.organization}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-2 text-muted-foreground">
                              <FeatureStateIcon state={row.accelerator} />
                              <span className="sr-only">{row.accelerator}</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-6 py-4 text-xs text-muted-foreground">
            <p>
              <span className="font-semibold text-foreground">Note:</span> The Accelerator is an add-on and can be
              purchased alongside Individual or Organization.
            </p>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-foreground" aria-hidden /> Included
              </span>
              <span className="inline-flex items-center gap-2">
                <X className="h-4 w-4 text-muted-foreground" aria-hidden /> Not included
              </span>
              <span className="inline-flex items-center gap-2">
                <Minus className="h-4 w-4 text-muted-foreground" aria-hidden /> Not applicable
              </span>
            </div>
          </div>
        </Card>

        <section>
          <Card className="relative overflow-hidden rounded-3xl border border-border/70">
            <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 px-8 py-14 text-center">
              <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                Ready to start building?
              </h2>
              <Button asChild className="rounded-full px-8">
                <Link href="/sign-up?plan=individual">Get started</Link>
              </Button>
            </div>
          </Card>
        </section>
      </div>
    </main>
  )
}
