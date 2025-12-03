"use client"

import { logRoadmapEvent } from "./public-roadmap-tracker"

type RoadmapCtaButtonProps = {
  orgSlug: string
  sectionSlug: string
  href: string
  label: string
}

export function RoadmapCtaButton({ orgSlug, sectionSlug, href, label }: RoadmapCtaButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
      onClick={() =>
        logRoadmapEvent({
          orgSlug,
          sectionId: sectionSlug,
          eventType: "cta_click",
          source: href,
        })
      }
    >
      {label}
    </a>
  )
}
