import { randomUUID } from "node:crypto"
import { redirect } from "next/navigation"
import CalendarClockIcon from "lucide-react/dist/esm/icons/calendar-clock"
import CheckCircle2Icon from "lucide-react/dist/esm/icons/check-circle-2"
import CircleDotIcon from "lucide-react/dist/esm/icons/circle-dot"
import CoinsIcon from "lucide-react/dist/esm/icons/coins"
import SparklesIcon from "lucide-react/dist/esm/icons/sparkles"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { createSupabaseServerClient } from "@/lib/supabase"
import { resolveActiveOrganization } from "@/lib/organization/active-org"
import { resolvePricingPlanTier } from "@/lib/billing/plan-tier"
import { resolveStripeRuntimeConfigForAudience } from "@/lib/billing/stripe-runtime"
import { StripePoweredBadge } from "@/components/billing/stripe-powered-badge"
import {
  resolveDevtoolsAudience,
  resolveTesterMetadata,
} from "@/lib/devtools/audience"

import { BillingPlanCard } from "./_components/billing-plan-card"
import { BillingPortalCard } from "./_components/billing-portal-card"
import {
  loadBillingPageSubscription,
  resolveBillingNotice,
} from "./_lib/billing-page-state"

type BillingPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

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

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const notice = resolveBillingNotice(resolvedSearchParams)
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirect=/billing")
  }

  const fallbackIsTester = resolveTesterMetadata(user.user_metadata ?? null)
  const audience = await resolveDevtoolsAudience({
    supabase,
    userId: user.id,
    fallbackIsTester,
  })
  const stripeConfig = resolveStripeRuntimeConfigForAudience({
    isTester: audience.isTester,
  })
  const { orgId } = await resolveActiveOrganization(supabase, user.id)
  const { subscription, billingStateNotice } =
    await loadBillingPageSubscription({
      supabase,
      stripeConfig,
      orgId,
    })

  const currentPlanTier = resolvePricingPlanTier(subscription ?? null)
  const periodEnd = formatDate(subscription?.current_period_end ?? null)
  const cancelAt = formatDate(
    subscription?.cancel_at ?? subscription?.canceled_at ?? null
  )
  const subscriptionIsCanceling = Boolean(
    subscription?.cancel_at || subscription?.canceled_at
  )

  const organizationIsCurrent = currentPlanTier === "organization"
  const operationsIsCurrent = currentPlanTier === "operations_support"
  const hasPaidPlan = organizationIsCurrent || operationsIsCurrent
  const portalReady = Boolean(stripeConfig)
  const checkoutOrganizationReady = Boolean(stripeConfig?.organizationPriceId)
  const checkoutOperationsReady = Boolean(
    stripeConfig?.operationsSupportPriceId
  )
  const hasPortalReference = Boolean(
    subscription?.stripe_customer_id || subscription?.stripe_subscription_id
  )
  const transitionAttempt = randomUUID()
  const notices = [notice, billingStateNotice].filter(
    (item): item is NonNullable<typeof item> => Boolean(item)
  )

  return (
    <div className="space-y-6 px-4 py-6 lg:px-6">
      {notices.map((item) => (
        <Alert
          key={`${item.title}:${item.description}`}
          variant={item.destructive ? "destructive" : "default"}
          aria-live="polite"
        >
          <AlertTitle>{item.title}</AlertTitle>
          <AlertDescription>{item.description}</AlertDescription>
        </Alert>
      ))}
      <Card className="border-border/70 overflow-hidden">
        <div
          className="from-foreground/30 via-primary/40 to-foreground/30 h-1 w-full bg-gradient-to-r"
          aria-hidden
        />
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className="border-border/70 bg-muted/50 rounded-full border"
            >
              Billing
            </Badge>
            <Badge
              variant="secondary"
              className="border-border/70 bg-muted/50 rounded-full border"
            >
              Current plan:{" "}
              {operationsIsCurrent
                ? "Operations Support"
                : organizationIsCurrent
                  ? "Organization"
                  : "Free"}
            </Badge>
            {subscriptionIsCanceling ? (
              <Badge
                variant="secondary"
                className="rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
              >
                Canceling
              </Badge>
            ) : null}
            <StripePoweredBadge className="ml-auto" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl tracking-tight">
              Billing and plan management
            </CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-relaxed">
              Upgrade or downgrade between Organization and Operations Support
              from inside your workspace. Manage payment methods, invoices,
              cancelation, and renewal through the Stripe billing portal.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="text-muted-foreground grid gap-3 text-sm sm:grid-cols-3">
          <div className="border-border/70 bg-muted/25 rounded-xl border p-3">
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              Plan status
            </p>
            <p className="text-foreground mt-1 inline-flex items-center gap-2 font-medium">
              <CheckCircle2Icon className="h-4 w-4" aria-hidden />
              {hasPaidPlan ? "Paid plan active" : "Free plan active"}
            </p>
          </div>
          <div className="border-border/70 bg-muted/25 rounded-xl border p-3">
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              Billing cycle
            </p>
            <p className="text-foreground mt-1 inline-flex items-center gap-2 font-medium">
              <CalendarClockIcon className="h-4 w-4" aria-hidden />
              {cancelAt
                ? `Access through ${cancelAt}`
                : periodEnd
                  ? `Next renewal ${periodEnd}`
                  : "No renewal date yet"}
            </p>
          </div>
          <div className="border-border/70 bg-muted/25 rounded-xl border p-3">
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              Actions
            </p>
            <p className="text-foreground mt-1 inline-flex items-center gap-2 font-medium">
              <CoinsIcon className="h-4 w-4" aria-hidden />
              Upgrade, downgrade, or manage billing
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <BillingPlanCard
          title="Organization"
          description="$20/month. Team seats, accelerator access, and collaboration workflows."
          icon={CircleDotIcon}
          bullets={[
            "Unlimited Admin & Staff Seats",
            "Asynchronous Accelerator Access",
            "Fundability Lens + weekly support sessions",
          ]}
          plan="organization"
          checkoutReady={checkoutOrganizationReady}
          buttonLabel={
            operationsIsCurrent
              ? "Downgrade to Organization"
              : "Upgrade to Organization"
          }
          current={organizationIsCurrent}
          currentBadgeLabel="Current"
          unavailableLabel="Organization checkout unavailable"
          attempt={transitionAttempt}
        />

        <BillingPlanCard
          title="Operations Support"
          description="$58/month. Coaching plus expert-network access for operational execution."
          icon={SparklesIcon}
          bullets={[
            "One hour monthly 1:1 coaching",
            "Access expert network (bookkeeping, grant writing, accounting)",
            "Expanded delivery and operations support",
          ]}
          plan="operations_support"
          checkoutReady={checkoutOperationsReady}
          buttonLabel={
            organizationIsCurrent
              ? "Upgrade to Operations Support"
              : "Choose Operations Support"
          }
          current={operationsIsCurrent}
          currentBadgeLabel="Current"
          unavailableLabel="Operations plan unavailable"
          variant="secondary"
          highlighted
          attempt={transitionAttempt}
        />
      </div>

      <BillingPortalCard
        portalReady={portalReady}
        hasPortalReference={hasPortalReference}
        hasPaidPlan={hasPaidPlan}
      />
    </div>
  )
}
