import { redirect } from "next/navigation"
import CalendarClockIcon from "lucide-react/dist/esm/icons/calendar-clock"
import CheckCircle2Icon from "lucide-react/dist/esm/icons/check-circle-2"
import CircleDotIcon from "lucide-react/dist/esm/icons/circle-dot"
import CoinsIcon from "lucide-react/dist/esm/icons/coins"
import SparklesIcon from "lucide-react/dist/esm/icons/sparkles"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createSupabaseServerClient } from "@/lib/supabase"
import { resolveActiveOrganization } from "@/lib/organization/active-org"
import { resolvePricingPlanTier } from "@/lib/billing/plan-tier"
import { env } from "@/lib/env"
import type { Json } from "@/lib/supabase"
import { PageTutorialButton } from "@/components/tutorial/page-tutorial-button"
import { startCheckout } from "@/app/(public)/pricing/actions"
import { StripePoweredBadge } from "@/components/billing/stripe-powered-badge"

import { BillingPortalButton } from "./billing-portal-button"

const PORTAL_READY = Boolean(env.STRIPE_SECRET_KEY)

function formatDate(dateValue: string | null) {
  if (!dateValue) return null
  const parsed = new Date(dateValue)
  if (!Number.isFinite(parsed.getTime())) return null
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed)
}

export default async function BillingPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirect=/billing")
  }

  const { orgId } = await resolveActiveOrganization(supabase, user.id)
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, metadata, current_period_end")
    .eq("user_id", orgId)
    .in("status", ["active", "trialing", "past_due", "incomplete"])
    .not("stripe_subscription_id", "ilike", "stub_%")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ status: string | null; metadata: Json | null; current_period_end: string | null }>()

  const currentPlanTier = resolvePricingPlanTier(subscription ?? null)
  const periodEnd = formatDate(subscription?.current_period_end ?? null)

  const organizationIsCurrent = currentPlanTier === "organization"
  const operationsIsCurrent = currentPlanTier === "operations_support"
  const hasPaidPlan = organizationIsCurrent || operationsIsCurrent

  return (
    <div className="space-y-6 px-4 py-6 lg:px-6">
      <PageTutorialButton tutorial="billing" />

      <Card className="overflow-hidden border-border/70">
        <div className="h-1 w-full bg-gradient-to-r from-foreground/30 via-primary/40 to-foreground/30" aria-hidden />
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-full border border-border/70 bg-muted/50">
              Billing
            </Badge>
            <Badge variant="secondary" className="rounded-full border border-border/70 bg-muted/50">
              Current plan:{" "}
              {operationsIsCurrent ? "Operations Support" : organizationIsCurrent ? "Organization" : "Free"}
            </Badge>
            <StripePoweredBadge className="ml-auto" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl tracking-tight">Billing and plan management</CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-relaxed">
              Upgrade or downgrade between Organization and Operations Support from inside your workspace.
              Manage payment methods, invoices, cancelation, and renewal through the Stripe billing portal.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
          <div className="rounded-xl border border-border/70 bg-muted/25 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Plan status</p>
            <p className="mt-1 inline-flex items-center gap-2 font-medium text-foreground">
              <CheckCircle2Icon className="h-4 w-4" aria-hidden />
              {hasPaidPlan ? "Paid plan active" : "Free plan active"}
            </p>
          </div>
          <div className="rounded-xl border border-border/70 bg-muted/25 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Billing cycle</p>
            <p className="mt-1 inline-flex items-center gap-2 font-medium text-foreground">
              <CalendarClockIcon className="h-4 w-4" aria-hidden />
              {periodEnd ? `Next renewal ${periodEnd}` : "No renewal date yet"}
            </p>
          </div>
          <div className="rounded-xl border border-border/70 bg-muted/25 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Actions</p>
            <p className="mt-1 inline-flex items-center gap-2 font-medium text-foreground">
              <CoinsIcon className="h-4 w-4" aria-hidden />
              Upgrade, downgrade, or manage billing
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-xl tracking-tight">Organization</CardTitle>
              {organizationIsCurrent ? (
                <Badge variant="secondary" className="rounded-full border border-border/70 bg-muted/50">
                  Current
                </Badge>
              ) : null}
            </div>
            <CardDescription>
              $20/month. Team seats, accelerator access, and collaboration workflows.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CircleDotIcon className="h-3.5 w-3.5" aria-hidden />
                Unlimited Admin & Staff Seats
              </li>
              <li className="flex items-center gap-2">
                <CircleDotIcon className="h-3.5 w-3.5" aria-hidden />
                Asynchronous Accelerator Access
              </li>
              <li className="flex items-center gap-2">
                <CircleDotIcon className="h-3.5 w-3.5" aria-hidden />
                Fundability Lens + weekly support sessions
              </li>
            </ul>
            {organizationIsCurrent ? (
              <p className="rounded-xl border border-border/70 bg-muted/35 px-3 py-2 text-center text-xs font-medium text-muted-foreground">
                You are currently on this plan.
              </p>
            ) : (
              <form action={startCheckout}>
                <input type="hidden" name="checkoutMode" value="organization" />
                <input type="hidden" name="planName" value="Organization" />
                <Button type="submit" className="w-full rounded-xl">
                  {operationsIsCurrent ? "Downgrade to Organization" : "Upgrade to Organization"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/30 ring-1 ring-primary/15">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-xl tracking-tight">Operations Support</CardTitle>
              {operationsIsCurrent ? (
                <Badge variant="secondary" className="rounded-full border border-border/70 bg-muted/50">
                  Current
                </Badge>
              ) : (
                <Badge variant="secondary" className="rounded-full border border-border/70 bg-muted/50">
                  Upgrade
                </Badge>
              )}
            </div>
            <CardDescription>
              $58/month. Coaching plus expert-network access for operational execution.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <SparklesIcon className="h-3.5 w-3.5" aria-hidden />
                One hour monthly 1:1 coaching
              </li>
              <li className="flex items-center gap-2">
                <SparklesIcon className="h-3.5 w-3.5" aria-hidden />
                Access expert network (bookkeeping, grant writing, accounting)
              </li>
              <li className="flex items-center gap-2">
                <SparklesIcon className="h-3.5 w-3.5" aria-hidden />
                Expanded delivery and operations support
              </li>
            </ul>
            {operationsIsCurrent ? (
              <p className="rounded-xl border border-border/70 bg-muted/35 px-3 py-2 text-center text-xs font-medium text-muted-foreground">
                You are currently on this plan.
              </p>
            ) : (
              <form action={startCheckout}>
                <input type="hidden" name="checkoutMode" value="organization" />
                <input type="hidden" name="planName" value="Operations Support" />
                <Button type="submit" className="w-full rounded-xl" variant="secondary">
                  {organizationIsCurrent ? "Upgrade to Operations Support" : "Choose Operations Support"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Billing portal</CardTitle>
            <StripePoweredBadge />
          </div>
          <CardDescription>
            Open Stripe to manage payment methods, invoices, cancelation, renewal, and subscription details.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          {PORTAL_READY ? (
            <BillingPortalButton />
          ) : (
            <Button disabled variant="outline">
              Billing portal unavailable
            </Button>
          )}
          <p className="text-sm text-muted-foreground">
            Need help? Contact{" "}
            <a href="mailto:support@coachhouse.io" className="font-medium text-primary underline-offset-4 hover:underline">
              support@coachhouse.io
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
