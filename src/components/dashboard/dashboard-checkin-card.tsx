"use client"

import { useEffect, useState } from "react"
import CalendarCheck from "lucide-react/dist/esm/icons/calendar-check"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/lib/toast"
import { FREE_TIER_MEETING_LIMIT } from "@/lib/meetings"

type DashboardCheckInCardProps = {
  userId: string
  meetingCount: number
  isFreeTier: boolean
  meetingLimit?: number
}

export function DashboardCheckInCard({
  userId,
  meetingCount,
  isFreeTier,
  meetingLimit = FREE_TIER_MEETING_LIMIT,
}: DashboardCheckInCardProps) {
  const [pendingHost, setPendingHost] = useState<"joel" | "paula" | null>(null)
  const remaining = isFreeTier ? Math.max(0, meetingLimit - meetingCount) : null
  const limitReached = isFreeTier && remaining === 0

  useEffect(() => {
    if (typeof window === "undefined") return
    if (limitReached) return
    const key = `checkin-prompt-${userId}`
    if (window.localStorage.getItem(key)) return
    window.localStorage.setItem(key, "seen")
    toast.info("Checkpoint: schedule a check-in with Joel or Paula when you are ready.")
  }, [limitReached, userId])

  const handleSchedule = async (host: "joel" | "paula") => {
    setPendingHost(host)
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
      setPendingHost(null)
    }
  }

  return (
    <Card className="border-border/70 bg-card/70">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm">
              <CalendarCheck className="h-4 w-4 text-muted-foreground" aria-hidden />
              Check-in
            </CardTitle>
            <CardDescription>Review your roadmap with Joel or Paula.</CardDescription>
          </div>
          <Badge variant="outline" className="rounded-full">Checkpoint</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          {isFreeTier
            ? limitReached
              ? "You have used all free check-ins. Upgrade to schedule more."
              : `${remaining} of ${meetingLimit} free check-ins remaining.`
            : "Unlimited check-ins are included with your plan."}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => handleSchedule("joel")}
            disabled={limitReached || pendingHost !== null}
          >
            {pendingHost === "joel" ? "Opening..." : "Meet with Joel"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => handleSchedule("paula")}
            disabled={limitReached || pendingHost !== null}
          >
            {pendingHost === "paula" ? "Opening..." : "Meet with Paula"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
