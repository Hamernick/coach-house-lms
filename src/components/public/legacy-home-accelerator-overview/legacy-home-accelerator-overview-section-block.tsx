"use client"

import { useState } from "react"

import { cn } from "@/lib/utils"

import {
  ACCELERATOR_PREVIEW_SLIDES,
  SUPPORT_BOOKING_SLOTS,
  SUPPORT_CALENDAR_EVENT_DAYS,
  SUPPORT_CALENDAR_WEEKDAY_LABELS,
} from "./constants"
import { AcceleratorPreviewDots } from "./accelerator-preview-dots"
import { AcceleratorPreviewRightPanel } from "./accelerator-preview-right-panel"
import { buildCalendarGrid } from "./helpers"

type LegacyHomeAcceleratorOverviewSectionBlockProps = {
  interClassName: string
}

export function LegacyHomeAcceleratorOverviewSectionBlock({
  interClassName,
}: LegacyHomeAcceleratorOverviewSectionBlockProps) {
  const [activeSlide, setActiveSlide] = useState(0)
  const [supportCalendarMonth, setSupportCalendarMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [supportSelectedDay, setSupportSelectedDay] = useState(() => new Date().getDate())
  const [supportSelectedSlot, setSupportSelectedSlot] = useState(0)

  const slide = ACCELERATOR_PREVIEW_SLIDES[activeSlide] ?? ACCELERATOR_PREVIEW_SLIDES[0]
  const slideCount = ACCELERATOR_PREVIEW_SLIDES.length

  const supportCalendarYear = supportCalendarMonth.getFullYear()
  const supportCalendarMonthIndex = supportCalendarMonth.getMonth()
  const supportCalendarMonthLabel = new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(supportCalendarMonth)

  const supportCalendarGrid = buildCalendarGrid(
    supportCalendarYear,
    supportCalendarMonthIndex,
  )

  const jumpToSlide = (index: number) => {
    const normalized = ((index % slideCount) + slideCount) % slideCount
    setActiveSlide(normalized)
  }

  const shiftSupportCalendarMonth = (delta: -1 | 1) => {
    setSupportCalendarMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + delta, 1),
    )
  }

  return (
    <div className={cn(interClassName, "w-full max-w-[980px] space-y-4 lg:min-h-[590px]")}>
      <div className="mx-auto flex w-full max-w-[520px] items-stretch lg:min-h-[510px]">
        <AcceleratorPreviewRightPanel
          slide={slide}
          supportCalendarMonthLabel={supportCalendarMonthLabel}
          supportCalendarWeekdayLabels={SUPPORT_CALENDAR_WEEKDAY_LABELS}
          supportCalendarGrid={supportCalendarGrid}
          supportCalendarEventDays={SUPPORT_CALENDAR_EVENT_DAYS}
          supportSelectedDay={supportSelectedDay}
          supportBookingSlots={SUPPORT_BOOKING_SLOTS}
          supportSelectedSlot={supportSelectedSlot}
          onShiftSupportCalendarMonth={shiftSupportCalendarMonth}
          onSelectSupportDay={setSupportSelectedDay}
          onSelectSupportSlot={setSupportSelectedSlot}
        />
      </div>

      <AcceleratorPreviewDots
        activeSlide={activeSlide}
        slides={ACCELERATOR_PREVIEW_SLIDES}
        onJumpToSlide={jumpToSlide}
      />
    </div>
  )
}
