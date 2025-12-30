import type { Metadata } from "next"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
      {
        title: "Add-ons (optional)",
        items: ["Electives: $25", "Coaching: $100"],
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
        items: ["Everything in Tier 2", "4 coaching sessions", "Core offering through T.O.C. (Theory of Change)"],
      },
      {
        title: "Key coaching topics",
        items: ["Original Need", "Mission, Vision", "Theory of Change", "Timeline", "Readiness"],
      },
      {
        title: "Add-ons",
        items: ["Verified and visible to funders: Pilot evaluation, Budget, Compliance"],
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
      {
        title: "Add-ons",
        items: ["Electives: $25", "Coaching: $125 per 45-minute session"],
      },
    ],
  },
]

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
            <Check
              className={cn("mt-0.5 h-4 w-4", featured ? "text-background" : "text-foreground")}
              aria-hidden
            />
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
      </div>
    </main>
  )
}
