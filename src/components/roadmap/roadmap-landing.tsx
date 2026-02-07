"use client"

import Link from "next/link"
import type { RoadmapSection } from "@/lib/roadmap"
import { RoadmapRailCard } from "@/components/roadmap/roadmap-rail-card"

type RoadmapLandingProps = {
  sections: RoadmapSection[]
  heroUrl?: string | null
  publicSlug?: string | null
  canEdit: boolean
  editHref: string
}

export function RoadmapLanding({ sections, heroUrl, canEdit, editHref }: RoadmapLandingProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-12 pt-8 sm:px-6 lg:px-8">
      <header className="space-y-3 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Launch Roadmap</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          A concise snapshot of your strategy. Jump into any section to edit, publish, or share.
        </p>
        {heroUrl ? (
          <div className="mx-auto mt-4 h-24 w-full max-w-3xl overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-r from-muted/70 via-muted/40 to-muted/70">
            <div
              className="h-full w-full bg-cover bg-center"
              style={{ backgroundImage: `url(${heroUrl})`, filter: "brightness(0.9)" }}
              aria-hidden
            />
          </div>
        ) : null}
      </header>

      <RoadmapRailCard
        sections={sections}
        className="mx-auto w-full max-w-5xl"
        title="Launch Roadmap"
        subtitle="Open any section to review, update, and publish."
      />

      <div className="flex flex-wrap items-center justify-center gap-3">
        {canEdit ? (
          <Link className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm" href={editHref}>
            Open roadmap editor
          </Link>
        ) : null}
      </div>
    </div>
  )
}
