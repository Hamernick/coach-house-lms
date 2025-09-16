import type { Metadata } from "next"
import Link from "next/link"

import { getPricingPlans } from "@/lib/pricing"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Choose a Coach House LMS plan that fits your cohort. Upgrade any time as your classrooms grow.",
}

function formatAmount(amount: number, currency: string, interval: string) {
  if (!amount) {
    return "Contact us"
  }

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: amount % 100 === 0 ? 0 : 2,
  })

  return `${formatter.format(amount / 100)}/${interval}`
}

export default async function PricingPage() {
  const plans = await getPricingPlans()

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-16 px-6 py-16 lg:py-24">
      <section className="mx-auto max-w-3xl text-center">
        <Badge variant="outline" className="mb-4">Simple, usage-based pricing</Badge>
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Launch courses without hidden fees
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Start with the essentials, then unlock advanced automation, billing, and analytics as your
          cohort scales.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const isContactPlan = plan.amount === 0
          return (
            <Card
              key={plan.id}
              className={
                plan.highlight
                  ? "border-primary/30 bg-primary/5 shadow-lg"
                  : "bg-card/80"
              }
            >
              <CardHeader className="space-y-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <CardTitle className="text-2xl font-semibold">{plan.name}</CardTitle>
                  {plan.highlight ? (
                    <Badge variant="default">Most popular</Badge>
                  ) : null}
                </div>
                <CardDescription className="text-balance">
                  {plan.description ?? "All of the essentials for modern course delivery."}
                </CardDescription>
                <p className="text-3xl font-semibold">
                  {formatAmount(plan.amount, plan.currency, plan.interval)}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  {plan.features.length > 0 ? (
                    plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2 text-left">
                        <span className="mt-1 size-1.5 rounded-full bg-primary" aria-hidden />
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">
                      Includes full access to Coach House dashboards, Supabase auth, and Stripe
                      billing integration.
                    </p>
                  )}
                </div>
                <Button asChild className="w-full" variant={plan.highlight ? "default" : "outline"}>
                  <Link href={isContactPlan ? "mailto:sales@coachhouse.io" : "/sign-up"}>
                    {isContactPlan ? "Talk to sales" : "Start free trial"}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </section>

      <section className="grid gap-4 rounded-3xl border bg-card/60 p-8 md:grid-cols-3">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Everything you need to ship courses</h2>
          <p className="text-sm text-muted-foreground">
            Every plan includes enterprise-grade authentication, RLS-ready database migrations, and
            modern React components built with shadcn/ui.
          </p>
        </div>
        <Separator className="hidden md:block" orientation="vertical" />
        <div className="grid gap-3 text-sm text-muted-foreground">
          <div>
            <span className="font-medium text-foreground">• Transparent billing.</span> Usage maps
            directly to Stripe subscriptions so finance teams can reconcile quickly.
          </div>
          <div>
            <span className="font-medium text-foreground">• Fast onboarding.</span> Use the included
            Supabase and Stripe scripts to stand up staging in minutes.
          </div>
          <div>
            <span className="font-medium text-foreground">• Human support.</span> Email us at {" "}
            <a
              href="mailto:support@coachhouse.io"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              support@coachhouse.io
            </a>{" "}
            to plan your rollout.
          </div>
        </div>
      </section>
    </div>
  )
}
