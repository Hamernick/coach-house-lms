import Tag from "lucide-react/dist/esm/icons/tag"

import { Badge } from "@/components/ui/badge"

export function PricingHeroSection() {
  return (
    <section className="mx-auto max-w-3xl text-center">
      <Badge
        variant="secondary"
        className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border/70 bg-white px-4 py-1 text-xs font-medium text-black dark:bg-white dark:text-black"
      >
        <Tag className="h-3.5 w-3.5" aria-hidden />
        Pricing
      </Badge>
      <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
        Simple pricing
        <br />
        for nonprofit builders
      </h1>
      <p className="mt-5 text-balance text-base text-muted-foreground sm:text-lg">
        Start with Individual for free, upgrade to Organization as your team grows, and scale with Operations Support
        when you need deeper infrastructure.
      </p>
    </section>
  )
}
