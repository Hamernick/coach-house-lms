import * as React from "react"

import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

type Calendar01Props = React.ComponentProps<typeof Calendar>

export default function Calendar01({ className, ...props }: Calendar01Props) {
  return (
    <Calendar
      className={cn("w-full rounded-lg border border-border/60 bg-background/20 p-3 shadow-none", className)}
      formatters={{
        formatWeekdayName: (date) =>
          date
            .toLocaleDateString(undefined, { weekday: "short" })
            .slice(0, 1)
            .toUpperCase(),
      }}
      classNames={{
        root: "w-full",
        month: "w-full gap-3",
        month_caption: "relative h-8 justify-start px-0",
        caption_label: "text-lg font-semibold tracking-tight",
        nav: "absolute right-0 top-0 inset-x-auto w-auto justify-end gap-1",
        weekdays: "mt-1 grid grid-cols-7 gap-1",
        weekday:
          "text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground",
        week: "mt-1 grid w-full grid-cols-7 gap-1",
        day: "aspect-square p-0 text-center",
        today: "rounded-md bg-muted text-foreground",
      }}
      {...props}
    />
  )
}
