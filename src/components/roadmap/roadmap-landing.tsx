"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Flag from "lucide-react/dist/esm/icons/flag"
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left"
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right"
import type { RoadmapSection } from "@/lib/roadmap"
import { Button } from "@/components/ui/button"
import { StepperRail, type StepperRailStep } from "@/components/ui/stepper-rail"
import { ROADMAP_SECTION_ICONS } from "@/components/roadmap/roadmap-icons"

type RoadmapLandingProps = {
  sections: RoadmapSection[]
  heroUrl?: string | null
  publicSlug?: string | null
  canEdit: boolean
  editHref: string
}

export function RoadmapLanding({ sections, heroUrl, canEdit, editHref }: RoadmapLandingProps) {
  const router = useRouter()
  const items = useMemo(() => {
    return sections.map((section, idx) => {
      const href = `/roadmap/${section.slug ?? section.id}`
      const title = section.titleIsTemplate ? section.templateTitle : section.title?.trim() || section.templateTitle
      const subtitle = section.subtitleIsTemplate
        ? section.templateSubtitle
        : section.subtitle?.trim() || section.templateSubtitle
      return {
        ...section,
        title,
        subtitle,
        href,
        idx,
      }
    })
  }, [sections])
  const defaultActiveIndex = useMemo(() => {
    if (items.length === 0) return 0
    const nextIndex = items.findIndex((item) => item.status !== "complete")
    if (nextIndex >= 0) return nextIndex
    return Math.max(items.length - 1, 0)
  }, [items])
  const [activeIndex, setActiveIndex] = useState(defaultActiveIndex)
  const pageSize = 4
  const railSteps = useMemo<StepperRailStep[]>(
    () =>
      items.map((item, idx) => {
        const Icon = ROADMAP_SECTION_ICONS[item.id] ?? Flag
        return {
          id: item.id,
          label: item.title,
          status: item.status,
          description: item.subtitle,
          icon: <Icon className="h-5 w-5" aria-hidden />,
          stepIndex: idx + 1,
        }
      }),
    [items],
  )

  useEffect(() => {
    if (activeIndex > items.length - 1) {
      setActiveIndex(Math.max(items.length - 1, 0))
    }
  }, [activeIndex, items.length])
  const handleRailChange = (index: number) => {
    setActiveIndex(index)
    const href = items[index]?.href
    if (href) router.push(href)
  }

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

      <div className="space-y-6">
        <div className="flex w-full items-center justify-end">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={() => setActiveIndex((prev) => Math.max(prev - 1, 0))}
              disabled={activeIndex <= 0}
              aria-label="Previous roadmap section"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={() => setActiveIndex((prev) => Math.min(prev + 1, Math.max(items.length - 1, 0)))}
              disabled={activeIndex >= items.length - 1}
              aria-label="Next roadmap section"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <StepperRail
            steps={railSteps}
            activeIndex={activeIndex}
            onChange={handleRailChange}
            pageSize={pageSize}
            showControls={false}
            variant="roadmap"
            className="w-full max-w-4xl"
          />
        </div>
      </div>

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
