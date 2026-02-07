"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right"
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2"
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left"
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right"
import Flag from "lucide-react/dist/esm/icons/flag"
import WaypointsIcon from "lucide-react/dist/esm/icons/waypoints"
import Layers from "lucide-react/dist/esm/icons/layers"

import { NewsGradientThumb } from "@/components/news/gradient-thumb"
import { ROADMAP_SECTION_ICONS } from "@/components/roadmap/roadmap-icons"
import { GridPattern } from "@/components/ui/shadcn-io/grid-pattern/index"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StepperRail, type StepperRailStep } from "@/components/ui/stepper-rail"
import { getTrackIcon } from "@/lib/accelerator/track-icons"
import { sortAcceleratorModules } from "@/lib/accelerator/module-order"
import type { ModuleCard, ModuleCardStatus } from "@/lib/accelerator/progress"
import type { RoadmapSection } from "@/lib/roadmap"
import { cn } from "@/lib/utils"

export type RoadmapTimelineModule = ModuleCard & {
  groupTitle?: string
  sequence?: number
}

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

type RoadmapRailItem = RoadmapSection & {
  displayTitle: string
  displaySubtitle: string
  href: string
  idx: number
}

type TimelineCard =
  | { kind: "deliverable"; key: string; item: RoadmapRailItem }
  | { kind: "module"; key: string; module: RoadmapTimelineModule }

const LESSON_GROUP_ALL = "__all_groups__"
const STATUS_BADGE_OVERLAY_CLASS =
  "absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium backdrop-blur-sm"
const ROADMAP_MEDIA_SQUARES: Array<[number, number]> = [
  [4, 4],
  [5, 1],
  [8, 2],
  [5, 3],
  [5, 5],
  [10, 10],
  [12, 15],
  [15, 10],
  [10, 15],
  [15, 10],
]

function statusMeta(item: RoadmapRailItem) {
  if (item.status === "complete") {
    return {
      label: "Complete",
      dotClass: "bg-emerald-500",
      badgeClass:
        "border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-500/15 dark:text-emerald-200",
    }
  }
  if (item.status === "in_progress") {
    return {
      label: "In progress",
      dotClass: "bg-amber-500",
      badgeClass:
        "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-900/50 dark:bg-amber-500/15 dark:text-amber-200",
    }
  }
  return {
    label: "Not started",
    dotClass: "bg-zinc-400 dark:bg-zinc-500",
    badgeClass:
      "border-zinc-300 bg-zinc-100 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100",
  }
}

function moduleStatusMeta(status: ModuleCardStatus) {
  if (status === "completed") {
    return {
      label: "Completed",
      cta: "Review",
      badgeClass:
        "border-emerald-300 bg-emerald-50/95 text-emerald-700 dark:border-emerald-500/35 dark:bg-emerald-500/12 dark:text-emerald-200",
    }
  }
  if (status === "in_progress") {
    return {
      label: "In progress",
      cta: "Continue",
      badgeClass:
        "border-amber-300 bg-amber-50/95 text-amber-700 dark:border-amber-500/35 dark:bg-amber-500/12 dark:text-amber-200",
    }
  }
  return {
    label: "Not started",
    cta: "Start",
    badgeClass: "border-border/60 bg-background/70 text-muted-foreground",
  }
}

export function RoadmapRailCard({
  sections,
  className,
  title = "Strategic Roadmap",
  subtitle = "Jump into any section and continue building.",
  pageSize = 4,
  surface = "card",
  hrefBase = "/roadmap",
  layout = "rail",
  modules = [],
}: RoadmapRailCardProps) {
  const router = useRouter()
  const isSnakeGrid = layout === "snake-grid"

  const normalizedHrefBase = useMemo(() => {
    const trimmed = hrefBase.trim()
    if (!trimmed) return "/roadmap"
    const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`
    return withLeadingSlash.replace(/\/+$/, "")
  }, [hrefBase])

  const items = useMemo<RoadmapRailItem[]>(() => {
    return sections.map((section, idx) => {
      const href = `${normalizedHrefBase}/${section.slug ?? section.id}`
      const displayTitle = section.titleIsTemplate
        ? section.templateTitle
        : section.title?.trim() || section.templateTitle
      const displaySubtitle = section.subtitleIsTemplate
        ? section.templateSubtitle
        : section.subtitle?.trim() || section.templateSubtitle
      return {
        ...section,
        displayTitle,
        displaySubtitle,
        href,
        idx,
      }
    })
  }, [normalizedHrefBase, sections])

  const orderedModules = useMemo(() => sortAcceleratorModules(modules), [modules])
  const lessonGroupOptions = useMemo(() => {
    const groups = new Map<
      string,
      {
        key: string
        label: string
        moduleIds: Set<string>
        moduleIndexes: Set<number>
      }
    >()

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
                aria-label="Filter by lesson group"
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

      {visibleTimelineCards.length > 0 && isSnakeGrid ? (
        <div className="mt-4">
          <div className="relative">
            <div className="relative z-10 grid auto-rows-[minmax(220px,auto)] gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 md:gap-4">
              {visibleTimelineCards.map((card) => {
                if (card.kind === "deliverable") {
                  const { item } = card
                  const Icon = ROADMAP_SECTION_ICONS[item.id] ?? Flag
                  const active = item.idx === activeIndex
                  const meta = statusMeta(item)

                  return (
                    <div key={card.key} className="min-w-0 h-full">
                      <Link
                        href={item.href}
                        title={item.displayTitle}
                        aria-label={`Go to ${item.displayTitle}`}
                        aria-current={active ? "step" : undefined}
                        onClick={() => setActiveIndex(item.idx)}
                        className={cn(
                          "group relative flex h-full min-h-[200px] flex-col overflow-hidden rounded-[26px] border border-border/60 bg-card text-left transition-transform duration-300 ease-out",
                          "hover:-translate-y-1",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
                          active ? "border-primary/50 ring-1 ring-primary/20" : "border-border/60",
                        )}
                      >
                        <div className="relative mb-3 ml-[5px] mr-[5px] mt-[5px] aspect-[4/3] overflow-hidden rounded-[22px] border border-border/60 bg-muted/20">
                          <GridPattern
                            patternId={`roadmap-deliverable-media-${item.id}`}
                            squares={ROADMAP_MEDIA_SQUARES}
                            className="inset-x-0 inset-y-[-45%] h-[200%] skew-y-12 [mask-image:radial-gradient(220px_circle_at_center,white,transparent)] opacity-70"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span
                              data-roadmap-node="true"
                              className="inline-flex h-11 min-w-11 items-center justify-center rounded-xl border border-border/60 bg-background/80 px-3 text-muted-foreground backdrop-blur-sm"
                            >
                              <Icon className="h-4 w-4" aria-hidden />
                            </span>
                          </div>
                          <span
                            className={cn(
                              STATUS_BADGE_OVERLAY_CLASS,
                              meta.badgeClass,
                            )}
                          >
                            <span className={cn("h-1.5 w-1.5 rounded-full", meta.dotClass)} aria-hidden />
                            {meta.label}
                          </span>
                        </div>

                        <div className="relative mt-0.5 flex flex-1 flex-col gap-2 px-4 pb-11">
                          <p className="text-sm font-semibold text-foreground">{item.displayTitle}</p>
                          <p className="line-clamp-3 text-xs text-muted-foreground">{item.displaySubtitle}</p>
                          <p className="absolute bottom-4 left-4 inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                            Open deliverable
                          </p>
                        </div>
                      </Link>
                    </div>
                  )
                }

                const { module } = card
                const meta = moduleStatusMeta(module.status)
                const ModuleTrackIcon = getTrackIcon(module.groupTitle ?? module.title)

                const cardBody = (
                  <>
                    <div className="relative mb-3 ml-[5px] mr-[5px] mt-[5px] aspect-[4/3] overflow-hidden rounded-[22px]">
                      <NewsGradientThumb seed={`timeline-module-${module.id}`} className="absolute inset-0" />
                      <GridPattern
                        patternId={`roadmap-module-media-${module.id}`}
                        squares={ROADMAP_MEDIA_SQUARES}
                        className="inset-x-0 inset-y-[-45%] h-[200%] skew-y-12 [mask-image:radial-gradient(220px_circle_at_center,white,transparent)] opacity-45"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span
                          data-roadmap-node="true"
                          title={module.groupTitle ?? module.title}
                          aria-label={module.groupTitle ?? module.title}
                          className="inline-flex h-11 min-w-11 items-center justify-center rounded-xl border border-border/60 bg-background/80 px-3 text-muted-foreground backdrop-blur-sm"
                        >
                          <ModuleTrackIcon className="h-4 w-4" aria-hidden />
                        </span>
                      </div>
                      <span
                        className={cn(
                          STATUS_BADGE_OVERLAY_CLASS,
                          meta.badgeClass,
                        )}
                      >
                        {module.status === "completed" ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> : null}
                        <span>{meta.label}</span>
                      </span>
                    </div>

                    <div className="relative mt-0.5 flex flex-1 flex-col gap-2 px-4 pb-11">
                      <p className="text-sm font-semibold text-foreground">{module.title}</p>
                      {module.description ? (
                        <p className="line-clamp-3 text-xs text-muted-foreground">{module.description}</p>
                      ) : null}
                      <p className="absolute bottom-4 left-4 inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                        Open module
                      </p>
                    </div>
                  </>
                )

                return (
                  <div key={card.key} className="min-w-0 h-full">
                    <Link
                      href={module.href}
                      className={cn(
                        "group flex h-full min-h-[200px] flex-col overflow-hidden rounded-[26px] border border-border/60 bg-card text-left transition-transform duration-300 ease-out",
                        "hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                      )}
                    >
                      {cardBody}
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-4 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
          No roadmap sections found yet.
        </p>
      )}
    </section>
  )
}
