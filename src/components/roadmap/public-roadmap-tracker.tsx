"use client"

import { useEffect } from "react"

type TrackerProps = {
  orgSlug: string
  sections: Array<{ slug: string; id: string }>
}

export function RoadmapAnalyticsTracker({ orgSlug, sections }: TrackerProps) {
  useEffect(() => {
    void logRoadmapEvent({
      orgSlug,
      eventType: "view",
      sectionId: null,
    })
  }, [orgSlug])

  useEffect(() => {
    if (sections.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const slug = entry.target.getAttribute("data-roadmap-section")
          if (!slug) return
          void logRoadmapEvent({
            orgSlug,
            eventType: "view",
            sectionId: slug,
          })
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.4 },
    )

    sections.forEach((section) => {
      const el = document.querySelector(`[data-roadmap-section="${section.slug}"]`)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [orgSlug, sections])

  return null
}

type EventPayload = {
  orgSlug: string
  sectionId: string | null
  eventType: "view" | "cta_click"
  durationMs?: number
  source?: string | null
}

export async function logRoadmapEvent(payload: EventPayload) {
  const referrer = document.referrer || null
  const body = JSON.stringify({
    ...payload,
    referrer,
    source: payload.source ?? getSourceFromLocation(),
  })

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" })
    navigator.sendBeacon("/api/public/roadmap-event", blob)
    return
  }

  await fetch("/api/public/roadmap-event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  })
}

function getSourceFromLocation(): string | null {
  if (typeof window === "undefined") return null
  const params = new URLSearchParams(window.location.search)
  const utmSource = params.get("utm_source")
  if (utmSource) {
    return utmSource
  }
  if (document.referrer) {
    try {
      const url = new URL(document.referrer)
      return url.hostname
    } catch {
      return document.referrer
    }
  }
  return window.location.hostname
}
