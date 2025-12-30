import type { Metadata } from "next"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { PublicHeader } from "@/components/public/public-header"
import { cn } from "@/lib/utils"
import Check from "lucide-react/dist/esm/icons/check"

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "OpenNFP is the platform for organizations. We get your fundraising ready.",
}

export const runtime = "nodejs"
export const revalidate = 3600

type PlanSection = {
  title: string
  items: string[]
}

type PricingTier = {
  id: string
  name: string
  price: string
  priceNote?: string
  purpose: string
  outcome?: string
  ctaLabel: string
  ctaHref: string
  featured?: boolean
  badge?: string
  sections: PlanSection[]
}

const TIERS: PricingTier[] = [
  {
    id: "tier-1",
    name: "Platform",
    price: "Free",
    purpose: "Help users start their 501(c)(3) non-profit.",
    outcome: "Outcome: Legally exist and able to raise money.",
    ctaLabel: "Get started",
    ctaHref: "/sign-up",
    sections: [
      {
        title: "Guidance on how to start a 501(c)(3)",
        items: ["Register EIN", "Board setup", "501(c)(3) filing", "Fiscal agent (optional)"],
      },
      {
        title: "Platform access",
        items: ["Logo", "Org basics", "Bank account setup"],
      },
    ],
  },
  {
    id: "tier-4",
    name: "Community",
    price: "$58/month",
    purpose: "Ongoing support and community access.",
    ctaLabel: "Get started",
    ctaHref: "/sign-up",
    sections: [
      {
        title: "Includes",
        items: [
          "Accelerator",
          "Strategic roadmap (templates included)",
          "Platform access",
          "Community access: topics in communications, fundraising, strategy",
          "Treasure map pin",
          "Monthly/weekly Zoom calls (ask anything, see others, communicate)",
          "Community meetups",
          "Find board members",
        ],
      },
    ],
  },
  {
    id: "tier-2",
    name: "Accelerator",
    price: "$349",
    priceNote: "One-time",
    purpose: "Add structured accelerator content and planning support.",
    ctaLabel: "Get started",
    ctaHref: "/sign-up",
    sections: [
      {
        title: "Includes",
        items: ["Accelerator videos", "Strategic roadmap"],
      },
    ],
  },
  {
    id: "tier-3",
    name: "Launch",
    price: "$499",
    priceNote: "One-time",
    purpose: "Core offering for launching with support.",
    ctaLabel: "Get started",
    ctaHref: "/sign-up",
    featured: true,
    badge: "Recommended",
    sections: [
      {
        title: "Includes",
        items: ["Everything in Tier 2", "Core offering through T.O.C. (Theory of Change)"],
      },
      {
        title: "Verified & visible to funders",
        items: ["Pilot evaluation", "Budget", "Compliance"],
      },
    ],
  },
]

function CheckBadge({ featured }: { featured?: boolean }) {
  return (
    <span
      className={cn(
        "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px]",
        featured
          ? "border-background/30 bg-background/10 text-background"
          : "border-border/70 bg-muted/50 text-foreground",
      )}
      aria-hidden
    >
      <Check className="h-3 w-3" />
    </span>
  )
}

function TierSection({ title, items, featured }: { title: string; items: string[]; featured?: boolean }) {
  return (
    <div className="space-y-3">
      <p
        className={cn(
          "text-xs font-semibold uppercase tracking-[0.18em]",
          featured ? "text-background/70" : "text-muted-foreground",
        )}
      >
        {title}
      </p>
      <ul className="space-y-2 text-sm">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <CheckBadge featured={featured} />
            <span className={cn(featured ? "text-background/80" : "text-muted-foreground")}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default async function PricingPage() {
  return (
    <main className="relative min-h-screen bg-background">
      <PublicHeader />
      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-16 pt-28 lg:pb-24">
        <section className="mx-auto max-w-3xl text-center">
          <Badge variant="outline" className="mb-4">OpenNFP</Badge>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Pricing for every stage of your nonprofit
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Start free, move into accelerator support, or stay with us for ongoing coaching and community.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-4">
          {TIERS.map((tier) => (
            <Card
              key={tier.id}
              className={cn(
                "flex h-full flex-col rounded-3xl border bg-card/80 shadow-sm",
                tier.featured && "border-foreground/70 bg-foreground text-background shadow-xl",
              )}
            >
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                  <CardTitle className={cn("text-lg font-semibold", tier.featured && "text-background")}>
                    {tier.name}
                  </CardTitle>
                  {tier.badge ? (
                    <Badge
                      variant="secondary"
                      className={cn(
                        "rounded-full text-xs",
                        tier.featured && "bg-background text-foreground",
                      )}
                    >
                      {tier.badge}
                    </Badge>
                  ) : null}
                </div>
                <div className="space-y-1">
                  <CardTitle className={cn("text-4xl font-semibold", tier.featured && "text-background")}>
                    {tier.price}
                  </CardTitle>
                  {tier.priceNote ? (
                    <p
                      className={cn(
                        "text-xs font-semibold uppercase tracking-[0.18em]",
                        tier.featured ? "text-background/60" : "text-muted-foreground",
                      )}
                    >
                      {tier.priceNote}
                    </p>
                  ) : null}
                </div>
                <Separator className={cn("my-1", tier.featured ? "bg-background/30" : "bg-border/70")} />
                <CardDescription className={cn("text-sm text-muted-foreground", tier.featured && "text-background/70")}>
                  {tier.purpose}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-6">
                {tier.sections.map((section) => (
                  <TierSection
                    key={`${tier.id}-${section.title}`}
                    title={section.title}
                    items={section.items}
                    featured={tier.featured}
                  />
                ))}
                {tier.outcome ? (
                  <p className={cn("text-sm font-medium", tier.featured ? "text-background" : "text-foreground")}>
                    {tier.outcome}
                  </p>
                ) : null}
              </CardContent>
              <CardFooter className="mt-auto">
                <Button
                  asChild
                  className={cn(
                    "w-full",
                    tier.featured ? "bg-background text-foreground hover:bg-background/90" : "",
                  )}
                  variant={tier.featured ? "secondary" : "outline"}
                >
                  <Link href={tier.ctaHref}>{tier.ctaLabel}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <Card className="rounded-3xl border bg-card/70 shadow-sm">
            <CardHeader className="space-y-2">
              <CardTitle className="text-lg font-semibold">Electives</CardTitle>
              <CardDescription>Optional curriculum extensions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <CheckBadge />
                $25 per elective module
              </div>
              <div className="flex items-start gap-2">
                <CheckBadge />
                Add to Accelerator or Community tiers
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border bg-card/70 shadow-sm">
            <CardHeader className="space-y-2">
              <CardTitle className="text-lg font-semibold">Coaching</CardTitle>
              <CardDescription>Calendar scheduling with a consultant.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <CheckBadge />
                Launch includes 4 coaching sessions (covers Original Need, Mission, Vision, Theory of Change, Timeline, Readiness)
              </div>
              <div className="flex items-start gap-2">
                <CheckBadge />
                Accelerator: $100 per 45-minute session
              </div>
              <div className="flex items-start gap-2">
                <CheckBadge />
                Community: $75 per 45-minute session
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
