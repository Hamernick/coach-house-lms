import Link from "next/link"

import CalendarCheckIcon from "lucide-react/dist/esm/icons/calendar-check"
import ChevronLeftIcon from "lucide-react/dist/esm/icons/chevron-left"
import ChevronRightIcon from "lucide-react/dist/esm/icons/chevron-right"

import { MyOrganizationAddEventSheetButton } from "@/components/organization/my-organization-add-event-sheet-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

import { DASHBOARD_SUPPORT_CARD_CONTENT_CLASS, DASHBOARD_SUPPORT_CARD_FRAME_CLASS } from "../../../_lib/constants"
import { safeDateLabel } from "../../../_lib/helpers"
import type { MyOrganizationCalendarView } from "../../../_lib/types"

type MyOrganizationCalendarCardProps = {
  className?: string
  calendar: MyOrganizationCalendarView
}

export function MyOrganizationCalendarCard({ className, calendar }: MyOrganizationCalendarCardProps) {
  return (
    <Card data-bento-card="calendar" className={cn(className, DASHBOARD_SUPPORT_CARD_FRAME_CLASS)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarCheckIcon className="h-4 w-4" aria-hidden />
          Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className={cn(DASHBOARD_SUPPORT_CARD_CONTENT_CLASS, "space-y-3")}>
        <div className="space-y-1">
          <p className="text-base font-semibold text-foreground">{calendar.nextEvent?.title ?? "No upcoming events"}</p>
          <p className="text-sm text-muted-foreground">
            {calendar.nextEvent
              ? calendar.nextEvent.all_day
                ? safeDateLabel(calendar.nextEvent.starts_at)
                : safeDateLabel(calendar.nextEvent.starts_at, true)
              : "Add your first internal milestone to populate this view."}
          </p>
        </div>

        <div className="rounded-lg border border-border/60 bg-background/20 p-3">
          <div className="flex items-center justify-between gap-2">
            <Button asChild type="button" variant="ghost" size="icon" className="h-7 w-7 rounded-md">
              <Link href={calendar.previousMonthHref} aria-label={`Show ${calendar.previousMonthLabel}`}>
                <ChevronLeftIcon className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <p className="text-lg font-semibold tracking-tight text-foreground">{calendar.monthLabel}</p>
            <Button asChild type="button" variant="ghost" size="icon" className="h-7 w-7 rounded-md">
              <Link href={calendar.nextMonthHref} aria-label={`Show ${calendar.nextMonthLabel}`}>
                <ChevronRightIcon className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1">
            {calendar.weekdayLabels.map((label) => (
              <span key={label} className="text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {label.slice(0, 1)}
              </span>
            ))}
          </div>
          <div className="mt-1.5 grid grid-cols-7 gap-1">
            {calendar.grid.map((day, index) => {
              if (!day) {
                return <span key={`calendar-empty-${index}`} className="aspect-square min-h-7 rounded-md" aria-hidden />
              }
              const hasEvent = calendar.eventDays.has(day)
              const isSelected = calendar.selectedDay === day
              return (
                <span
                  key={`calendar-day-${day}`}
                  className={cn(
                    "inline-flex aspect-square min-h-7 items-center justify-center rounded-md text-xs font-medium tabular-nums",
                    isSelected
                      ? "bg-foreground text-background"
                      : hasEvent
                        ? "bg-muted text-foreground"
                        : "bg-background/60 text-muted-foreground",
                  )}
                >
                  {day}
                </span>
              )
            })}
          </div>
        </div>

        <div className="mt-auto pt-1">
          <MyOrganizationAddEventSheetButton />
        </div>
      </CardContent>
    </Card>
  )
}
