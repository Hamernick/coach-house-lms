import type { Metadata } from "next"
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

import { startCheckout } from "./actions"

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple pricing for nonprofit founders and teams: start free, upgrade for seats, add the Accelerator when you're ready.",
}

export const runtime = "nodejs"
export const revalidate = 3600

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
    subtitle: "The 9-week playbook to funder-readiness.",
    priceLine: "$499",
    priceNote: "one-time",
    ctaLabel: "Enroll in Accelerator",
    ctaHref: "/sign-up?plan=individual&addon=accelerator",
    featureHeading: "Add-on includes",
    features: [
      "42-Module Curriculum (Lifetime access)",
      "Strategic Templates (Budgets, Narratives)",
      { label: "Roadmap", badge: "Public" },
      "Single User License",
      "Expert Coaching Sessions (Discounted access)",
      "Priority Support",
      "Can be added to Individual or Organization plans",
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
      { label: "Discounted coaching sessions", formation: "not-included", organization: "not-included", accelerator: "included" },
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

export default async function PricingPage() {
  const canCheckoutOrganization = Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_ORGANIZATION_PRICE_ID)
  const canCheckoutAccelerator = Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_ACCELERATOR_PRICE_ID)

  return (
    <main
      data-public-surface="pricing"
      className="relative min-h-screen bg-background pt-px [--background:var(--surface)]"
    >
      <PublicHeader />
      <div className="mx-auto flex w-[min(1000px,92%)] flex-col gap-16 pb-16 pt-24 sm:pt-28 lg:pb-24">
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

        <section>
          <Card className="overflow-hidden rounded-3xl border-2 border-dashed border-primary/30">
            <div className="flex flex-col gap-10 p-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl space-y-5">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{ACCELERATOR_TIER.eyebrow}</p>
                <div className="space-y-3">
                  <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                    {ACCELERATOR_TIER.title}
                  </h2>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-semibold tracking-tight">{ACCELERATOR_TIER.priceLine}</span>
                    {ACCELERATOR_TIER.priceNote ? (
                      <span className="pb-1 text-sm font-medium text-muted-foreground">{ACCELERATOR_TIER.priceNote}</span>
                    ) : null}
                  </div>
                  <p className="text-balance text-sm text-muted-foreground sm:text-base">{ACCELERATOR_TIER.subtitle}</p>
                </div>
                {canCheckoutAccelerator ? (
                  <form action={startCheckout} className="w-full sm:w-fit">
                    <input type="hidden" name="checkoutMode" value="accelerator" />
                    <input type="hidden" name="planName" value="Accelerator" />
                    <input type="hidden" name="priceId" value={env.STRIPE_ACCELERATOR_PRICE_ID ?? ""} />
                    <Button type="submit" className="w-full rounded-full sm:w-fit">
                      {ACCELERATOR_TIER.ctaLabel}
                    </Button>
                  </form>
                ) : (
                  <Button asChild className="w-full rounded-full sm:w-fit">
                    <Link href={ACCELERATOR_TIER.ctaHref}>{ACCELERATOR_TIER.ctaLabel}</Link>
                  </Button>
                )}
              </div>

              <div className="w-full max-w-lg">
                <TierFeatures
                  heading={ACCELERATOR_TIER.featureHeading}
                  items={ACCELERATOR_TIER.features}
                  tone="muted"
                />
              </div>
            </div>
          </Card>
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
