import Link from "next/link"
import ArrowRightIcon from "lucide-react/dist/esm/icons/arrow-right"
import CalendarCheck2Icon from "lucide-react/dist/esm/icons/calendar-check-2"
import CheckCircle2Icon from "lucide-react/dist/esm/icons/check-circle-2"
import EyeIcon from "lucide-react/dist/esm/icons/eye"
import ScaleIcon from "lucide-react/dist/esm/icons/scale"
import ShieldCheckIcon from "lucide-react/dist/esm/icons/shield-check"

import { Button } from "@/components/ui/button"

import {
  MARKETPLACE_RESOURCES,
  marketplaceTypeLabel,
} from "../lib/marketplace-directory"
import type {
  MarketplaceCommunityProfile,
  MarketplaceFilters,
} from "../marketplace-types"
import {
  DocumentationJsonLd,
  DocumentationSurface,
} from "./documentation-surface"
import { MarketplaceCommunity } from "./marketplace/marketplace-community"
import { MarketplaceDirectory } from "./marketplace/marketplace-directory"

const stageGuidance = [
  {
    label: "Exploring",
    question: "Is a new tool necessary?",
    guidance:
      "Define the community need and decision first. Start with public learning resources; avoid collecting data or buying software for an untested operating model.",
  },
  {
    label: "Forming",
    question: "What must exist before adoption?",
    guidance:
      "Confirm authority, legal status, ownership, budget, records, and access. Validate nonprofit eligibility only after the organization can maintain the account.",
  },
  {
    label: "Operating",
    question: "Will the team use it responsibly?",
    guidance:
      "Compare workflow fit, total cost, privacy, security, accessibility, integrations, export, support, and accountable administration with affected people.",
  },
  {
    label: "Growing",
    question: "Can it remain durable at scale?",
    guidance:
      "Review permissions, contract terms, data portability, vendor dependence, staff capacity, change management, and whether consolidation is safer than another system.",
  },
] as const

const reviewRules = [
  {
    icon: EyeIcon,
    title: "Direct evidence",
    copy: "Each catalog claim links to the provider's official page. Secondary roundups are not enough for inclusion.",
  },
  {
    icon: CalendarCheck2Icon,
    title: "Visible freshness",
    copy: "Cards show an exact review date and a recheck date. Time-sensitive access and pricing language stays qualified.",
  },
  {
    icon: ScaleIcon,
    title: "No ranking",
    copy: "Order, shortlist state, and inclusion do not predict fit, quality, safety, results, eligibility, or approval.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Publication control",
    copy: "Community profiles must already be public on Map. Individual coaches require an explicit public-profile model before listing.",
  },
] as const

export function MarketplacePage({
  communityProfiles,
  initialFilters,
}: {
  communityProfiles: MarketplaceCommunityProfile[]
  initialFilters: MarketplaceFilters
}) {
  const pageUrl = "https://coachhouse.app/documentation/marketplace"

  return (
    <DocumentationSurface>
      <DocumentationJsonLd
        value={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "CollectionPage",
              "@id": `${pageUrl}#page`,
              name: "Nonprofit Marketplace",
              description:
                "A source-backed directory of U.S. nonprofit software, discounts, funding resources, learning, coaching, and professional support.",
              url: pageUrl,
              dateModified: "2026-09-03",
              isPartOf: {
                "@type": "WebSite",
                name: "Coach House",
                url: "https://coachhouse.app",
              },
              mainEntity: { "@id": `${pageUrl}#resources` },
            },
            {
              "@type": "ItemList",
              "@id": `${pageUrl}#resources`,
              numberOfItems: MARKETPLACE_RESOURCES.length,
              itemListElement: MARKETPLACE_RESOURCES.map((resource, index) => ({
                "@type": "ListItem",
                position: index + 1,
                item: {
                  "@type": "Service",
                  name: resource.name,
                  description: resource.description,
                  category: marketplaceTypeLabel(resource.type),
                  provider: {
                    "@type": "Organization",
                    name: resource.provider,
                  },
                  url: resource.url,
                  areaServed: resource.geography,
                },
              })),
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Documentation",
                  item: "https://coachhouse.app/documentation",
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Marketplace",
                  item: pageUrl,
                },
              ],
            },
          ],
        }}
      />
      <main
        id="documentation-content"
        className="mx-auto w-full max-w-[1400px] px-5 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16"
      >
        <header className="grid gap-10 border-b pb-12 lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.72fr)] lg:items-end">
          <div>
            <p className="text-muted-foreground text-xs font-semibold tracking-[0.16em] uppercase">
              Resources · United States
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.045em] text-balance sm:text-5xl lg:text-6xl">
              Find nonprofit resources with the evidence attached.
            </h1>
            <p className="text-muted-foreground mt-5 max-w-3xl text-base leading-7 text-pretty sm:text-lg sm:leading-8">
              Search nonprofit software, discounts, funding sources, learning,
              volunteer networks, coaching, and professional support. Every
              listing tells you when it may help, what to verify, and where the
              claim came from.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild className="min-h-11">
                <a href="#directory">
                  Browse {MARKETPLACE_RESOURCES.length} resources
                  <ArrowRightIcon data-icon="inline-end" aria-hidden />
                </a>
              </Button>
              <Button asChild variant="outline" className="min-h-11">
                <a href="#method">Read the review method</a>
              </Button>
            </div>
          </div>
          <div className="bg-zinc-950 p-6 text-zinc-100 sm:p-8 dark:bg-zinc-900">
            <p className="text-xs font-semibold tracking-[0.14em] text-zinc-400 uppercase">
              Before you choose
            </p>
            <p className="mt-4 text-xl leading-7 font-semibold tracking-[-0.02em]">
              A discount is not a requirements document.
            </p>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Name the decision, owner, affected people, operating cost, data,
              accessibility needs, exit path, and approval authority before
              comparing providers.
            </p>
          </div>
        </header>

        <section className="py-12" aria-labelledby="stage-guidance-title">
          <p className="text-muted-foreground text-xs font-semibold tracking-[0.15em] uppercase">
            Stage-specific guidance
          </p>
          <h2
            id="stage-guidance-title"
            className="mt-2 text-3xl font-semibold tracking-[-0.035em]"
          >
            Use a different test at each stage.
          </h2>
          <div className="mt-7 grid border-t sm:grid-cols-2 xl:grid-cols-4">
            {stageGuidance.map((stage, index) => (
              <article
                key={stage.label}
                className="min-h-64 border-r border-b p-5"
              >
                <span className="text-muted-foreground font-mono text-xs">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-6 text-lg font-semibold">{stage.label}</h3>
                <p className="mt-2 text-sm font-medium">{stage.question}</p>
                <p className="text-muted-foreground mt-3 text-sm leading-6">
                  {stage.guidance}
                </p>
              </article>
            ))}
          </div>
        </section>

        <MarketplaceDirectory initialFilters={initialFilters} />

        <section
          id="coaches"
          className="scroll-mt-8 border-t py-12"
          aria-labelledby="coaches-title"
        >
          <div className="grid gap-6 bg-zinc-950 p-6 text-zinc-100 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <p className="text-xs font-semibold tracking-[0.15em] text-zinc-400 uppercase">
                Coaches
              </p>
              <h2
                id="coaches-title"
                className="mt-3 text-3xl font-semibold tracking-[-0.035em]"
              >
                People are not inventory.
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
                Coach House coaching is listed as a service. Individual coaches
                will appear here only after each person has an explicit public
                profile, field-level publication choices, and current
                availability controls. Active internal records are not public
                consent.
              </p>
            </div>
            <Button asChild variant="secondary" className="min-h-11">
              <Link href="/coaching">
                Request coaching
                <ArrowRightIcon data-icon="inline-end" aria-hidden />
              </Link>
            </Button>
          </div>
        </section>

        <MarketplaceCommunity profiles={communityProfiles} />

        <section
          id="method"
          className="scroll-mt-8 border-t py-12"
          aria-labelledby="method-title"
        >
          <p className="text-muted-foreground text-xs font-semibold tracking-[0.15em] uppercase">
            Review method
          </p>
          <h2
            id="method-title"
            className="mt-2 text-3xl font-semibold tracking-[-0.035em]"
          >
            Useful enough to inspect. Never a substitute for diligence.
          </h2>
          <div className="mt-7 grid border-t sm:grid-cols-2">
            {reviewRules.map(({ icon: Icon, title, copy }) => (
              <article key={title} className="border-r border-b p-5 sm:p-6">
                <Icon className="text-muted-foreground size-5" aria-hidden />
                <h3 className="mt-5 font-semibold">{title}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-6">
                  {copy}
                </p>
              </article>
            ))}
          </div>
          <div className="mt-8 border-l-2 pl-5">
            <div className="flex items-center gap-2">
              <CheckCircle2Icon className="size-4" aria-hidden />
              <h3 className="font-semibold">Your final review</h3>
            </div>
            <p className="text-muted-foreground mt-2 max-w-4xl text-sm leading-6">
              Confirm current eligibility, offer terms, fees, payment handling,
              privacy, security, data ownership, accessibility, language,
              integrations, records, insurance, contracting authority, and exit
              requirements with the provider and qualified reviewers. Coach
              House does not receive compensation for these listings and does
              not apply, purchase, approve, rank, or decide for your team.
            </p>
          </div>
        </section>
      </main>
    </DocumentationSurface>
  )
}
