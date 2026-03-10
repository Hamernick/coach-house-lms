"use client"

import { legacyHomeHeadingFont } from "@/components/public/legacy-home-sections/fonts"
import { LegacyHomeHighlightCard } from "@/components/public/legacy-home-sections/legacy-home-highlight-card"
import { PRODUCT_HIGHLIGHTS } from "@/components/public/legacy-home-sections-data"
import { cn } from "@/lib/utils"

type LegacyHomeOfferingsSectionProps = {
  layout?: "split" | "stacked"
}

const splitLayoutByIndex: Record<number, string> = {
  0: "md:col-span-3 md:row-span-2",
  1: "md:col-start-1 md:row-start-3",
  2: "md:col-start-3 md:row-start-3",
  3: "md:col-start-1 md:row-start-4 md:col-span-2",
  4: "md:col-start-2 md:row-start-3",
  5: "md:col-start-3 md:row-start-4",
}

const stackedLayoutByIndex: Record<number, string> = {
  0: "md:col-span-3",
  1: "md:col-start-1 md:row-start-2",
  2: "md:col-start-3 md:row-start-2",
  3: "md:col-span-2 md:col-start-1 md:row-start-3",
  4: "md:col-start-2 md:row-start-2",
  5: "md:col-start-3 md:row-start-3",
}

export function LegacyHomeOfferingsSection({ layout = "split" }: LegacyHomeOfferingsSectionProps) {
  if (layout === "stacked") {
    return (
      <div className="w-full max-w-[760px] space-y-4">
        <div className="max-w-md space-y-2 text-left">
          <h2 className={cn(legacyHomeHeadingFont.className, "text-3xl font-semibold")}>What we do</h2>
          <p className="text-sm text-muted-foreground">
            The platform, fiscal sponsorship, curriculum, community, and docs you need to launch and fund your
            nonprofit.
          </p>
        </div>
        <div className="grid w-full gap-4 md:grid-cols-3 md:auto-rows-[176px]">
          {PRODUCT_HIGHLIGHTS.map((item, index) => (
            <LegacyHomeHighlightCard key={item.title} item={item} className={stackedLayoutByIndex[index]} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="max-w-md space-y-2">
        <h2 className={cn(legacyHomeHeadingFont.className, "text-3xl font-semibold")}>What we do</h2>
        <p className="text-sm text-muted-foreground">
          The platform, fiscal sponsorship, curriculum, community, and docs you need to launch and fund your nonprofit.
        </p>
      </div>
      <div className="grid w-full gap-4 md:grid-cols-3 md:auto-rows-[152px]">
        {PRODUCT_HIGHLIGHTS.map((item, index) => (
          <LegacyHomeHighlightCard key={item.title} item={item} className={splitLayoutByIndex[index]} />
        ))}
      </div>
    </>
  )
}
