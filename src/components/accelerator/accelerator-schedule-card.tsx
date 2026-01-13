"use client"

import { useState } from "react"
import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right"
import CalendarCheck from "lucide-react/dist/esm/icons/calendar-check"
import Loader2 from "lucide-react/dist/esm/icons/loader-2"

import { NewsGradientThumb } from "@/components/news/gradient-thumb"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"

type AcceleratorScheduleCardProps = {
  host?: "joel" | "paula"
}

export function AcceleratorScheduleCard({ host = "joel" }: AcceleratorScheduleCardProps) {
  const [pending, setPending] = useState(false)

  const handleSchedule = async () => {
    setPending(true)
    try {
      const response = await fetch(`/api/meetings/schedule?host=${host}`, { method: "GET" })
      const payload = (await response.json().catch(() => ({}))) as { error?: string; url?: string }
      if (!response.ok) {
        const message = payload.error ?? "Unable to schedule a meeting right now."
        toast.error(message)
        return
      }
      if (!payload.url) {
        toast.error("Scheduling link unavailable.")
        return
      }
      window.open(payload.url, "_blank", "noopener,noreferrer")
      toast.success("Opening your scheduling link.")
    } catch (error) {
      console.error(error)
      toast.error("Unable to schedule a meeting right now.")
    } finally {
      setPending(false)
    }
  }

  return (
    <Card
      id="quickstart"
      role="button"
      tabIndex={0}
      aria-disabled={pending}
      onClick={() => {
        if (pending) return
        void handleSchedule()
      }}
      onKeyDown={(event) => {
        if (pending) return
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          void handleSchedule()
        }
      }}
      className={cn(
        "group mx-auto flex h-full w-full max-w-[520px] flex-col overflow-hidden rounded-[26px] border border-border/60 bg-card/70 p-4 shadow-sm",
        "transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        pending && "cursor-wait opacity-80",
      )}
    >
      <CardContent className="flex h-full flex-col gap-4 p-0">
        <div className="relative flex-1 overflow-hidden rounded-[22px] shadow-sm">
          <NewsGradientThumb seed="accelerator-coaching" className="absolute inset-0" />
          <span className="absolute left-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/80 text-muted-foreground shadow-sm">
            <CalendarCheck className="h-4 w-4" aria-hidden />
          </span>
          <span className="absolute bottom-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-muted-foreground shadow-sm transition group-hover:bg-background">
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            )}
          </span>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] uppercase text-muted-foreground">Book a call</p>
          <p className="text-sm font-semibold text-foreground">Coaching + guidance</p>
          <p className="text-xs text-muted-foreground">
            Schedule a 1:1 with an advisor to review your work, unblock decisions, and map next steps. Additional calls are billed during scheduling.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
