"use client"

import { useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import ExternalLinkIcon from "lucide-react/dist/esm/icons/external-link"
import LockIcon from "lucide-react/dist/esm/icons/lock"
import SparklesIcon from "lucide-react/dist/esm/icons/sparkles"

import { startCheckout } from "@/app/(public)/pricing/actions"
import { ELECTIVE_ADD_ON_MODULES, isElectiveAddOnModuleSlug } from "@/lib/accelerator/elective-modules"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const PAYWALL_QUERY_KEYS = ["paywall", "plan", "upgrade", "module", "source"] as const

function buildPricingHref(searchParams: URLSearchParams) {
  const next = new URLSearchParams()
  const plan = searchParams.get("plan")
  const upgrade = searchParams.get("upgrade")
  const moduleSlug = searchParams.get("module")
  if (plan) next.set("plan", plan)
  if (upgrade) next.set("upgrade", upgrade)
  if (moduleSlug) next.set("module", moduleSlug)
  const query = next.toString()
  return query ? `/pricing?${query}` : "/pricing"
}

export function PaywallOverlay() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const paywallKind = searchParams.get("paywall")
  const isOpen = Boolean(paywallKind)
  const requestedModule = searchParams.get("module")
  const requestedElective = requestedModule && isElectiveAddOnModuleSlug(requestedModule) ? requestedModule : null

  const pricingHref = useMemo(() => buildPricingHref(new URLSearchParams(searchParams.toString())), [searchParams])
  const electiveOptions = useMemo(() => {
    if (requestedElective) {
      const exact = ELECTIVE_ADD_ON_MODULES.find((module) => module.slug === requestedElective)
      return exact ? [exact] : []
    }
    return ELECTIVE_ADD_ON_MODULES
  }, [requestedElective])

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
      <DialogContent className="flex max-h-[88vh] w-[min(980px,96vw)] max-w-[980px] flex-col gap-0 overflow-hidden rounded-3xl border border-border/70 p-0 sm:max-w-[980px]">
        <DialogHeader className="border-b border-border/70 px-5 py-4 pr-12 sm:px-6">
          <DialogTitle className="flex items-center gap-2 text-base">
            <LockIcon className="h-4 w-4" aria-hidden />
            Upgrade required
          </DialogTitle>
          <DialogDescription>
            Unlock access without leaving your current workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="relative min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {paywallKind === "elective" ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-border/70 bg-muted/40 p-3 sm:p-4">
                <p className="text-sm font-medium text-foreground">
                  Purchase an elective and unlock the module instantly in your workspace.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {electiveOptions.map((module) => (
                  <Card key={module.slug} className="flex h-full flex-col rounded-2xl border-border/70">
                    <CardHeader className="space-y-2">
                      <CardTitle className="text-base">{module.title}</CardTitle>
                      <CardDescription>$50 one-time</CardDescription>
                    </CardHeader>
                    <CardContent className="mt-auto pt-0">
                      <form action={startCheckout} className="w-full">
                        <input type="hidden" name="checkoutMode" value="elective" />
                        <input type="hidden" name="electiveModuleSlug" value={module.slug} />
                        <input type="hidden" name="planName" value={`${module.title} (Elective)`} />
                        <Button type="submit" className="h-10 w-full rounded-xl">
                          Unlock module
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Receipts are sent by Stripe to your account email. Access is unlocked immediately after successful
                checkout and persisted via webhook.
              </p>
            </div>
          ) : paywallKind === "accelerator" ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-border/70 bg-muted/40 p-3 sm:p-4">
                <p className="text-sm font-medium text-foreground">Accelerator access is required for this track.</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Choose a plan to unlock this content immediately in your workspace.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="flex h-full flex-col rounded-2xl border-border/70">
                  <CardHeader className="space-y-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <SparklesIcon className="h-4 w-4" aria-hidden />
                      Accelerator Pro
                    </CardTitle>
                    <CardDescription>$499 one-time (includes coaching)</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto pt-0">
                    <form action={startCheckout} className="w-full">
                      <input type="hidden" name="checkoutMode" value="accelerator" />
                      <input type="hidden" name="acceleratorVariant" value="with_coaching" />
                      <input type="hidden" name="acceleratorBilling" value="one_time" />
                      <input type="hidden" name="planName" value="Accelerator Pro" />
                      <Button type="submit" className="h-10 w-full rounded-xl">
                        Continue to checkout
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card className="flex h-full flex-col rounded-2xl border-border/70">
                  <CardHeader className="space-y-2">
                    <CardTitle className="text-base">Accelerator Base</CardTitle>
                    <CardDescription>$349 one-time</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto pt-0">
                    <form action={startCheckout} className="w-full">
                      <input type="hidden" name="checkoutMode" value="accelerator" />
                      <input type="hidden" name="acceleratorVariant" value="without_coaching" />
                      <input type="hidden" name="acceleratorBilling" value="one_time" />
                      <input type="hidden" name="planName" value="Accelerator Base" />
                      <Button type="submit" variant="secondary" className="h-10 w-full rounded-xl">
                        Continue to checkout
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
              <p className="text-xs text-muted-foreground">
                Need monthly installment options? Open the full pricing page below.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Upgrade your account to continue.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border/70 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Button type="button" variant="outline" onClick={close} className="h-10">
            Continue without upgrade
          </Button>
          <Button type="button" asChild className="h-10">
            <a href={pricingHref} target="_blank" rel="noreferrer">
              Open pricing
              <ExternalLinkIcon className="h-4 w-4" aria-hidden />
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
