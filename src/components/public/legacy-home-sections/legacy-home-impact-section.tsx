"use client"

import { legacyHomeInterFont } from "@/components/public/legacy-home-sections/fonts"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { cn } from "@/lib/utils"

type LegacyHomeImpactSectionProps = {
  staticText?: boolean
}

export function LegacyHomeImpactSection({ staticText = false }: LegacyHomeImpactSectionProps) {
  if (staticText) {
    return (
      <div className="flex w-full max-w-4xl flex-col items-start gap-6 text-left">
        <h2
          className={cn(
            legacyHomeInterFont.className,
            "text-balance text-3xl font-semibold leading-tight text-foreground sm:text-4xl lg:text-5xl",
          )}
        >
          Find, Build, and Fund nonprofits.
        </h2>
      </div>
    )
  }

  return (
    <div className="flex w-full max-w-4xl flex-col items-start gap-6 text-left">
      <ScrollReveal
        textClassName={cn(
          legacyHomeInterFont.className,
          "text-balance text-3xl font-semibold leading-tight text-foreground sm:text-4xl lg:text-5xl",
        )}
      >
        {"Find, Build, and Fund nonprofits."}
      </ScrollReveal>
    </div>
  )
}
