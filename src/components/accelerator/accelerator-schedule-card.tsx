"use client"

import { useState } from "react"
import Link from "next/link"
import CalendarCheck from "lucide-react/dist/esm/icons/calendar-check"
import Plus from "lucide-react/dist/esm/icons/plus"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/lib/toast"
import { FREE_TIER_MEETING_LIMIT } from "@/lib/meetings"

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
      className="border-dashed border-border/60 bg-muted/20 shadow-sm animate-soft-pop"
    >
      <CardContent className="flex flex-col gap-4 px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <CalendarCheck className="h-4 w-4" aria-hidden />
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-[11px] text-muted-foreground">
              {FREE_TIER_MEETING_LIMIT} calls included
            </Badge>
            <Badge
              asChild
              variant="outline"
              className="text-[11px] text-muted-foreground border-dashed hover:text-foreground"
            >
              <Link href="/billing">
                <Plus className="h-3 w-3" aria-hidden />
                Add more
              </Link>
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Book a meeting</p>
            <p className="max-w-lg text-sm text-muted-foreground">
              Schedule a 1:1 to review the curriculum, ask questions, and plan your next steps.
            </p>
          </div>
          <Button type="button" size="sm" onClick={handleSchedule} disabled={pending} className="shrink-0">
            {pending ? "Opening..." : "Schedule a call"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
