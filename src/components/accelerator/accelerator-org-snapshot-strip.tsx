import Image from "next/image"
import Link from "next/link"

import BadgeCheckIcon from "lucide-react/dist/esm/icons/badge-check"
import BookOpenIcon from "lucide-react/dist/esm/icons/book-open"
import ChevronRightIcon from "lucide-react/dist/esm/icons/chevron-right"
import HandCoinsIcon from "lucide-react/dist/esm/icons/hand-coins"
import PencilIcon from "lucide-react/dist/esm/icons/pencil"
import RouteIcon from "lucide-react/dist/esm/icons/route"

import { Button } from "@/components/ui/button"
import { GridPattern } from "@/components/ui/shadcn-io/grid-pattern/index"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type AcceleratorOrgSnapshotStripProps = {
  organizationTitle: string
  organizationSubtitle?: string | null
  logoUrl?: string | null
  headerUrl?: string | null
  fundingGoalCents: number
  formationLabel: string
  programsCount: number
  peopleCount: number
  progressPercent: number
  deliverablesComplete: number
  deliverablesTotal: number
  moduleGroupsComplete: number
  moduleGroupsTotal: number
  fundableCheckpoint?: number
  verifiedCheckpoint?: number
  readinessStateLabel?: "Building" | "Fundable" | "Verified"
  readinessTargetLabel?: string | null
  readinessChecklist?: Array<{ label: string; href: string }>
  editHref?: string
}

const ORG_HEADER_SQUARES: Array<[number, number]> = [
  [4, 4],
  [5, 1],
  [8, 2],
  [5, 3],
  [5, 5],
  [10, 10],
  [12, 15],
  [15, 10],
  [10, 15],
  [15, 10],
]

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value)))
}

const COMPACT_USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 0,
})

function formatFundingGoal(cents: number) {
  if (!Number.isFinite(cents) || cents <= 0) return "Not set"
  return COMPACT_USD.format(cents / 100)
}

function resolveReadinessChecklistVisual(item: { label: string; href: string }) {
  const normalized = `${item.label} ${item.href}`.toLowerCase()

  if (normalized.includes("formation lesson")) {
    return {
      icon: BookOpenIcon,
      iconClass: "text-amber-700 dark:text-amber-300",
      iconWrapClass: "border-amber-300/70 bg-amber-100/75 dark:border-amber-500/40 dark:bg-amber-500/15",
    }
  }

  if (normalized.includes("roadmap")) {
    return {
      icon: RouteIcon,
      iconClass: "text-violet-700 dark:text-violet-300",
      iconWrapClass: "border-violet-300/70 bg-violet-100/75 dark:border-violet-500/40 dark:bg-violet-500/15",
    }
  }

  if (normalized.includes("funding goal") || normalized.includes("program")) {
    return {
      icon: HandCoinsIcon,
      iconClass: "text-emerald-700 dark:text-emerald-300",
      iconWrapClass: "border-emerald-300/70 bg-emerald-100/75 dark:border-emerald-500/40 dark:bg-emerald-500/15",
    }
  }

  return {
    icon: BadgeCheckIcon,
    iconClass: "text-sky-700 dark:text-sky-300",
    iconWrapClass: "border-sky-300/70 bg-sky-100/75 dark:border-sky-500/40 dark:bg-sky-500/15",
  }
}

export function AcceleratorOrgSnapshotStrip({
  organizationTitle,
  organizationSubtitle,
  logoUrl,
  headerUrl,
  fundingGoalCents,
  formationLabel,
  programsCount,
  peopleCount,
  progressPercent,
  deliverablesComplete,
  deliverablesTotal,
  moduleGroupsComplete,
  moduleGroupsTotal,
  fundableCheckpoint = 60,
  verifiedCheckpoint = 100,
  readinessStateLabel = "Building",
  readinessTargetLabel = null,
  readinessChecklist = [],
  editHref = "/organization?view=editor",
}: AcceleratorOrgSnapshotStripProps) {
  const progress = clampPercent(progressPercent)
  const fundable = clampPercent(fundableCheckpoint)
  const verified = Math.max(fundable + 1, clampPercent(verifiedCheckpoint))

  const firstSegmentFill = Math.min(progress, fundable)
  const secondSegmentFill = Math.max(0, Math.min(progress - fundable, verified - fundable))

  const fundableReached = progress >= fundable
  const verifiedReached = progress >= verified
  const secondSegmentWidth = verifiedReached ? 100 - fundable : secondSegmentFill

  const firstSegmentClass = fundableReached ? "bg-emerald-500" : "bg-amber-500"
  const secondSegmentClass = verifiedReached ? "bg-emerald-500" : "bg-zinc-400 dark:bg-zinc-500"
  const titleText = organizationTitle.trim()
  const subtitleText = organizationSubtitle?.trim() || null
  const groupsSummaryText =
    moduleGroupsTotal > 0
      ? `${moduleGroupsComplete}/${moduleGroupsTotal} lessons complete.`
      : "No lessons assigned yet."
  const groupsSummaryValue =
    moduleGroupsTotal > 0
      ? `${moduleGroupsComplete} of ${moduleGroupsTotal}`
      : "0 of 0"
  const progressPillLabel = `${progress}%`
  const readinessStatePillClass =
    readinessStateLabel === "Verified"
      ? "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
      : readinessStateLabel === "Fundable"
        ? "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
        : "border-border/60 bg-background/70 text-muted-foreground"

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div className="group flex h-full min-h-[252px] flex-col overflow-hidden rounded-[26px] border border-border/60 bg-card">
        <div className="relative mb-3 ml-[5px] mr-[5px] mt-[5px] min-h-[132px] flex-1 overflow-hidden rounded-[22px] bg-background">
          {headerUrl ? (
            <Image
              src={headerUrl}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 640px"
              className="object-cover"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-b from-background/5 via-background/10 to-background/40" />
          <GridPattern
            patternId="accelerator-org-strip-header-pattern"
            squares={ORG_HEADER_SQUARES}
            className={cn(
              "inset-x-0 inset-y-[-45%] h-[200%] skew-y-12 [mask-image:radial-gradient(260px_circle_at_center,white,transparent)]",
              headerUrl ? "opacity-40" : "opacity-70",
            )}
          />
          <Button
            asChild
            size="icon"
            variant="secondary"
            className="absolute right-3 top-3 z-10 h-8 w-8 rounded-full bg-background/90 backdrop-blur-sm"
          >
            <Link href={editHref} aria-label="Edit organization">
              <PencilIcon className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>
        <div className="relative min-h-[122px] space-y-1 px-4 pb-5 pt-0">
          <div className="absolute left-4 top-[-28px] h-12 w-12 overflow-hidden rounded-lg border border-border/70 bg-background">
            {logoUrl ? (
              <Image src={logoUrl} alt="" fill sizes="48px" className="object-cover" />
            ) : (
              <span className="grid h-full w-full place-items-center text-[10px] font-semibold tracking-wide text-muted-foreground">
                LOGO
              </span>
            )}
          </div>
          <div className="space-y-0.5 pt-[2.8rem]">
            {titleText ? <p className="truncate text-base font-semibold leading-tight text-foreground">{titleText}</p> : null}
            {subtitleText ? <p className="line-clamp-2 text-xs leading-tight text-muted-foreground">{subtitleText}</p> : null}
          </div>
        </div>
      </div>

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
            <div className="relative h-2 rounded-full bg-zinc-300/65 dark:bg-zinc-700/55">
              <div
                className={cn("absolute left-0 top-0 h-full rounded-full", firstSegmentClass)}
                style={{ width: `${firstSegmentFill}%` }}
              />
              <div
                className={cn("absolute top-0 h-full rounded-full", secondSegmentClass)}
                style={{ left: `${fundable}%`, width: `${secondSegmentWidth}%` }}
              />

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Fundable checkpoint"
                    className={cn(
                      "absolute top-1/2 z-10 inline-flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2",
                      fundableReached
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-amber-500 bg-background text-amber-600 dark:text-amber-300",
                    )}
                    style={{ left: `${fundable}%` }}
                  >
                    <HandCoinsIcon className="h-2.5 w-2.5" aria-hidden />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8} className="inline-flex items-center gap-1.5">
                  <HandCoinsIcon className="h-3 w-3" aria-hidden />
                  <span>Fundable</span>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Verified checkpoint"
                    className={cn(
                      "absolute right-0 top-1/2 z-10 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full border-2 transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2",
                      verifiedReached
                        ? "border-sky-500 bg-sky-500 text-white"
                        : "border-sky-400/70 bg-background text-sky-600 dark:text-sky-300",
                    )}
                  >
                    <BadgeCheckIcon className="h-2.5 w-2.5" aria-hidden />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8} className="inline-flex items-center gap-1.5">
                  <BadgeCheckIcon className="h-3 w-3" aria-hidden />
                  <span>Verified</span>
                </TooltipContent>
              </Tooltip>
            </div>

            <p className="text-[11px] text-muted-foreground">{groupsSummaryText}</p>
          </div>
        </div>

        {readinessTargetLabel && readinessChecklist.length > 0 ? (
          <div className="rounded-lg border border-border/60 bg-background/25 px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Next to reach {readinessTargetLabel}
              </p>
              <span className="inline-flex h-5 items-center rounded-full border border-border/60 bg-background px-2 text-[10px] font-medium text-muted-foreground">
                {readinessChecklist.length} items
              </span>
            </div>
            <ul className="mt-2 space-y-1.5">
              {readinessChecklist.map((item, index) => {
                const visual = resolveReadinessChecklistVisual(item)
                const ItemIcon = visual.icon

                return (
                  <li key={`${item.href}-${item.label}`}>
                    <Link
                      href={item.href}
                      className="group/checklist flex min-w-0 items-center gap-2 rounded-md border border-transparent px-1.5 py-1 text-xs transition-colors hover:border-border/60 hover:bg-accent/30"
                    >
                      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border bg-background/70 text-muted-foreground">
                        <span
                          className={cn(
                            "inline-flex h-4 w-4 items-center justify-center rounded-sm border",
                            visual.iconWrapClass,
                          )}
                        >
                          <ItemIcon className={cn("h-2.5 w-2.5", visual.iconClass)} aria-hidden />
                        </span>
                      </span>
                      <span className="min-w-0 flex-1 truncate text-foreground">{item.label}</span>
                      <span className="inline-flex items-center text-[10px] font-medium text-muted-foreground">
                        {(index + 1).toString().padStart(2, "0")}
                      </span>
                      <ChevronRightIcon className="h-3 w-3 shrink-0 text-muted-foreground transition-transform group-hover/checklist:translate-x-0.5" aria-hidden />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ) : null}

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
            <dd className="font-medium tabular-nums">{groupsSummaryValue}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
