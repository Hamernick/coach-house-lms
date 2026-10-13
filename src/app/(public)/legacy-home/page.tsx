import type { Metadata } from "next"

import { PublicHeader } from "@/components/public/public-header"
import { SectionReveal } from "@/components/public/section-reveal"
import {
  LEGACY_HOME_BODY_CLASSNAME,
  LegacyHomeCtaSection,
  LegacyHomeHeroSection,
  LegacyHomeImpactSection,
  LegacyHomeOfferingsSection,
  LegacyHomeProcessSection,
  LegacyHomeTeamSection,
} from "@/components/public/legacy-home-sections"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Legacy Home",
  description: "Alternate home page prototype inspired by Molly Studio.",
}

export const runtime = "edge"
export const revalidate = 86400

export default function LegacyHomePage() {
  return (
    <main
      className={cn(
        LEGACY_HOME_BODY_CLASSNAME,
        "relative min-h-screen bg-background text-foreground",
        "h-[100dvh] overflow-y-auto scroll-smooth snap-y snap-proximity scroll-py-24",
        "dark:bg-[#0f0f12]",
      )}
    >
      <PublicHeader />

      <div className="relative overflow-x-hidden">
        <div className="mx-auto flex w-[min(1100px,92%)] flex-col gap-0 pb-24 pt-24 md:pb-28 md:pt-28">
          <SectionReveal className="grid min-h-[70vh] place-items-center py-0 md:py-0">
            <LegacyHomeHeroSection />
          </SectionReveal>

          <SectionReveal className="py-24 md:py-28">
            <LegacyHomeImpactSection />
          </SectionReveal>

          <SectionReveal className="grid gap-12 py-28 md:py-36 lg:grid-cols-[0.55fr_1.05fr] lg:items-start">
            <LegacyHomeOfferingsSection />
          </SectionReveal>

          <SectionReveal className="grid gap-10 py-28 md:py-36 lg:grid-cols-[1fr_1.1fr]">
            <LegacyHomeProcessSection />
          </SectionReveal>

          <SectionReveal className="relative">
            <LegacyHomeTeamSection />
          </SectionReveal>

          <SectionReveal>
            <LegacyHomeCtaSection />
          </SectionReveal>
        </div>
      </div>
    </main>
  )
}
