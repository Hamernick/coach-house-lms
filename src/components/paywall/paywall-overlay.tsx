"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import LockIcon from "lucide-react/dist/esm/icons/lock"
import ArrowUpDownIcon from "lucide-react/dist/esm/icons/arrow-up-down"
import CheckIcon from "lucide-react/dist/esm/icons/check"
import SparklesIcon from "lucide-react/dist/esm/icons/sparkles"

import { startCheckout } from "@/app/(public)/pricing/actions"
import { StripePoweredBadge } from "@/components/billing/stripe-powered-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { PricingPlanTier } from "@/lib/billing/plan-tier"
import { cn } from "@/lib/utils"

const PAYWALL_QUERY_KEYS = ["paywall", "plan", "upgrade", "module", "source"] as const

type OverlayTier = {
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

const OVERLAY_TIERS: OverlayTier[] = [
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

type PaywallOverlayProps = {
  currentPlanTier?: PricingPlanTier
}

function resolveTierLabel({
  tier,
  currentPlanTier,
}: {
  tier: OverlayTier
  currentPlanTier: PricingPlanTier
}) {
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

export function PaywallOverlay({ currentPlanTier = "free" }: PaywallOverlayProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const paywallKind = searchParams.get("paywall")
  const source = searchParams.get("source")
  const isOpen = Boolean(paywallKind)
  const isOnboardingSource = source === "onboarding"

  const reasonCopy = (() => {
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
  })()

  const close = () => {
    const next = new URLSearchParams(searchParams.toString())
    for (const key of PAYWALL_QUERY_KEYS) {
      next.delete(key)
    }
    const query = next.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="flex max-h-[92vh] w-[min(1240px,96vw)] max-w-[1240px] flex-col gap-0 overflow-hidden rounded-3xl border border-border/70 p-0 sm:max-w-[1240px]">
        <div className="relative border-b border-border/70 bg-muted/20">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-foreground/8 to-transparent"
            aria-hidden
          />
          <DialogHeader className="relative gap-3 px-5 py-5 pr-12 sm:px-6">
            <DialogTitle className="flex items-center gap-2 text-base">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 bg-background/80">
                <LockIcon className="h-4 w-4" aria-hidden />
              </span>
              {isOnboardingSource ? "Choose your plan" : "Plan management"}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
              {isOnboardingSource
                ? "Optional now. Keep moving on free or choose a paid plan without leaving the workspace."
                : "Upgrade or downgrade between paid tiers in one place."}
            </DialogDescription>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full border border-border/70 bg-background/80">
                Current: {currentPlanTier === "operations_support" ? "Operations Support" : currentPlanTier === "organization" ? "Organization" : "Free"}
              </Badge>
              <Badge variant="secondary" className="rounded-full border border-border/70 bg-background/80">
                <ArrowUpDownIcon className="mr-1 h-3 w-3" aria-hidden />
                Upgrade or downgrade anytime
              </Badge>
            </div>
          </DialogHeader>
        </div>

        <div className="relative min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="space-y-5">
            <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/30 p-3 sm:p-4">
              <SparklesIcon className="mt-0.5 h-4 w-4 shrink-0 text-foreground/70" aria-hidden />
              <p className="text-sm font-medium text-foreground">{reasonCopy}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {OVERLAY_TIERS.map((tier) => {
                const details = resolveTierLabel({ tier, currentPlanTier })

                return (
                  <Card
                    key={tier.id}
                    className={cn(
                      "relative flex h-full flex-col overflow-hidden rounded-2xl border-border/70 bg-card/95 shadow-sm",
                      tier.featured && "border-primary/35 ring-1 ring-primary/20",
                      tier.id === currentPlanTier && "border-foreground/20 ring-1 ring-foreground/10",
                    )}
                  >
                    <div
                      className={cn(
                        "h-1 w-full bg-border/60",
                        tier.featured && "bg-primary/60",
                        tier.id === currentPlanTier && "bg-foreground/45",
                      )}
                      aria-hidden
                    />
                    <CardHeader className="space-y-4 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {tier.eyebrow}
                        </p>
                        {details.badge ? (
                          <Badge variant="secondary" className="rounded-full border border-border/70 bg-muted/40 text-xs">
                            {details.badge}
                          </Badge>
                        ) : null}
                      </div>
                      <div className="space-y-2">
                        <CardTitle className="text-2xl font-semibold tracking-tight">{tier.title}</CardTitle>
                        <div className="flex items-end gap-2">
                          <span className="text-3xl font-semibold tracking-tight">{tier.priceLine}</span>
                          {tier.priceNote ? (
                            <span className="pb-1 text-xs font-medium text-muted-foreground">{tier.priceNote}</span>
                          ) : null}
                        </div>
                        <p className="min-h-12 text-sm text-muted-foreground">{tier.subtitle}</p>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col gap-4 p-5 pt-0">
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {tier.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-foreground/70" aria-hidden />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-auto space-y-2 pt-2">
                        {details.cta && tier.planName ? (
                          <form action={startCheckout} className="w-full">
                            <input type="hidden" name="checkoutMode" value="organization" />
                            <input type="hidden" name="planName" value={tier.planName} />
                            <Button
                              type="submit"
                              className="h-10 w-full rounded-xl"
                              variant={tier.id === "organization" ? "default" : "secondary"}
                            >
                              {details.cta}
                            </Button>
                          </form>
                        ) : (
                          <p className="rounded-xl border border-border/70 bg-muted/35 px-3 py-2 text-center text-xs font-medium text-muted-foreground">
                            {details.note}
                          </p>
                        )}
                        {details.cta ? (
                          <p className="text-xs leading-relaxed text-muted-foreground">{details.note}</p>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 px-5 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <StripePoweredBadge />
            <Button asChild type="button" variant="ghost" className="h-10">
              <Link href="/billing">Open billing settings</Link>
            </Button>
          </div>
          <Button type="button" variant="ghost" onClick={close} className="h-10">
            {isOnboardingSource ? "Not now" : "Close"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
