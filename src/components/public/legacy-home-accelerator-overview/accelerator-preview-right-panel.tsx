"use client"

import { AnimatePresence, motion } from "framer-motion"

import Check from "lucide-react/dist/esm/icons/check"
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left"
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { stepCircleClass, stepTextClass } from "./helpers"
import type { AcceleratorPreviewSlide } from "./types"

type AcceleratorPreviewRightPanelProps = {
  slide: AcceleratorPreviewSlide
  supportCalendarMonthLabel: string
  supportCalendarWeekdayLabels: string[]
  supportCalendarGrid: Array<number | null>
  supportCalendarEventDays: Set<number>
  supportSelectedDay: number
  supportBookingSlots: string[]
  supportSelectedSlot: number
  onShiftSupportCalendarMonth: (delta: -1 | 1) => void
  onSelectSupportDay: (day: number) => void
  onSelectSupportSlot: (index: number) => void
}

export function AcceleratorPreviewRightPanel({
  slide,
  supportCalendarMonthLabel,
  supportCalendarWeekdayLabels,
  supportCalendarGrid,
  supportCalendarEventDays,
  supportSelectedDay,
  supportBookingSlots,
  supportSelectedSlot,
  onShiftSupportCalendarMonth,
  onSelectSupportDay,
  onSelectSupportSlot,
}: AcceleratorPreviewRightPanelProps) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[24px] border border-border/60 bg-background p-5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {slide.id === "support" ? (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${slide.id}-booking-preview`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="space-y-3"
            >
              <div className="rounded-lg border border-border/60 bg-background/20 p-3">
                <div className="flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onShiftSupportCalendarMonth(-1)}
                    className="h-7 w-7 rounded-md text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground"
                    aria-label="Show previous month"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                  </Button>
                  <p className="text-lg font-semibold tracking-tight text-foreground">
                    {supportCalendarMonthLabel}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onShiftSupportCalendarMonth(1)}
                    className="h-7 w-7 rounded-md text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground"
                    aria-label="Show next month"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </Button>
                </div>

                <div className="mt-3 grid grid-cols-7 gap-1">
                  {supportCalendarWeekdayLabels.map((label) => (
                    <span
                      key={label}
                      className="text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {label.slice(0, 1)}
                    </span>
                  ))}
                </div>
                <div className="mt-1.5 grid grid-cols-7 gap-1">
                  {supportCalendarGrid.map((day, index) => {
                    if (!day) {
                      return (
                        <span
                          key={`support-calendar-empty-${index}`}
                          className="aspect-square min-h-7 rounded-md"
                          aria-hidden
                        />
                      )
                    }
                    const hasEvent = supportCalendarEventDays.has(day)
                    const isSelected = supportSelectedDay === day
                    return (
                      <Button
                        key={`support-calendar-day-${day}`}
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectSupportDay(day)}
                        className={cn(
                          "h-auto aspect-square min-h-7 rounded-md text-xs font-medium tabular-nums transition",
                          isSelected
                            ? "bg-foreground text-background"
                            : hasEvent
                              ? "bg-muted text-foreground"
                              : "bg-background/60 text-muted-foreground hover:text-foreground",
                        )}
                        aria-pressed={isSelected}
                      >
                        {day}
                      </Button>
                    )
                  })}
                </div>

                <div className="mt-3 space-y-2">
                  {supportBookingSlots.map((slot, index) => {
                    const selected = index === supportSelectedSlot
                    return (
                      <Button
                        key={slot}
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectSupportSlot(index)}
                        className={cn(
                          "h-auto w-full justify-between rounded-lg border px-3 py-2 text-sm transition",
                          selected
                            ? "border-foreground/70 bg-background text-foreground shadow-sm"
                            : "border-border/70 bg-background/70 text-muted-foreground hover:text-foreground",
                        )}
                        aria-pressed={selected}
                      >
                        <span>{slot}</span>
                        <span className="text-[10px] uppercase tracking-wide">Book</span>
                      </Button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.ul
              key={`${slide.id}-steps`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="space-y-2"
            >
              {slide.steps.map((step, index) => (
                <li key={`${slide.id}-${step.label}`} className="flex items-center gap-2.5">
                  <span className={stepCircleClass(step.state)} aria-hidden>
                    {step.state === "complete" ? (
                      <Check className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <span className={stepTextClass(step.state)}>{step.label}</span>
                </li>
              ))}
            </motion.ul>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
