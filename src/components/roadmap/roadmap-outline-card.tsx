"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import WaypointsIcon from "lucide-react/dist/esm/icons/waypoints"
import ChevronLeftIcon from "lucide-react/dist/esm/icons/chevron-left"
import ChevronRightIcon from "lucide-react/dist/esm/icons/chevron-right"
import SparklesIcon from "lucide-react/dist/esm/icons/sparkles"

import { Button } from "@/components/ui/button"
import { ROADMAP_SECTION_ICONS } from "@/components/roadmap/roadmap-icons"
import type { RoadmapSection } from "@/lib/roadmap"
import { cn } from "@/lib/utils"

type RoadmapOutlineCardProps = {
  sections: RoadmapSection[]
}

export function RoadmapOutlineCard({ sections }: RoadmapOutlineCardProps) {
  const outlineSections = sections
  const total = outlineSections.length
  const completed = outlineSections.filter((section) => {
    if (section.status === "complete") return true
    if (section.content.trim().length > 0) return true
    return section.homework?.status === "complete"
  }).length
  const pageSize = useRoadmapPageSize()
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const [page, setPage] = useState(0)
  const items = useMemo(
    () =>
      outlineSections.map((section) => {
        const hasContent = section.content.trim().length > 0
        const status =
          section.status ??
          (hasContent
            ? "in_progress"
            : section.homework?.status === "in_progress"
              ? "in_progress"
              : section.homework?.status === "complete"
                ? "complete"
                : "not_started")
        return {
          id: section.id,
          slug: section.slug,
          title: section.titleIsTemplate ? section.templateTitle : section.title?.trim() || section.templateTitle,
          status,
        }
      }),
    [outlineSections],
  )
  const pageStart = page * pageSize
  const visible = items.slice(pageStart, pageStart + pageSize)

  useEffect(() => {
    if (page > pageCount - 1) {
      setPage(Math.max(0, pageCount - 1))
    }
  }, [page, pageCount])

  return (
    <section className="w-full space-y-3 pt-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <WaypointsIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
          Strategic Roadmap
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {completed} of {total} completed
          </span>
          {pageCount > 1 ? (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                disabled={page <= 0}
                aria-label="Previous roadmap sections"
              >
                <ChevronLeftIcon className="h-4 w-4" aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setPage((prev) => Math.min(prev + 1, pageCount - 1))}
                disabled={page >= pageCount - 1}
                aria-label="Next roadmap sections"
              >
                <ChevronRightIcon className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          ) : null}
        </div>
      </div>
      <div className="flex items-stretch gap-3">
        {visible.map((section) => {
          const Icon = ROADMAP_SECTION_ICONS[section.id] ?? SparklesIcon
          const statusClass =
            section.status === "complete"
              ? "bg-emerald-500"
              : section.status === "in_progress"
                ? "bg-amber-500"
                : "bg-border"
          const href = section.slug?.trim() ? `/roadmap/${section.slug}` : "/roadmap"
          return (
            <Link
              key={section.id}
              href={href}
              className="group flex min-h-[64px] min-w-[170px] max-w-[240px] flex-1 items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/40 px-3 py-3 transition hover:border-border hover:bg-card/70"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-muted-foreground transition group-hover:text-foreground">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 text-sm font-medium text-foreground line-clamp-2">
                  {section.title}
                </span>
              </span>
              <span aria-hidden className={cn("h-2.5 w-2.5 rounded-full", statusClass)} />
            </Link>
          )
        })}
      </div>
    </section>
  )
}

function useRoadmapPageSize() {
  const [pageSize, setPageSize] = useState(4)

  useEffect(() => {
    if (typeof window === "undefined") return
    const sm = window.matchMedia("(max-width: 639px)")
    const lg = window.matchMedia("(max-width: 1023px)")

    const update = () => {
      if (sm.matches) {
        setPageSize(2)
        return
      }
      if (lg.matches) {
        setPageSize(3)
        return
      }
      setPageSize(4)
    }

    update()
    sm.addEventListener?.("change", update)
    lg.addEventListener?.("change", update)

    return () => {
      sm.removeEventListener?.("change", update)
      lg.removeEventListener?.("change", update)
    }
  }, [])

  return pageSize
}
