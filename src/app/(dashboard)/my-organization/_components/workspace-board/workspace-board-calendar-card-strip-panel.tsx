"use client"

import { type ReactNode, useEffect, useState } from "react"
import ChevronLeftIcon from "lucide-react/dist/esm/icons/chevron-left"
import ChevronRightIcon from "lucide-react/dist/esm/icons/chevron-right"

import { Button } from "@/components/ui/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"
import { cn } from "@/lib/utils"

import type { MyOrganizationCalendarView } from "../../_lib/types"
import { WORKSPACE_CARD_LAYOUT_SYSTEM } from "./workspace-board-card-layout-system"
import { buildCalendarStripEventPreview } from "./workspace-board-calendar-card-strip-data"
import { WorkspaceBoardCalendarCardStripEventDetailsSheet } from "./workspace-board-calendar-card-strip-event-details-sheet"
import {
  buildCalendarDayKey,
  isSameCalendarDay,
  startOfLocalDay,
} from "./workspace-board-calendar-card-strip-utils"

const FULLSCREEN_STRIP_PAGE_SIZE = 7

function formatCalendarStripMonth(date: Date) {
  return new Intl.DateTimeFormat(undefined, { month: "short" }).format(date)
}

function formatCalendarStripDay(date: Date) {
  return new Intl.DateTimeFormat(undefined, { day: "numeric" }).format(date)
}

function formatCalendarStripHeading(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date)
}

export function CalendarDateStripEventsPanel({
  calendar,
  compactCanvasCard,
  showTopDivider = true,
  headerAction,
  stripSelectedDate,
  stripDays,
  eventDayKeys,
  selectedDayEvents,
  visibleEvents,
  onSelectStripDate,
  onShiftStripDays,
}: {
  calendar: MyOrganizationCalendarView
  compactCanvasCard: boolean
  showTopDivider?: boolean
  headerAction?: ReactNode
  stripSelectedDate: Date
  stripDays: Date[]
  eventDayKeys: Set<string>
  selectedDayEvents: MyOrganizationCalendarView["upcomingEvents"]
  visibleEvents: MyOrganizationCalendarView["upcomingEvents"]
  onSelectStripDate: (date: Date) => void
  onShiftStripDays: (deltaDays: number) => void
}) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [eventDetailsOpen, setEventDetailsOpen] = useState(false)
  const { eventItems, selectedDayEventCount } = buildCalendarStripEventPreview({
    visibleEvents,
    selectedDayEvents,
  })
  const selectedEventItem =
    eventItems.find((event) => event.id === selectedEventId) ?? null

  useEffect(() => {
    if (compactCanvasCard) return
    if (!carouselApi) return

    const sync = () => {
      setCanScrollPrev(carouselApi.canScrollPrev())
      setCanScrollNext(carouselApi.canScrollNext())
    }

    sync()
    carouselApi.on("select", sync)
    carouselApi.on("reInit", sync)

    return () => {
      carouselApi.off("select", sync)
      carouselApi.off("reInit", sync)
    }
  }, [carouselApi, compactCanvasCard])

  const todayDate = startOfLocalDay(new Date())
  const isTodaySelected = isSameCalendarDay(stripSelectedDate, todayDate)

  const handleGoToToday = () => {
    onSelectStripDate(todayDate)
  }

  const handleEventSelect = (eventId: string) => {
    setSelectedEventId(eventId)
    setEventDetailsOpen(true)
  }

  const handlePrev = () => {
    if (compactCanvasCard || !carouselApi) {
      onShiftStripDays(-1)
      return
    }
    const currentIndex = carouselApi.selectedScrollSnap()
    const nextIndex = Math.max(0, currentIndex - FULLSCREEN_STRIP_PAGE_SIZE)
    carouselApi.scrollTo(nextIndex)
  }

  const handleNext = () => {
    if (compactCanvasCard || !carouselApi) {
      onShiftStripDays(1)
      return
    }
    const currentIndex = carouselApi.selectedScrollSnap()
    const maxIndex = Math.max(0, carouselApi.scrollSnapList().length - 1)
    const nextIndex = Math.min(maxIndex, currentIndex + FULLSCREEN_STRIP_PAGE_SIZE)
    carouselApi.scrollTo(nextIndex)
  }

  const renderDateTile = (date: Date) => {
    const isActive = isSameCalendarDay(date, stripSelectedDate)
    const isToday = isSameCalendarDay(date, todayDate)
    const hasEvent = eventDayKeys.has(buildCalendarDayKey(date))

    return (
      <Button
        key={date.toISOString()}
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onSelectStripDate(date)}
        className={cn(
          "group relative grid h-auto w-full aspect-square min-w-0 place-items-center p-0 text-center transition-colors",
          compactCanvasCard ? "rounded-md" : "rounded-lg",
          isActive
            ? "bg-foreground text-background"
            : "bg-transparent text-foreground hover:bg-background/70",
        )}
        aria-pressed={isActive}
        aria-label={formatCalendarStripHeading(date)}
      >
        <span className="grid translate-y-[-1px] place-items-center gap-0.5">
          <span
            className={cn(
              compactCanvasCard ? "text-[8px]" : "text-[10px]",
              "leading-none",
              isActive ? "text-background/75" : "text-muted-foreground",
            )}
          >
            {formatCalendarStripMonth(date)}
          </span>
          <span
            className={cn(
              compactCanvasCard ? "text-sm" : "text-lg",
              "font-semibold leading-none tabular-nums",
            )}
          >
            {formatCalendarStripDay(date)}
          </span>
        </span>
        <span
          className={cn(
            compactCanvasCard
              ? "absolute right-1 top-1 h-1 w-1 rounded-full"
              : "absolute right-1.5 top-1.5 h-1 w-1 rounded-full",
            isToday
              ? isActive
                ? "bg-background/85"
                : "bg-foreground/70"
              : "bg-transparent",
          )}
          aria-hidden
        />
        <span
          className={cn(
            compactCanvasCard
              ? "absolute bottom-1 h-1 w-1 rounded-full"
              : "absolute bottom-1.5 h-1 w-1 rounded-full",
            hasEvent
              ? isActive
                ? "bg-background/80"
                : "bg-foreground/70"
              : "bg-transparent",
          )}
          aria-hidden
        />
      </Button>
    )
  }

  return (
    <div
      className={cn(
        WORKSPACE_CARD_LAYOUT_SYSTEM.flexColumn,
        !compactCanvasCard && WORKSPACE_CARD_LAYOUT_SYSTEM.flexFill,
        "overflow-hidden",
        showTopDivider && "border-t border-border/50 pt-3",
      )}
    >
      <div
        className={cn(
          WORKSPACE_CARD_LAYOUT_SYSTEM.flexColumn,
          !compactCanvasCard && WORKSPACE_CARD_LAYOUT_SYSTEM.flexFill,
          "px-0.5",
        )}
      >
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("shrink-0 rounded-full", compactCanvasCard ? "h-[28px] w-[28px]" : "h-8 w-8")}
            onClick={handlePrev}
            disabled={!compactCanvasCard && !canScrollPrev}
            aria-label={compactCanvasCard ? "Show previous date" : "Scroll dates left"}
          >
            <ChevronLeftIcon className="h-4 w-4" aria-hidden />
          </Button>
          {compactCanvasCard ? (
            <div className="grid min-w-0 flex-1 grid-cols-5 gap-1.5">
              {stripDays.map((date) => renderDateTile(date))}
            </div>
          ) : (
            <Carousel
              className="min-w-0 flex-1"
              opts={{ align: "start", containScroll: "trimSnaps", dragFree: true }}
              setApi={setCarouselApi}
            >
              <CarouselContent className="-ml-1.5">
                {stripDays.map((date) => (
                  <CarouselItem
                    key={date.toISOString()}
                    className="basis-[14.285714%] pl-1.5"
                  >
                    {renderDateTile(date)}
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("shrink-0 rounded-full", compactCanvasCard ? "h-[28px] w-[28px]" : "h-8 w-8")}
            onClick={handleNext}
            disabled={!compactCanvasCard && !canScrollNext}
            aria-label={compactCanvasCard ? "Show next date" : "Scroll dates right"}
          >
            <ChevronRightIcon className="h-4 w-4" aria-hidden />
          </Button>
        </div>

        <div
          className={cn(
            "mt-3 flex flex-col border-t border-border/35 pt-3",
            !compactCanvasCard && "min-h-0 flex-1",
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {formatCalendarStripHeading(stripSelectedDate)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {selectedDayEventCount > 0
                  ? `${selectedDayEventCount} event${selectedDayEventCount === 1 ? "" : "s"} on this day`
                  : "No events on this day"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                type="button"
                variant={isTodaySelected ? "secondary" : "outline"}
                size="sm"
                className="h-7 px-2 text-[11px]"
                onClick={handleGoToToday}
              >
                Today
              </Button>
              {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
            </div>
          </div>

          <div
            className={cn(
              "mt-2 flex flex-col gap-2",
              !compactCanvasCard && "min-h-0 flex-1",
            )}
          >
            <div
              className={cn(
                "nowheel pb-2 pr-1",
                !compactCanvasCard && "min-h-0 flex-1 overflow-y-auto",
              )}
            >
              {eventItems.length > 0 ? (
                <div className="space-y-2">
                  {eventItems.map((event) => (
                    <Button
                      key={event.id}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEventSelect(event.id)}
                      className={cn(
                        "bg-muted/55 relative flex h-auto w-full flex-col items-start gap-0.5 rounded-md border border-border/50 px-2 py-1.5 pl-6 text-left whitespace-normal before:absolute before:inset-y-1.5 before:left-2 before:w-1 before:rounded-full hover:bg-muted/75 focus-visible:ring-2 focus-visible:ring-primary/40",
                        event.accentClassName,
                      )}
                      aria-label={`Open details for ${event.title}`}
                    >
                      <p
                        className={cn(
                          WORKSPACE_CARD_LAYOUT_SYSTEM.textWrap,
                          "line-clamp-1 text-xs leading-tight font-medium text-foreground",
                        )}
                      >
                        {event.title}
                      </p>
                      <p
                        className={cn(
                          WORKSPACE_CARD_LAYOUT_SYSTEM.textWrap,
                          "line-clamp-1 text-[10px] leading-tight text-muted-foreground",
                        )}
                      >
                        {event.timeLabel}
                      </p>
                      {event.invitesLabel ? (
                        <p
                          className={cn(
                            WORKSPACE_CARD_LAYOUT_SYSTEM.textWrap,
                            "line-clamp-1 text-[10px] leading-tight text-muted-foreground",
                          )}
                        >
                          {event.invitesLabel}
                        </p>
                      ) : null}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Add milestones in the full calendar to keep board rhythm visible.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <WorkspaceBoardCalendarCardStripEventDetailsSheet
        item={selectedEventItem}
        open={eventDetailsOpen}
        onOpenChange={(open) => {
          setEventDetailsOpen(open)
          if (!open) {
            setSelectedEventId(null)
          }
        }}
      />
    </div>
  )
}
