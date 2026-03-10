"use client"

import { Button } from "@/components/ui/button"
import { logRoadmapEvent } from "./public-roadmap-tracker"

type RoadmapCtaButtonProps = {
  orgSlug: string
  sectionSlug: string
  href: string
  label: string
}

export function RoadmapCtaButton({ orgSlug, sectionSlug, href, label }: RoadmapCtaButtonProps) {
  return (
    <Button asChild className="rounded-full shadow-sm">
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
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
    </Button>
  )
}
