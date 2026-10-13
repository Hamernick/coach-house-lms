"use client"

import { useState } from "react"
import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right"

import { CoachingAvatarGroup } from "@/components/coaching/coaching-avatar-group"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useCoachingBooking } from "@/hooks/use-coaching-booking"
import type { CoachingTier } from "@/lib/meetings"
import { cn } from "@/lib/utils"

type CoachSchedulingCardProps = {
  className?: string
  title?: string
  description?: string
}

export function CoachSchedulingCard({
  className,
  title = "Coach scheduling",
  description = "Get focused support on your current lesson and the next step.",
}: CoachSchedulingCardProps) {
  const { schedule, pending } = useCoachingBooking()
  const [tier, setTier] = useState<CoachingTier | null>(null)
  const [remaining, setRemaining] = useState<number | null>(null)

  const handleSchedule = async () => {
    const payload = await schedule()
    if (payload?.tier) {
      setTier(payload.tier)
    }
    if (payload?.remaining === null || typeof payload?.remaining === "number") {
      setRemaining(payload?.remaining ?? null)
    }
  }

  return (
    <Card className={cn("rounded-2xl border-border/60 bg-muted/10 shadow-none", className)}>
      <CardHeader className="px-4 pb-2 pt-4">
        <div className="flex justify-center pb-1">
          <CoachingAvatarGroup size="sm" />
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4 pt-0">
        <Button type="button" size="sm" onClick={handleSchedule} disabled={pending} className="w-full">
          {pending ? "Opening..." : "Book a session"}
        </Button>
        {tier === "free" && typeof remaining === "number" && remaining > 0 ? (
          <p className="text-xs text-muted-foreground">
            {remaining} included Pro session{remaining === 1 ? "" : "s"} remaining.
          </p>
        ) : null}
        {tier === "free" && remaining === 0 ? (
          <p className="text-xs text-muted-foreground">
            Included sessions used. Next bookings open your discounted coaching link.
          </p>
        ) : null}
        {tier === "discounted" ? (
          <p className="text-xs text-muted-foreground">
            You are now booking at your discounted coaching rate.
          </p>
        ) : null}
        {tier === "full" ? (
          <p className="text-xs text-muted-foreground">
            <ArrowUpRight className="mr-1 inline h-3 w-3" aria-hidden />
            Coaching booking opened in a new tab.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
