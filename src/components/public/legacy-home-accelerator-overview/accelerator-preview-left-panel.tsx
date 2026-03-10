"use client"

import { AnimatePresence, motion } from "framer-motion"

import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right"
import CalendarCheck from "lucide-react/dist/esm/icons/calendar-check"
import WaypointsIcon from "lucide-react/dist/esm/icons/waypoints"

import { CoachingAvatarGroup } from "@/components/coaching/coaching-avatar-group"
import { NewsGradientThumb } from "@/components/news/gradient-thumb"
import { GridPattern } from "@/components/ui/shadcn-io/grid-pattern/index"
import { cn } from "@/lib/utils"

import { resolveModuleStatus } from "./helpers"
import type {
  AcceleratorPreviewContext,
  AcceleratorPreviewSlide,
  RoadmapPreviewItem,
} from "./types"

type AcceleratorPreviewLeftPanelProps = {
  slide: AcceleratorPreviewSlide
  previewContext: AcceleratorPreviewContext
  roadmapPreviewItems: RoadmapPreviewItem[]
}

export function AcceleratorPreviewLeftPanel({
  slide,
  previewContext,
  roadmapPreviewItems,
}: AcceleratorPreviewLeftPanelProps) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[24px] border border-border/60 bg-background/60 p-5">
      <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
        {slide.title}
      </h2>
      <p className="mt-2 max-w-lg text-sm text-muted-foreground sm:text-base">
        {slide.subtitle}
      </p>

      <div className="mt-5 rounded-2xl border border-border/70 bg-background/70 px-3 py-2.5">
        <p className="text-sm text-foreground">{previewContext.detail}</p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {previewContext.points.map((point) => (
            <span
              key={`${slide.id}-${point}`}
              className="inline-flex items-center rounded-full border border-border/70 bg-background px-2.5 py-1 text-[11px] text-muted-foreground"
            >
              {point}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
        {slide.id === "roadmap" ? (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${slide.id}-roadmap-preview`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="space-y-3"
            >
              <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <WaypointsIcon className="h-4 w-4" aria-hidden />
                Strategic Roadmap
              </p>

              <div className="relative w-full min-w-0 space-y-1.5 pl-4 pr-2 text-sm">
                <span
                  aria-hidden
                  className="absolute left-1 top-0 h-full w-px rounded-full bg-border/60"
                />
                {roadmapPreviewItems.map((item) => {
                  const statusClass =
                    item.state === "complete"
                      ? "bg-emerald-500"
                      : item.state === "in_progress"
                        ? "bg-amber-500"
                        : "bg-border"
                  return (
                    <div
                      key={`${slide.id}-${item.label}`}
                      className="flex min-w-0 items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-muted-foreground"
                    >
                      <span className="min-w-0 truncate text-sm font-medium">{item.label}</span>
                      <span
                        aria-hidden
                        className={cn("h-2 w-2 shrink-0 rounded-full", statusClass)}
                      />
                    </div>
                  )
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${slide.id}-modules`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="grid gap-3 sm:grid-cols-2"
            >
              {slide.modules.map((module) => {
                const moduleStatus = resolveModuleStatus(module.status)
                if (module.variant === "coaching") {
                  return (
                    <article
                      key={`${slide.id}-module-${module.index}`}
                      className="group flex min-h-[182px] flex-col overflow-hidden rounded-[22px] border border-border/60 bg-card text-left shadow-sm"
                    >
                      <div className="relative mx-[5px] mb-2 mt-[5px] flex min-h-[106px] flex-1 overflow-hidden rounded-[18px] bg-muted/35">
                        <NewsGradientThumb seed="accelerator-coaching" className="absolute inset-0" />
                        <span className="absolute left-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/85 text-muted-foreground shadow-sm">
                          <CalendarCheck className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="absolute bottom-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/85 text-muted-foreground shadow-sm">
                          <ArrowUpRight className="h-4 w-4" aria-hidden />
                        </span>
                      </div>
                      <div className="space-y-1 px-3 pb-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            Support
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                              moduleStatus.className,
                            )}
                          >
                            {moduleStatus.label}
                          </span>
                        </div>
                        <p className="text-sm font-semibold leading-tight text-foreground">
                          {module.title}
                        </p>
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {module.description}
                        </p>
                        <div className="pt-1">
                          <CoachingAvatarGroup size="sm" />
                        </div>
                      </div>
                    </article>
                  )
                }

                return (
                  <article
                    key={`${slide.id}-module-${module.index}`}
                    className="group flex min-h-[182px] flex-col overflow-hidden rounded-[22px] border border-border/60 bg-card text-left shadow-sm"
                  >
                    <div className="relative mx-[5px] mb-2 mt-[5px] aspect-[5/3] overflow-hidden rounded-[18px] bg-muted/35">
                      <GridPattern
                        width={24}
                        height={24}
                        patternId={`accelerator-preview-module-${slide.id}-${module.index}`}
                        className="inset-x-0 inset-y-[-35%] h-[170%] skew-y-6 opacity-60 [mask-image:radial-gradient(220px_circle_at_center,white,transparent)]"
                      />
                      <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/5 via-transparent to-background/20" />
                      <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border/70 bg-background/85 text-foreground shadow-sm">
                          {module.icon}
                        </span>
                      </span>
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/85 px-2 py-1 text-[10px] font-medium text-muted-foreground shadow-sm">
                        Module {module.index}
                      </span>
                    </div>
                    <div className="space-y-1 px-3 pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          {moduleStatus.cta}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                            moduleStatus.className,
                          )}
                        >
                          {moduleStatus.label}
                        </span>
                      </div>
                      <p className="text-sm font-semibold leading-tight text-foreground">
                        {module.title}
                      </p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {module.description}
                      </p>
                    </div>
                  </article>
                )
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
