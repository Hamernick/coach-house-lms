import Image from "next/image"
import type { RefObject } from "react"

import { RoadmapCtaButton } from "@/components/roadmap/public-roadmap-cta"
import { Badge } from "@/components/ui/badge"

import type { PublicRoadmapSection } from "./types"

type PublicRoadmapStageProps = {
  activeSection: PublicRoadmapSection
  activeEyebrow: string
  displayTitle: string
  activeSubtitle: string
  ctaHref: string | null
  orgSlug: string
  stageRef: RefObject<HTMLDivElement | null>
}

export function PublicRoadmapStage({
  activeSection,
  activeEyebrow,
  displayTitle,
  activeSubtitle,
  ctaHref,
  orgSlug,
  stageRef,
}: PublicRoadmapStageProps) {
  return (
    <div ref={stageRef} className="mt-4 space-y-8 sm:mt-6">
      {activeSection.imageUrl ? (
        <div className="space-y-3">
          {activeEyebrow ? (
            <Badge
              variant="outline"
              className="rounded-full border-border/60 bg-background/70 px-3 py-1 text-[11px] font-semibold text-muted-foreground shadow-sm"
            >
              {activeEyebrow}
            </Badge>
          ) : null}
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-muted/20">
            <div className="relative aspect-video w-full">
              <Image
                src={activeSection.imageUrl}
                alt=""
                fill
                sizes="(min-width: 1024px) 48rem, 100vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      ) : null}

      {activeEyebrow || displayTitle || activeSubtitle ? (
        <div className="space-y-4">
          {activeEyebrow && !activeSection.imageUrl ? (
            <Badge
              variant="outline"
              className="rounded-full border-border/60 bg-background/70 px-3 py-1 text-[11px] font-semibold text-muted-foreground shadow-sm"
            >
              {activeEyebrow}
            </Badge>
          ) : null}
          {displayTitle ? (
            <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">{displayTitle}</h1>
          ) : null}
          {activeSubtitle ? <p className="max-w-2xl text-base text-muted-foreground">{activeSubtitle}</p> : null}
        </div>
      ) : null}

      <div
        className="prose prose-lg max-w-none text-foreground/90 dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: activeSection.contentHtml }}
      />
      {activeSection.ctaLabel && ctaHref ? (
        <div className="pt-2">
          <RoadmapCtaButton
            orgSlug={orgSlug}
            sectionSlug={activeSection.slug}
            href={ctaHref}
            label={activeSection.ctaLabel}
          />
        </div>
      ) : null}
    </div>
  )
}
