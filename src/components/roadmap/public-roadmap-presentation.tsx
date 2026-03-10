"use client"

import { useCallback, useMemo } from "react"

import { logRoadmapEvent } from "@/components/roadmap/public-roadmap-tracker"
import GradualBlur from "@/components/gradual-blur"

import { PublicRoadmapControls } from "./public-roadmap-presentation/public-roadmap-controls"
import { PublicRoadmapHeader } from "./public-roadmap-presentation/public-roadmap-header"
import { PublicRoadmapStage } from "./public-roadmap-presentation/public-roadmap-stage"
import { usePublicRoadmapNavigation } from "./public-roadmap-presentation/hooks/use-public-roadmap-navigation"
import type { PublicRoadmapPresentationProps } from "./public-roadmap-presentation/types"

function normalizeCtaHref(value: string | null | undefined): string | null {
  const rawUrl = typeof value === "string" ? value.trim() : ""
  if (rawUrl.length === 0) return null
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) return rawUrl
  return `https://${rawUrl}`
}

export function PublicRoadmapPresentation({
  orgName,
  subtitle,
  orgSlug,
  logoUrl,
  shareUrl,
  sections,
}: PublicRoadmapPresentationProps) {
  const shareTitle = useMemo(() => `${orgName} · Roadmap`, [orgName])
  const resolvedLogoUrl = useMemo(() => {
    if (typeof logoUrl !== "string") return null
    const trimmed = logoUrl.trim()
    return trimmed.length > 0 ? trimmed : null
  }, [logoUrl])
  const handleSectionView = useCallback(
    (sectionSlug: string) => {
      return logRoadmapEvent({
        orgSlug,
        eventType: "view",
        sectionId: sectionSlug,
      })
    },
    [orgSlug],
  )

  const {
    activeIndex,
    activeSection,
    rootRef,
    stageRef,
    goTo,
  } = usePublicRoadmapNavigation({
    sections,
    onSectionView: handleSectionView,
  })

  const activeEyebrow = useMemo(() => activeSection?.eyebrow?.trim() ?? "", [activeSection?.eyebrow])
  const activeTitle = useMemo(() => activeSection?.title?.trim() ?? "", [activeSection?.title])
  const activeSubtitle = useMemo(() => activeSection?.subtitle?.trim() ?? "", [activeSection?.subtitle])
  const displayTitle = useMemo(() => activeTitle || activeEyebrow, [activeEyebrow, activeTitle])
  const ctaHref = useMemo(() => normalizeCtaHref(activeSection?.ctaUrl), [activeSection?.ctaUrl])

  if (!activeSection) {
    return null
  }

  return (
    <div ref={rootRef} className="relative min-h-svh w-full overflow-hidden bg-background text-foreground">
      <div className="mx-auto flex min-h-svh w-full max-w-6xl flex-col px-6 pb-16 pt-8 sm:px-8 lg:px-12">
        <div className="flex flex-1 items-center">
          <div className="w-full">
            <div className="grid grid-cols-[40px_1fr] items-start gap-x-3">
              <div aria-hidden />
              <div className="w-full max-w-3xl">
                <PublicRoadmapStage
                  activeSection={activeSection}
                  activeEyebrow={activeEyebrow}
                  displayTitle={displayTitle}
                  activeSubtitle={activeSubtitle}
                  ctaHref={ctaHref}
                  orgSlug={orgSlug}
                  stageRef={stageRef}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <GradualBlur
        position="bottom"
        height="9rem"
        strength={2}
        divCount={6}
        curve="ease-out"
        opacity={0.9}
        zIndex={30}
      />

      <PublicRoadmapHeader
        orgName={orgName}
        subtitle={subtitle}
        resolvedLogoUrl={resolvedLogoUrl}
      />

      <PublicRoadmapControls
        activeIndex={activeIndex}
        sectionCount={sections.length}
        shareUrl={shareUrl}
        shareTitle={shareTitle}
        onGoTo={goTo}
      />
    </div>
  )
}
