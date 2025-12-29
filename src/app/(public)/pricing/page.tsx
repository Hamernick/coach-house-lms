import type { Metadata } from "next"
import Link from "next/link"

import { startCheckout } from "@/app/(public)/pricing/actions"
import { getPricingPlans, type PricingPlan } from "@/lib/pricing"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CheckoutSubmit } from "@/components/pricing/checkout-submit"
import { PublicHeader } from "@/components/public/public-header"

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "OpenNFP is the platform for organizations. We get your fundraising ready.",
}

export const runtime = "nodejs"
export const revalidate = 3600

const FREE_FEATURES = [
  "501(c)(3) formation (articles of incorporation, bylaws, basic financial manual)",
  "Core documents",
  "CRM + org chart",
  "Fundraising tools",
  "Brand kit",
  "Public + shareable assets with a donate button",
  "Reports",
]

const PAID_FEATURES = [
  "AI tooling (token limits)",
  "4 expert sessions (45 minutes each)",
  "Accelerator",
  "Verified badge upon completion",
  "Strategic roadmap",
  "Multiple seats (admins + employees)",
  "Advanced templates (board policy, bylaws)",
]

const ENTERPRISE_FEATURES = [
  "AI tooling (higher token limits)",
  "1:1 coaching (3x a month)",
]

const PUBLIC_FEATURES = ["ResourceMap listing"]

const MARKETPLACE_FEATURES = [
  "Services, tools, SaaS",
  "Accountants",
  "Lawyers",
  "HR",
  "Free tools + discounts",
]

function findPaidPlan(plans: PricingPlan[]) {
  const paidMatch = plans.find((plan) =>
    ["paid", "pro", "growth", "plus", "accelerator"].some((keyword) =>
      plan.name.toLowerCase().includes(keyword),
    ),
  )

  if (paidMatch) return paidMatch

  return plans.find((plan) => plan.amount > 0) ?? null
}

export default async function PricingPage() {
  const plans = await getPricingPlans()
  const paidPriceOverride = "$99/month"
  const paidPlan = findPaidPlan(plans)
  const paidPriceId = paidPlan?.id ?? null

  return (
    <main className="relative min-h-screen bg-background">
      <PublicHeader />
      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-16 pt-28 lg:pb-24">
        <section className="mx-auto max-w-3xl text-center">
          <Badge variant="outline" className="mb-4">OpenNFP</Badge>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            The platform for organizations
          </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          We get your fundraising ready with core documents, fundraising tools, and expert guidance.
        </p>
        </section>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="flex h-full flex-col bg-card/80">
          <CardHeader className="space-y-3 text-center">
            <div className="flex items-center justify-center gap-2">
              <CardTitle className="text-2xl font-semibold">Free</CardTitle>
            </div>
            <CardDescription className="text-balance">
              Everything you need to get organized and fundraising-ready.
            </CardDescription>
            <p className="text-3xl font-semibold">No cost</p>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            <ul className="space-y-3 text-sm">
              {FREE_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-left">
                  <span className="mt-1 size-1.5 rounded-full bg-primary" aria-hidden />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="mt-auto">
            <Button asChild variant="outline" className="w-full">
              <Link href="/sign-up">Get started free</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex h-full flex-col border-primary/30 bg-primary/5 shadow-lg">
          <CardHeader className="space-y-3 text-center">
            <div className="flex items-center justify-center gap-2">
              <CardTitle className="text-2xl font-semibold">Paid</CardTitle>
              <Badge variant="default">Most popular</Badge>
            </div>
            <CardDescription className="text-balance">
              Expert guidance, accelerator workflows, and advanced templates.
            </CardDescription>
            <div className="space-y-1">
              <p className="text-3xl font-semibold">{paidPriceOverride}</p>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Billed monthly</p>
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Everything in Free, plus:
            </p>
            <ul className="space-y-3 text-sm">
              {PAID_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-left">
                  <span className="mt-1 size-1.5 rounded-full bg-primary" aria-hidden />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="mt-auto">
            {paidPriceId && paidPriceId.startsWith("price_") ? (
              <form action={startCheckout} className="w-full">
                <input type="hidden" name="priceId" value={paidPriceId} />
                <input type="hidden" name="planName" value="Paid" />
                <CheckoutSubmit variant="default">Start paid plan</CheckoutSubmit>
              </form>
            ) : (
              <Button asChild className="w-full">
                <Link href="/sign-up">Start paid plan</Link>
              </Button>
            )}
          </CardFooter>
        </Card>

        <Card className="flex h-full flex-col bg-card/80">
          <CardHeader className="space-y-3 text-center">
            <div className="flex items-center justify-center gap-2">
              <CardTitle className="text-2xl font-semibold">Enterprise</CardTitle>
            </div>
            <CardDescription className="text-balance">
              Everything in Paid plus higher-touch coaching for larger teams.
            </CardDescription>
            <p className="text-3xl font-semibold">Custom</p>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Everything in Paid, plus:
            </p>
            <ul className="space-y-3 text-sm">
              {ENTERPRISE_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-left">
                  <span className="mt-1 size-1.5 rounded-full bg-primary" aria-hidden />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="mt-auto">
            <Button asChild variant="outline" className="w-full">
              <Link href="mailto:sales@coachhouse.io">Contact enterprise</Link>
            </Button>
          </CardFooter>
        </Card>
        </section>

        <section className="space-y-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-semibold">Public + Marketplace</h2>
          <p className="text-sm text-muted-foreground">
            Included for every organization to grow visibility and find trusted partners.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-card/60">
            <CardHeader className="space-y-2">
              <CardTitle className="text-lg">Public</CardTitle>
              <CardDescription>Show up on the community map and share your story.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {PUBLIC_FEATURES.map((feature) => (
                <div key={feature} className="flex items-start gap-2 text-left">
                  <span className="mt-1 size-1.5 rounded-full bg-primary" aria-hidden />
                  <span className="text-muted-foreground">{feature}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card/60">
            <CardHeader className="space-y-2">
              <CardTitle className="text-lg">Marketplace</CardTitle>
              <CardDescription>Discover tools and vetted partners for growth.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {MARKETPLACE_FEATURES.map((feature) => (
                <div key={feature} className="flex items-start gap-2 text-left">
                  <span className="mt-1 size-1.5 rounded-full bg-primary" aria-hidden />
                  <span className="text-muted-foreground">{feature}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <Separator />
        <div className="text-center text-sm text-muted-foreground">
          Questions? Email{" "}
          <a href="mailto:support@coachhouse.io" className="font-medium text-primary underline-offset-4 hover:underline">
            support@coachhouse.io
          </a>{" "}
          and we will help you plan your rollout.
        </div>
        </section>
      </div>
    </main>
  )
}
