"use client"

import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right"
import CalendarCheck from "lucide-react/dist/esm/icons/calendar-check"
import Loader2 from "lucide-react/dist/esm/icons/loader-2"

import { NewsGradientThumb } from "@/components/news/gradient-thumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useCoachingBooking } from "@/hooks/use-coaching-booking"
import { cn } from "@/lib/utils"

export function AcceleratorScheduleCard() {
  const { schedule, pending } = useCoachingBooking()

  return (
    <Card
      id="quickstart"
      className={cn(
        "group flex h-full w-full flex-col overflow-hidden rounded-[26px] border border-border/60 shadow-sm",
        "transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        pending && "cursor-wait opacity-80",
      )}
    >
      <CardContent className="flex h-full flex-col gap-0 p-0 first:pt-0">
        <div className="relative flex-1 min-h-[220px] overflow-hidden rounded-[22px] shadow-sm mx-[5px] mt-[5px] mb-4">
          <NewsGradientThumb seed="accelerator-coaching" className="absolute inset-0" />
          <span className="absolute left-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/80 text-muted-foreground shadow-sm">
            <CalendarCheck className="h-4 w-4" aria-hidden />
          </span>
          <span className="absolute bottom-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-muted-foreground shadow-sm transition group-hover:bg-background">
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </span>
        </div>

        <div className="space-y-2 px-4 pb-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">Coaching + guidance</p>
            <p className="text-xs text-muted-foreground">
              Schedule a 1:1 with an advisor to review your work, unblock decisions, and map next steps.
            </p>
            <p className="text-xs text-muted-foreground">
              4 sessions included with Accelerator, then discounted.
            </p>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="gap-2 bg-foreground text-background hover:bg-foreground/90 dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80"
              disabled={pending}
              onClick={() => void schedule()}
            >
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
              Book a session
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
