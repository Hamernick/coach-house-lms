import Link from "next/link"
import CalendarCheck from "lucide-react/dist/esm/icons/calendar-check"

import { CoachingAvatarGroup } from "@/components/coaching/coaching-avatar-group"
import { Button } from "@/components/ui/button"
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item"
import type { CoachingTier } from "@/lib/meetings"

import { ModuleStepperCelebrationIcon } from "./module-stepper-frame"

type ModuleStepperCompleteStepProps = {
  completionCount: number
  moduleCount: number
  progressPercent: number
  breakHref: string
  nextHref?: string | null
  nextLocked: boolean
  schedulePending: boolean
  coachingTier: CoachingTier | null
  coachingRemaining: number | null
  onContinue: () => void
  onSchedule: () => void
}

export function ModuleStepperCompleteStep({
  completionCount,
  moduleCount,
  progressPercent,
  breakHref,
  nextHref,
  nextLocked,
  schedulePending,
  coachingTier,
  coachingRemaining,
  onContinue,
  onSchedule,
}: ModuleStepperCompleteStepProps) {
  return (
    <div className="space-y-6 rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-10">
      <div className="flex items-center justify-center">
        <ModuleStepperCelebrationIcon />
      </div>
      <div className="space-y-2 text-center">
        <h3 className="text-2xl font-semibold text-foreground">Congratulations</h3>
        <p className="text-sm text-muted-foreground">
          You finished this module. Take a break or keep building momentum.
        </p>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span>
            {completionCount} of {moduleCount} modules
          </span>
        </div>
        <div className="mx-auto h-2 w-full max-w-md rounded-full border border-dashed border-border/70 bg-muted/30">
          <div
            className="h-full rounded-full bg-primary/70 transition-[width]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Button variant="outline" asChild className="rounded-full px-5">
          <Link href={breakHref}>Take a break</Link>
        </Button>
        {nextHref ? (
          nextLocked ? (
            <Button variant="outline" className="rounded-full px-5" disabled>
              Next lesson locked
            </Button>
          ) : (
            <Button className="rounded-full px-5" onClick={onContinue}>
              Continue to next lesson
            </Button>
          )
        ) : null}
      </div>
      <Item className="mx-auto max-w-md">
        <ItemMedia>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
            <CalendarCheck className="h-4 w-4" aria-hidden />
          </span>
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Book a session</ItemTitle>
          <ItemDescription>
            Review this module, ask questions, or plan next steps.
          </ItemDescription>
          <div className="pt-2">
            <CoachingAvatarGroup size="sm" />
          </div>
          {coachingTier === "free" && typeof coachingRemaining === "number" && coachingRemaining > 0 ? (
            <p className="pt-2 text-xs text-muted-foreground">
              {coachingRemaining} included session{coachingRemaining === 1 ? "" : "s"} remaining.
            </p>
          ) : null}
          {coachingTier === "free" && coachingRemaining === 0 ? (
            <p className="pt-2 text-xs text-muted-foreground">
              Included sessions complete. Your next bookings use the discounted calendar.
            </p>
          ) : null}
          {coachingTier === "discounted" ? (
            <p className="pt-2 text-xs text-muted-foreground">
              Included sessions complete. You are now booking at the discounted coaching rate.
            </p>
          ) : null}
          {coachingTier === "full" ? (
            <p className="pt-2 text-xs text-muted-foreground">
              Coaching booking opened in a new tab.
            </p>
          ) : null}
        </ItemContent>
        <ItemActions>
          <Button
            type="button"
            size="sm"
            onClick={() => onSchedule()}
            disabled={schedulePending}
          >
            {schedulePending ? "Opening..." : "Book a session"}
          </Button>
        </ItemActions>
      </Item>
    </div>
  )
}
