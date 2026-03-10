"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import ArrowUpDownIcon from "lucide-react/dist/esm/icons/arrow-up-down"
import LockIcon from "lucide-react/dist/esm/icons/lock"
import SparklesIcon from "lucide-react/dist/esm/icons/sparkles"

import { StripePoweredBadge } from "@/components/billing/stripe-powered-badge"
import { PAYWALL_QUERY_KEYS, OVERLAY_TIERS, getCheckoutErrorMessage, getPaywallReasonCopy } from "@/components/paywall/paywall-overlay/config"
import { PaywallTierCard } from "@/components/paywall/paywall-overlay/paywall-tier-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { PricingPlanTier } from "@/lib/billing/plan-tier"

type PaywallOverlayProps = {
  currentPlanTier?: PricingPlanTier
}

export function PaywallOverlay({ currentPlanTier = "free" }: PaywallOverlayProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const paywallKind = searchParams.get("paywall")
  const source = searchParams.get("source")
  const isOpen = Boolean(paywallKind)
  const isOnboardingSource = source === "onboarding"
  const checkoutErrorCode = searchParams.get("checkout_error")
  const checkoutErrorDetail = searchParams.get("checkout_detail")
  const checkoutErrorDebug = searchParams.get("checkout_debug")
  const checkoutErrorMessage = getCheckoutErrorMessage(checkoutErrorCode)
  const reasonCopy = getPaywallReasonCopy({ isOnboardingSource, paywallKind })

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
            {checkoutErrorMessage ? (
              <div className="rounded-2xl border border-amber-300/70 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
                <p>{checkoutErrorMessage}</p>
                {checkoutErrorDetail || checkoutErrorDebug ? (
                  <p className="mt-1 text-xs opacity-80">
                    {checkoutErrorDetail ? `Reason: ${checkoutErrorDetail}. ` : ""}
                    {checkoutErrorDebug ? `Ref: ${checkoutErrorDebug}` : ""}
                  </p>
                ) : null}
              </div>
            ) : null}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {OVERLAY_TIERS.map((tier) => (
                <PaywallTierCard key={tier.id} tier={tier} currentPlanTier={currentPlanTier} source={source} />
              ))}
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
