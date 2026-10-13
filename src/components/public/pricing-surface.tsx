import Link from "next/link"
import { Fragment } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PublicHeader } from "@/components/public/public-header"
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
    subtitle:
      "For founders and early nonprofit teams building core structure and fundability from day one.",
    priceLine: "Free",
    ctaLabel: "Get started",
    ctaHref: "/sign-up?plan=individual",
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
    ctaLabel: "Upgrade Organization",
    ctaHref: "/sign-up?plan=organization",
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
    ctaLabel: "Start Operations Support",
    ctaHref: "/sign-up?plan=organization&tier=operations",
    featureHeading: "Everything in Organization, plus",
    features: [
      "Monthly 1:1 Coaching",
      "Access expert network (bookkeeping, grant writing, accounting)",
      "Expanded delivery and operations support",
      "Discounted coaching",
    ],
  },
]

const PLATFORM_TIERS = TIERS

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
  tier1: FeatureState
  tier2: FeatureState
  tier3: FeatureState
}
type FeatureGroup = {
  title: string
  rows: FeatureRow[]
}

const FEATURE_GROUPS: FeatureGroup[] = [
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

const FEATURE_GROUP_ICONS: Record<string, React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = {
  "Platform foundations": Layers,
  "Team + community": Users,
  "Learning + readiness": Sparkles,
  "Operations + delivery support": Rocket,
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
  const operationsSupportPriceId = env.STRIPE_OPERATIONS_SUPPORT_PRICE_ID ?? null
  const canCheckoutOperationsSupport = Boolean(env.STRIPE_SECRET_KEY && operationsSupportPriceId)

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
            Start with Individual for free, upgrade to Organization as your team grows, and scale with Operations
            Support when you need deeper infrastructure.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {PLATFORM_TIERS.map((tier) => {
            const isFormation = tier.id === "formation"
            const isMailtoCta = tier.ctaHref.startsWith("mailto:")
            const isPaidTier = tier.id === "organization" || tier.id === "operations"
            const operationsCheckoutUnavailable =
              tier.id === "operations" && Boolean(env.STRIPE_SECRET_KEY) && !canCheckoutOperationsSupport
            const paidCheckoutUnavailable =
              isPaidTier &&
              ((tier.id === "organization" && !canCheckoutOrganization) ||
                (tier.id === "operations" && !canCheckoutOperationsSupport))
            const embeddedAuthHref =
              tier.id === "formation"
                ? "/?section=signup&source=pricing&tier=individual"
                : tier.id === "operations"
                  ? "/?section=login&source=pricing&tier=operations"
                  : "/?section=login&source=pricing&tier=organization"
            const checkoutHref =
              tier.id === "operations"
                ? "/api/stripe/checkout?plan=operations_support&source=pricing"
                : tier.id === "organization"
                  ? "/api/stripe/checkout?plan=organization&source=pricing"
                  : null

            return (
              <Card
                key={tier.id}
                className={cn(
                  "flex h-full flex-col rounded-3xl border border-border/70",
                  tier.featured && "border-primary/30 ring-1 ring-primary/15 shadow-md",
                )}
              >
                <CardHeader className="space-y-5 p-6">
                  <div className="flex items-center justify-between gap-4">
                    <p
                      className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {tier.eyebrow}
                    </p>
                    {tier.badge ? (
                      <Badge variant="secondary" className="rounded-full text-xs">
                        {tier.badge}
                      </Badge>
                      ) : null}
                  </div>

                  <div className="space-y-3">
                    <CardTitle className="min-h-10 text-3xl font-semibold tracking-tight">
                      {tier.title}
                    </CardTitle>
                    <div className="flex min-h-11 items-end gap-2">
                      <span className="text-4xl font-semibold tracking-tight">{tier.priceLine}</span>
                      {tier.priceNote ? (
                        <span className="pb-1 text-sm font-medium text-muted-foreground">{tier.priceNote}</span>
                      ) : null}
                    </div>
                    <CardDescription className="min-h-20 text-sm leading-relaxed text-muted-foreground">
                      {tier.subtitle}
                    </CardDescription>
                  </div>

                  {isPaidTier && checkoutHref && !paidCheckoutUnavailable ? (
                    <Button
                      asChild
                      className="w-full rounded-xl"
                      variant={isFormation ? "default" : tier.featured ? "default" : "secondary"}
                    >
                      <Link href={checkoutHref} className="flex items-center justify-center">
                        {tier.ctaLabel}
                      </Link>
                    </Button>
                  ) : isEmbedded ? (
                    <Button
                      asChild
                      className="w-full rounded-xl"
                      variant={isFormation ? "default" : tier.featured ? "default" : "secondary"}
                    >
                      <Link href={embeddedAuthHref} className="flex items-center justify-center">
                        {tier.ctaLabel}
                      </Link>
                    </Button>
                  ) : operationsCheckoutUnavailable ? (
                    <Button
                      type="button"
                      disabled
                      className="w-full rounded-xl"
                      variant={tier.featured ? "default" : "secondary"}
                    >
                      Operations plan unavailable
                    </Button>
                  ) : paidCheckoutUnavailable ? (
                    <Button
                      type="button"
                      disabled
                      className="w-full rounded-xl"
                      variant={tier.featured ? "default" : "secondary"}
                    >
                      Checkout unavailable
                    </Button>
                  ) : (
                      <Button
                        asChild
                        className="w-full rounded-xl"
                        variant={isFormation ? "default" : tier.featured ? "default" : "secondary"}
                      >
                        {isMailtoCta ? (
                          <a href={tier.ctaHref} className="flex items-center justify-center">
                            {tier.ctaLabel}
                          </a>
                        ) : (
                          <Link href={tier.ctaHref} className="flex items-center justify-center">
                            {tier.ctaLabel}
                          </Link>
                        )}
                      </Button>
                  )}
                </CardHeader>

                <CardContent className="flex flex-1 flex-col gap-5 px-6 pb-6">
                  <div className="h-px w-full bg-border/70" aria-hidden />
                  <TierFeatures
                    heading={tier.featureHeading}
                    items={tier.features}
                    tone="muted"
                  />
                </CardContent>
              </Card>
            )
          })}
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
            Compare Individual, Organization, and Operations Support at a glance.
          </p>
          <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
            <Button asChild className="rounded-xl">
              <Link href="/sign-up?plan=individual">Get started</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl">
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
                    Operations Support
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
                      {group.rows.map((row, rowIndex) => (
                        <tr key={`${group.title}-${row.label}-${row.labelBadge ?? "none"}-${rowIndex}`} className="border-t border-border/60">
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
                              <FeatureStateIcon state={row.tier1} />
                              <span className="sr-only">{row.tier1}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 bg-foreground/5 dark:bg-background/5">
                            <span className="inline-flex items-center gap-2 text-muted-foreground">
                              <FeatureStateIcon state={row.tier2} />
                              <span className="sr-only">{row.tier2}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-2 text-muted-foreground">
                              <FeatureStateIcon state={row.tier3} />
                              <span className="sr-only">{row.tier3}</span>
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
              <span className="font-semibold text-foreground">Note:</span> Strategic Roadmap is always private and internal.
              Organizational Profile is private on Individual and can be made public on paid tiers. Operations Support
              includes expert network access so teams can hire specialists as needed.
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
              <Button asChild className="rounded-xl px-8">
                <Link href="/sign-up?plan=individual">Get started</Link>
              </Button>
            </div>
          </Card>
        </section>
      </div>
    </main>
  )
}
