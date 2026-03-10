"use client"

import { LegacyHomePhotoStrip } from "@/components/public/legacy-home-photo-strip"
import { PHOTO_STRIP } from "@/components/public/legacy-home-sections-data"
import { type LegacyHomeSectionProps } from "@/components/public/legacy-home-sections/types"
import { cn } from "@/lib/utils"

export function LegacyHomeTeamSection({ withinCanvas = false }: LegacyHomeSectionProps) {
  return (
    <div className="relative">
      <div className="mb-8 space-y-4 text-left lg:pointer-events-none lg:absolute lg:left-0 lg:top-1/2 lg:z-0 lg:mb-0 lg:max-w-[320px] lg:-translate-y-1/2">
        <h2 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
          <span className="block">Meet</span>
          <span className="block">the team</span>
        </h2>
        <p className="text-sm text-muted-foreground">
          Coaches, strategists, and operators helping founders move from formation to funding.
        </p>
      </div>
      <div
        className={cn(
          "relative z-10",
          withinCanvas ? "lg:ml-[320px]" : "lg:-ml-[calc((100vw-100%)/2)] lg:-mr-[calc((100vw-100%)/2)]",
        )}
      >
        <LegacyHomePhotoStrip items={PHOTO_STRIP} centerToViewport={!withinCanvas} />
      </div>
    </div>
  )
}
