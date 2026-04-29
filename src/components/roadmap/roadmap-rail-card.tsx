"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left"
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right"
import Flag from "lucide-react/dist/esm/icons/flag"
import WaypointsIcon from "lucide-react/dist/esm/icons/waypoints"
import Layers from "lucide-react/dist/esm/icons/layers"

import { ROADMAP_SECTION_ICONS } from "@/components/roadmap/roadmap-icons"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StepperRail, type StepperRailStep } from "@/components/ui/stepper-rail"
import { getTrackIcon } from "@/lib/accelerator/track-icons"
import { sortAcceleratorModules } from "@/lib/accelerator/module-order"
import { resolveRoadmapSectionDerivedStatus } from "@/lib/roadmap/helpers"
import type { RoadmapSection } from "@/lib/roadmap"
import {
  WORKSPACE_ROADMAP_PATH,
  getWorkspaceRoadmapSectionPath,
} from "@/lib/workspace/routes"
import { cn } from "@/lib/utils"
import { RoadmapRailCardSnakeGrid } from "./roadmap-rail-card/roadmap-rail-card-snake-grid"
import type { LessonGroupOption, RoadmapRailItem, RoadmapTimelineModule, TimelineCard } from "./roadmap-rail-card/types"

export type { RoadmapTimelineModule } from "./roadmap-rail-card/types"

type RoadmapRailCardProps = {
  sections: RoadmapSection[]
  className?: string
  title?: string
  subtitle?: string
  pageSize?: number
  surface?: "card" | "plain"
  hrefBase?: string
  layout?: "rail" | "snake-grid"
  modules?: RoadmapTimelineModule[]
}

const LESSON_GROUP_ALL = "__all_groups__"

export function RoadmapRailCard({
  sections,
  className,
  title = "Strategic Roadmap",
  subtitle = "Jump into any section and continue building.",
  pageSize = 4,
  surface = "card",
  hrefBase = WORKSPACE_ROADMAP_PATH,
  layout = "rail",
  modules = [],
}: RoadmapRailCardProps) {
  const router = useRouter()
  const isSnakeGrid = layout === "snake-grid"

  const normalizedHrefBase = useMemo(() => {
    const trimmed = hrefBase.trim()
    if (!trimmed) return WORKSPACE_ROADMAP_PATH
    const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`
    return withLeadingSlash.replace(/\/+$/, "")
  }, [hrefBase])

  const items = useMemo<RoadmapRailItem[]>(() => {
    return sections.map((section, idx) => {
      const sectionSlug = section.slug ?? section.id
      const href =
        normalizedHrefBase === WORKSPACE_ROADMAP_PATH
          ? getWorkspaceRoadmapSectionPath(sectionSlug)
          : `${normalizedHrefBase}/${sectionSlug}`
      const displayTitle = section.titleIsTemplate
        ? section.templateTitle
        : section.title?.trim() || section.templateTitle
      const displaySubtitle = section.subtitleIsTemplate
        ? section.templateSubtitle
        : section.subtitle?.trim() || section.templateSubtitle
      return {
        ...section,
        status: resolveRoadmapSectionDerivedStatus(section),
        displayTitle,
        displaySubtitle,
        href,
        idx,
      }
    })
  }, [normalizedHrefBase, sections])

  const orderedModules = useMemo(() => sortAcceleratorModules(modules), [modules])
  const lessonGroupOptions = useMemo<LessonGroupOption[]>(() => {
    const groups = new Map<string, LessonGroupOption>()

    for (const lessonModule of orderedModules) {
      const groupLabel = lessonModule.groupTitle?.trim() || "General"
      const groupKey = groupLabel.toLowerCase().replace(/\s+/g, "-")
      const existing = groups.get(groupKey)
      if (existing) {
        existing.moduleIds.add(lessonModule.id)
        existing.moduleIndexes.add(lessonModule.index)
      } else {
        groups.set(groupKey, {
          key: groupKey,
          label: groupLabel,
          moduleIds: new Set([lessonModule.id]),
          moduleIndexes: new Set([lessonModule.index]),
        })
      }
    }

    return Array.from(groups.values())
  }, [orderedModules])
  const [selectedLessonGroup, setSelectedLessonGroup] = useState<string>(LESSON_GROUP_ALL)

  const timelineCards = useMemo<TimelineCard[]>(() => {
    const cards: TimelineCard[] = []
    const deliverablesByModuleId = new Map<string, RoadmapRailItem[]>()
    const unlinkedDeliverables: RoadmapRailItem[] = []

    for (const item of items) {
      const linkedModuleId = item.homework?.moduleId
      if (!linkedModuleId) {
        unlinkedDeliverables.push(item)
        continue
      }
      const bucket = deliverablesByModuleId.get(linkedModuleId)
      if (bucket) {
        bucket.push(item)
      } else {
        deliverablesByModuleId.set(linkedModuleId, [item])
      }
    }

    for (const timelineModule of orderedModules) {
      cards.push({ kind: "module", key: `module-${timelineModule.id}`, module: timelineModule })
      const linkedDeliverables = deliverablesByModuleId.get(timelineModule.id) ?? []
      linkedDeliverables.forEach((item) => {
        cards.push({ kind: "deliverable", key: `deliverable-${item.id}`, item })
      })
      deliverablesByModuleId.delete(timelineModule.id)
    }

    const remainingLinkedDeliverables = Array.from(deliverablesByModuleId.values())
      .flat()
      .sort((a, b) => a.idx - b.idx)
    remainingLinkedDeliverables.forEach((item) => {
      cards.push({ kind: "deliverable", key: `deliverable-${item.id}`, item })
    })

    unlinkedDeliverables.forEach((item) => {
      cards.push({ kind: "deliverable", key: `deliverable-${item.id}`, item })
    })

    return cards
  }, [items, orderedModules])
  const visibleTimelineCards = useMemo(() => {
    if (!isSnakeGrid || selectedLessonGroup === LESSON_GROUP_ALL) {
      return timelineCards
    }

    const selectedGroup = lessonGroupOptions.find((group) => group.key === selectedLessonGroup)
    if (!selectedGroup) return timelineCards

    return timelineCards.filter((card) => {
      if (card.kind === "module") {
        return selectedGroup.moduleIds.has(card.module.id)
      }
      const linkedModuleId = card.item.homework?.moduleId
      if (linkedModuleId) {
        return selectedGroup.moduleIds.has(linkedModuleId)
      }
      const linkedModuleIndex = card.item.homework?.moduleIdx
      return typeof linkedModuleIndex === "number" && selectedGroup.moduleIndexes.has(linkedModuleIndex)
    })
  }, [isSnakeGrid, lessonGroupOptions, selectedLessonGroup, timelineCards])
  const ActiveLessonGroupIcon = useMemo(() => {
    if (selectedLessonGroup === LESSON_GROUP_ALL) return Layers
    const activeGroup = lessonGroupOptions.find((group) => group.key === selectedLessonGroup)
    return getTrackIcon(activeGroup?.label)
  }, [lessonGroupOptions, selectedLessonGroup])

  const defaultActiveIndex = useMemo(() => {
    if (items.length === 0) return 0
    const nextIndex = items.findIndex((item) => item.status !== "complete")
    if (nextIndex >= 0) return nextIndex
    return Math.max(items.length - 1, 0)
  }, [items])

  const [activeIndex, setActiveIndex] = useState(defaultActiveIndex)

  const railSteps = useMemo<StepperRailStep[]>(
    () =>
      items.map((item, idx) => {
        const Icon = ROADMAP_SECTION_ICONS[item.id] ?? Flag
        return {
          id: item.id,
          label: item.displayTitle,
          status: item.status,
          description: item.displaySubtitle,
          icon: <Icon className="h-5 w-5" aria-hidden />,
          stepIndex: idx + 1,
        }
      }),
    [items],
  )

  useEffect(() => {
    setActiveIndex(defaultActiveIndex)
  }, [defaultActiveIndex])

  useEffect(() => {
    if (activeIndex > items.length - 1) {
      setActiveIndex(Math.max(items.length - 1, 0))
    }
  }, [activeIndex, items.length])

  useEffect(() => {
    if (selectedLessonGroup === LESSON_GROUP_ALL) return
    const exists = lessonGroupOptions.some((option) => option.key === selectedLessonGroup)
    if (!exists) setSelectedLessonGroup(LESSON_GROUP_ALL)
  }, [lessonGroupOptions, selectedLessonGroup])

  const navigateToIndex = (index: number) => {
    setActiveIndex(index)
    const href = items[index]?.href
    if (href) router.push(href)
  }

  const shellClass =
    surface === "card"
      ? "w-full rounded-2xl border border-border/60 bg-card/40 p-4 sm:p-5"
      : "w-full space-y-4"

  return (
    <section className={cn(shellClass, className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <WaypointsIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
            {title}
          </p>
          <p className="text-xs text-muted-foreground">
            {subtitle}
          </p>
        </div>
        {!isSnakeGrid ? (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => navigateToIndex(Math.max(activeIndex - 1, 0))}
              disabled={activeIndex <= 0 || items.length === 0}
              aria-label="Previous roadmap section"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => navigateToIndex(Math.min(activeIndex + 1, Math.max(items.length - 1, 0)))}
              disabled={activeIndex >= items.length - 1 || items.length === 0}
              aria-label="Next roadmap section"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        ) : lessonGroupOptions.length > 0 ? (
          <div className="ml-auto w-[240px] min-w-[240px] max-w-[240px] shrink-0">
            <Select value={selectedLessonGroup} onValueChange={setSelectedLessonGroup}>
              <SelectTrigger
                id="lesson-group-picker"
                aria-label="Choose a class track"
                className="h-9 w-full justify-start bg-background/80 text-left [&_[data-slot=select-value]]:justify-start [&_[data-slot=select-value]]:text-left [&>svg:last-child]:ml-auto"
              >
                <ActiveLessonGroupIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
                <SelectValue className="min-w-0 flex-1 truncate text-left" placeholder="All Modules" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value={LESSON_GROUP_ALL} hideIndicator icon={<Layers className="h-4 w-4" aria-hidden />}>
                  All Modules
                </SelectItem>
                {lessonGroupOptions.map((option) => {
                  const OptionIcon = getTrackIcon(option.label)
                  return (
                    <SelectItem
                      key={option.key}
                      value={option.key}
                      hideIndicator
                      icon={<OptionIcon className="h-4 w-4" aria-hidden />}
                    >
                      {option.label}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>

      {items.length > 0 && !isSnakeGrid ? (
        <div className="mt-4 flex items-center justify-center">
          <StepperRail
            steps={railSteps}
            activeIndex={activeIndex}
            onChange={navigateToIndex}
            pageSize={pageSize}
            showControls={false}
            variant="roadmap"
            className="w-full"
          />
        </div>
      ) : null}

      {isSnakeGrid ? (
        <RoadmapRailCardSnakeGrid cards={visibleTimelineCards} onDeliverableSelect={(index) => setActiveIndex(index)} />
      ) : (
        <p className="mt-4 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
          No roadmap sections found yet.
        </p>
      )}
    </section>
  )
}
