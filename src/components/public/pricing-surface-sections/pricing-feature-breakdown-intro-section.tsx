import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function PricingFeatureBreakdownIntroSection() {
  return (
    <section className="mx-auto max-w-3xl text-center">
      <Badge
        variant="secondary"
        className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border/70 bg-white px-4 py-1 text-xs font-medium text-black dark:bg-white dark:text-black"
      >
        Features
      </Badge>
      <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Feature breakdown</h2>
      <p className="mt-4 text-balance text-sm text-muted-foreground sm:text-base">
        Compare Individual, Organization, and Operations Support at a glance.
      </p>
      <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
        <Button asChild className="rounded-xl">
          <Link href="/sign-up?plan=individual">Get started</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-xl">
          <a href="mailto:joel@coachhousesolutions.org?subject=Coach%20House%20Features">Talk to us</a>
        </Button>
      </div>
    </section>
  )
}
