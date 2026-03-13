import Link from "next/link"

import { AcceleratorProgressRail } from "@/components/accelerator/accelerator-progress-rail"
import { AcceleratorReadinessChecklist } from "@/components/accelerator/accelerator-org-snapshot-strip/readiness-checklist"
import { AcceleratorOrgSnapshotHeaderCard } from "@/components/accelerator/accelerator-org-snapshot-strip/snapshot-header-card"
import { clampPercent, formatFundingGoal } from "@/components/accelerator/accelerator-org-snapshot-strip/helpers"
import { type AcceleratorOrgSnapshotStripProps } from "@/components/accelerator/accelerator-org-snapshot-strip/types"
import {
  ACCELERATOR_FUNDABLE_THRESHOLD,
  ACCELERATOR_VERIFIED_THRESHOLD,
} from "@/lib/accelerator/readiness"
import { cn } from "@/lib/utils"

export function AcceleratorOrgSnapshotStrip({
  organizationTitle,
  organizationSubtitle,
  organizationDescription,
  logoUrl,
  headerUrl,
  fundingGoalCents,
  formationLabel,
  programsCount,
  peopleCount,
  progressPercent,
  lessonsComplete,
  lessonsTotal,
  deliverablesComplete,
  deliverablesTotal,
  moduleGroupsComplete,
  moduleGroupsTotal,
  fundableCheckpoint = ACCELERATOR_FUNDABLE_THRESHOLD,
  verifiedCheckpoint = ACCELERATOR_VERIFIED_THRESHOLD,
  fundableMilestoneChecklist = [],
  verifiedMilestoneChecklist = [],
  readinessStateLabel = "Building",
  readinessTargetLabel = null,
  readinessChecklist = [],
  editHref = "/organization?view=editor",
}: AcceleratorOrgSnapshotStripProps) {
  const progress = clampPercent(progressPercent)
  const titleText = organizationTitle.trim()
  const subtitleText = organizationSubtitle?.trim() || null
  const descriptionText = organizationDescription?.trim() || null
  const lessonsSummaryText =
    lessonsTotal > 0 ? `${lessonsComplete}/${lessonsTotal} lessons complete.` : "No lessons assigned yet."
  const lessonsSummaryValue = lessonsTotal > 0 ? `${lessonsComplete} of ${lessonsTotal}` : "0 of 0"
  const tracksSummaryValue = moduleGroupsTotal > 0 ? `${moduleGroupsComplete} of ${moduleGroupsTotal}` : "0 of 0"
  const progressPillLabel = `${progress}%`
  const readinessStatePillClass =
    readinessStateLabel === "Verified"
      ? "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
      : readinessStateLabel === "Fundable"
        ? "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
        : "border-border/60 bg-background/70 text-muted-foreground"

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <AcceleratorOrgSnapshotHeaderCard
        titleText={titleText}
        subtitleText={subtitleText}
        descriptionText={descriptionText}
        logoUrl={logoUrl}
        headerUrl={headerUrl}
        editHref={editHref}
      />

      <div className="flex min-w-0 flex-col gap-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Progress</span>
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                readinessStatePillClass,
              )}
              title={`Readiness: ${readinessStateLabel}`}
            >
              {progressPillLabel}
            </span>
          </div>
          <div className="mt-4 space-y-2">
            <AcceleratorProgressRail
              progressPercent={progress}
              fundableCheckpoint={fundableCheckpoint}
              verifiedCheckpoint={verifiedCheckpoint}
              fundableChecklist={fundableMilestoneChecklist}
              verifiedChecklist={verifiedMilestoneChecklist}
            />

            <p className="text-[11px] text-muted-foreground">{lessonsSummaryText}</p>
          </div>
        </div>

        <AcceleratorReadinessChecklist readinessTargetLabel={readinessTargetLabel} readinessChecklist={readinessChecklist} />

        <div className="grid grid-cols-3 gap-3">
          <Link href="/organization?view=editor&tab=programs" className="min-w-0 py-1">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Funding goal</p>
            <p className="mt-1 text-sm font-semibold tabular-nums">{formatFundingGoal(fundingGoalCents)}</p>
          </Link>
          <Link href="/organization?view=editor&tab=programs" className="min-w-0 py-1">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Programs</p>
            <p className="mt-1 text-sm font-semibold tabular-nums">{programsCount}</p>
          </Link>
          <Link href="/organization?view=editor&tab=people" className="min-w-0 py-1">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">People</p>
            <p className="mt-1 text-sm font-semibold tabular-nums">{peopleCount}</p>
          </Link>
        </div>

        <dl className="divide-y divide-border/50 rounded-lg border border-border/60 bg-background/20 text-sm">
          <div className="flex items-center justify-between gap-3 px-3 py-2.5">
            <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Formation</dt>
            <dd className="font-medium text-right">{formationLabel}</dd>
          </div>
          <div className="flex items-center justify-between gap-3 px-3 py-2.5">
            <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Lessons completed</dt>
            <dd className="font-medium tabular-nums">{lessonsSummaryValue}</dd>
          </div>
          <div className="flex items-center justify-between gap-3 px-3 py-2.5">
            <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Tracks completed</dt>
            <dd className="font-medium tabular-nums">{tracksSummaryValue}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
