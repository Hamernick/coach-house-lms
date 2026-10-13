import type { ComponentProps } from "react"

import { CalendarDayButton } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

import {
  ROADMAP_CALENDAR_EVENT_MODIFIER_BY_TYPE,
  ROADMAP_CALENDAR_EVENT_TYPE_META,
  ROADMAP_CALENDAR_EVENT_TYPE_ORDER,
} from "./roadmap-calendar-event-style"

export function RoadmapCalendarDayWithEventDots({
  className,
  children,
  modifiers,
  ...props
}: ComponentProps<typeof CalendarDayButton>) {
  const visibleDots = ROADMAP_CALENDAR_EVENT_TYPE_ORDER.filter((eventType) =>
    Boolean(modifiers?.[ROADMAP_CALENDAR_EVENT_MODIFIER_BY_TYPE[eventType]]),
  ).slice(0, 3)

  return (
    <CalendarDayButton
      {...props}
      modifiers={modifiers}
      className={cn(
        className,
        "relative min-h-10 min-w-0 rounded-xl border border-transparent bg-transparent text-sm font-semibold text-foreground tabular-nums",
        "hover:bg-muted/35 focus-visible:ring-2 focus-visible:ring-ring/45",
        "data-[selected-single=true]:!border-border/50 data-[selected-single=true]:!bg-muted/75 data-[selected-single=true]:!text-foreground data-[selected-single=true]:!shadow-none",
        "group-data-[focused=true]/day:ring-2 group-data-[focused=true]/day:ring-ring/35",
        "[&>span]:!opacity-100",
        modifiers?.today &&
          "border-border/55 bg-background hover:bg-background",
        modifiers?.outside && "text-muted-foreground/35",
      )}
    >
      <span className="absolute inset-x-0 top-2 text-center !text-sm leading-none">
        {children}
      </span>
      {visibleDots.length > 0 ? (
        <span
          className="absolute inset-x-0 bottom-1.5 flex justify-center gap-1"
          aria-hidden
        >
          {visibleDots.map((eventType) => (
            <span
              key={eventType}
              className={cn(
                "size-1.5 rounded-full",
                ROADMAP_CALENDAR_EVENT_TYPE_META[eventType].dotClassName,
              )}
            />
          ))}
        </span>
      ) : null}
    </CalendarDayButton>
  )
}
