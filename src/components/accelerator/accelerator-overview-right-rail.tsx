"use client"

import Link from "next/link"
import { useState } from "react"
import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right"
import WaypointsIcon from "lucide-react/dist/esm/icons/waypoints"

import { RightRailSlot } from "@/components/app-shell/right-rail"
import { CoachingAvatarGroup } from "@/components/coaching/coaching-avatar-group"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useCoachingBooking } from "@/hooks/use-coaching-booking"
import type { CoachingTier } from "@/lib/meetings"
import type { RoadmapSectionStatus } from "@/lib/roadmap"
import { cn } from "@/lib/utils"

type AcceleratorOverviewRightRailProps = {
  sections: Array<{
    id: string
    title: string
    slug: string
    status: RoadmapSectionStatus
  }>
}

export function AcceleratorOverviewRightRail({ sections }: AcceleratorOverviewRightRailProps) {
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
    <>
      <RightRailSlot priority={1}>
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <WaypointsIcon className="h-4 w-4" aria-hidden />
            Strategic Roadmap
          </p>
          <div className="relative w-full min-w-0 space-y-1.5 pl-4 pr-2 text-sm">
            <span aria-hidden className="absolute left-1 top-0 h-full w-px rounded-full bg-border/60" />
            {sections.map((section) => {
              const statusClass =
                section.status === "complete"
                  ? "bg-emerald-500"
                  : section.status === "in_progress"
                    ? "bg-amber-500"
                    : "bg-border"

              return (
                <Link
                  key={section.id}
                  href={`/accelerator/roadmap/${section.slug}`}
                  className="group flex min-w-0 items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span className="min-w-0 truncate text-sm font-medium">{section.title}</span>
                  <span aria-hidden className={cn("h-2 w-2 shrink-0 rounded-full", statusClass)} />
                </Link>
              )
            })}
          </div>
        </div>
      </RightRailSlot>

      <RightRailSlot priority={2} align="bottom">
        <Card className="rounded-2xl border-border/60 bg-muted/10 shadow-none">
          <CardHeader className="px-4 pb-2 pt-4">
            <div className="flex justify-center pb-1">
              <CoachingAvatarGroup size="sm" />
            </div>
            <CardTitle className="text-base">Coach scheduling</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Get focused support on your current lesson and the next step.
            </CardDescription>
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
      </RightRailSlot>
    </>
  )
}
