import type { Metadata } from "next"

import { PublicHeader } from "@/components/public/public-header"
import { SectionReveal } from "@/components/public/section-reveal"
import {
  HOME2_BODY_CLASSNAME,
  Home2CtaSection,
  Home2HeroSection,
  Home2ImpactSection,
  Home2OfferingsSection,
  Home2ProcessSection,
  Home2TeamSection,
} from "@/components/public/home2-sections"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Home Two (Legacy)",
  description: "Alternate home page prototype inspired by Molly Studio.",
}

export const runtime = "edge"
export const revalidate = 86400

export default function HomeTwoPage() {
  return (
    <main
      className={cn(
        HOME2_BODY_CLASSNAME,
        "relative min-h-screen bg-background text-foreground",
        "h-[100dvh] overflow-y-auto scroll-smooth snap-y snap-proximity scroll-py-24",
        "dark:bg-[#0f0f12]",
      )}
    >
      <PublicHeader />

      <div className="relative overflow-x-hidden">
        <div className="mx-auto flex w-[min(1100px,92%)] flex-col gap-0 pb-24 pt-24 md:pb-28 md:pt-28">
          <SectionReveal className="grid min-h-[70vh] place-items-center py-0 md:py-0">
            <Home2HeroSection />
          </SectionReveal>

          <SectionReveal className="py-24 md:py-28">
            <Home2ImpactSection />
          </SectionReveal>

          <SectionReveal className="grid gap-12 py-28 md:py-36 lg:grid-cols-[0.55fr_1.05fr] lg:items-start">
            <Home2OfferingsSection />
          </SectionReveal>

          <SectionReveal className="grid gap-10 py-28 md:py-36 lg:grid-cols-[1fr_1.1fr]">
            <Home2ProcessSection />
          </SectionReveal>

          <SectionReveal className="relative">
            <Home2TeamSection />
          </SectionReveal>

          <SectionReveal>
            <Home2CtaSection />
          </SectionReveal>
        </div>
      </div>
    </main>
  )
}
