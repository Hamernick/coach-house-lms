import Tag from "lucide-react/dist/esm/icons/tag"

import { Badge } from "@/components/ui/badge"

export function PricingHeroSection({
  headingLevel = "h1",
}: {
  headingLevel?: "h1" | "h2"
}) {
  const Heading = headingLevel

  return (
    <section className="mx-auto max-w-3xl text-center">
      <Badge
        variant="secondary"
        className="border-border/70 mx-auto mb-6 inline-flex items-center gap-2 rounded-full border bg-white px-4 py-1 text-xs font-medium text-black dark:bg-white dark:text-black"
      >
        <Tag className="h-3.5 w-3.5" aria-hidden />
        Pricing
      </Badge>
      <Heading
        id="pricing-heading"
        className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl"
      >
        Simple pricing
        <br />
        for nonprofit builders
      </Heading>
      <p className="text-muted-foreground mt-5 text-base text-balance sm:text-lg">
        Start with Individual for free, upgrade to Organization as your team
        grows, and scale with Operations Support when you need deeper
        infrastructure.
      </p>
    </section>
  )
}
