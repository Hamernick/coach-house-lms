import Link from "next/link"

import CheckIcon from "lucide-react/dist/esm/icons/check"
import RocketIcon from "lucide-react/dist/esm/icons/rocket"

import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { isElectiveAddOnModule } from "@/lib/accelerator/elective-modules"
import { cn } from "@/lib/utils"

import { DASHBOARD_SUPPORT_CARD_CONTENT_CLASS, DASHBOARD_SUPPORT_CARD_FRAME_CLASS } from "../../../_lib/constants"
import { resolveFormationStepState } from "../../../_lib/helpers"
import type { FormationSummary } from "../../../_lib/types"

type MyOrganizationFormationCardProps = {
  className?: string
  hasPaidPlan: boolean
  summary: FormationSummary
}

export function MyOrganizationFormationCard({
  className,
  hasPaidPlan,
  summary,
}: MyOrganizationFormationCardProps) {
  return (
    <Card data-bento-card="launch-roadmap" className={cn(className, DASHBOARD_SUPPORT_CARD_FRAME_CLASS)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <RocketIcon className="h-4 w-4" aria-hidden />
          Formation Status
        </CardTitle>
        <CardDescription>Formation milestones and accelerator progress in one view.</CardDescription>
      </CardHeader>
      <CardContent className={cn(DASHBOARD_SUPPORT_CARD_CONTENT_CLASS, "gap-3")}>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {summary.visibleModules.length > 0 ? (
            <div className="rounded-xl border border-border/60 bg-background/20 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold tracking-tight text-foreground">Progress</p>
                <p className="text-xs tabular-nums text-muted-foreground">
                  {summary.completedCount}/{summary.visibleModules.length}
                </p>
              </div>
              <Progress value={summary.progressPercent} className="mt-2 h-1.5 bg-muted/70" />

              <ul className="mt-3 space-y-1.5">
                {summary.visibleModules.map((module, index) => {
                  const stepState = resolveFormationStepState(module.status)
                  const stepCircleClass = cn(
                    "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold tabular-nums",
                    stepState === "completed"
                      ? "border-transparent bg-sky-500 text-white"
                      : stepState === "active"
                        ? "border-sky-400 text-sky-600 dark:text-sky-200"
                        : "border-border text-muted-foreground",
                  )
                  const titleClass = cn(
                    "line-clamp-2 text-sm font-medium leading-tight transition",
                    stepState === "completed" && "text-muted-foreground line-through decoration-2",
                    stepState === "pending" && "text-muted-foreground",
                  )

                  return (
                    <li key={module.id}>
                      <Link href={module.href} className="flex items-center gap-3 rounded-lg px-1.5 py-1.5 transition hover:bg-muted/35">
                        <span className={stepCircleClass} aria-hidden>
                          {stepState === "completed" ? <CheckIcon className="h-3.5 w-3.5" aria-hidden /> : index + 1}
                        </span>
                        <span className={cn("min-w-0 flex-1", titleClass)}>{module.title}</span>
                        {stepState === "pending" && isElectiveAddOnModule(module) ? (
                          <span className="shrink-0 rounded-full border border-sky-200 bg-sky-100 px-2 py-0.5 text-[10px] font-medium text-sky-800 dark:border-sky-900/50 dark:bg-sky-500/15 dark:text-sky-200">
                            Optional
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : null}

          {!hasPaidPlan && summary.acceleratorModules.length > 0 ? (
            <p className="rounded-lg border border-border/60 bg-background/20 px-3 py-2 text-xs text-muted-foreground">
              Unlock {summary.acceleratorModules.length} additional accelerator modules with Organization ($20/mo) or
              Operations Support ($58/mo).
            </p>
          ) : null}
        </div>

        <p className="text-xs text-muted-foreground">{summary.progressPercent}% complete</p>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button asChild variant="outline" size="sm" className="h-9">
            <Link href="/accelerator">Open accelerator</Link>
          </Button>
          <Button asChild size="sm" className="h-9">
            <Link href={hasPaidPlan ? summary.nextHref : "/organization?paywall=organization&plan=organization&source=my-org-formation-card"}>
              {hasPaidPlan ? "Continue" : "Upgrade"}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
