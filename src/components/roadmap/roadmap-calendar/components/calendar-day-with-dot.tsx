import type { ComponentProps } from "react"

import { CalendarDayButton } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

export function CalendarDayWithDot({
  className,
  modifiers,
  ...props
}: ComponentProps<typeof CalendarDayButton>) {
  return (
    <CalendarDayButton
      {...props}
      modifiers={modifiers}
      className={cn(
        className,
        "relative h-full rounded-md text-xs font-medium data-[selected-single=true]:!bg-zinc-800 data-[selected-single=true]:!text-white dark:data-[selected-single=true]:!bg-zinc-100 dark:data-[selected-single=true]:!text-zinc-900",
        modifiers?.hasEvent
          ? "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          : "text-zinc-500 hover:bg-zinc-100/60 dark:text-zinc-400 dark:hover:bg-zinc-800/50",
        modifiers?.today
          ? "before:absolute before:left-1/2 before:top-1 before:h-1 before:w-1 before:-translate-x-1/2 before:rounded-full before:bg-zinc-600 dark:before:bg-zinc-300 data-[selected-single=true]:before:bg-white dark:data-[selected-single=true]:before:bg-zinc-900"
          : "",
        modifiers?.hasEvent
          ? "after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-foreground/70 data-[selected-single=true]:after:bg-background"
          : "",
      )}
    />
  )
}
