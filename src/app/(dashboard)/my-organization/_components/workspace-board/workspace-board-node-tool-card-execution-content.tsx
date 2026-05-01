"use client"

import type { ReactNode } from "react"
import ArrowUpRightIcon from "lucide-react/dist/esm/icons/arrow-up-right"
import CheckIcon from "lucide-react/dist/esm/icons/check"
import FolderTreeIcon from "lucide-react/dist/esm/icons/folder-tree"

import {
  formatWorkspaceAcceleratorModuleCompletionLabel,
  type WorkspaceAcceleratorCardStep,
  type WorkspaceAcceleratorChecklistModule,
} from "@/features/workspace-accelerator-card"
import { Button } from "@/components/ui/button"
import { ProgressCircle } from "@/features/platform-admin-dashboard"
import { getTrackIcon } from "@/lib/accelerator/track-icons"
import { resolveRoadmapSectionDerivedStatus } from "@/lib/roadmap/helpers"
import type { RoadmapSection, RoadmapSectionStatus } from "@/lib/roadmap"
import { cn } from "@/lib/utils"

export type ExecutionRowTone = "todo" | "active" | "done"

function summarizeText(value: string | null | undefined) {
  if (!value) return ""
  return value.replace(/\s+/g, " ").trim()
}

function resolveExecutionToneLabel(tone: ExecutionRowTone) {
  if (tone === "done") return "Done"
  if (tone === "active") return "In Progress"
  return "To do"
}

function resolveExecutionToneClassName(tone: ExecutionRowTone) {
  if (tone === "done") return "text-emerald-600 dark:text-emerald-400"
  if (tone === "active") return "text-amber-500 dark:text-amber-300"
  return "text-muted-foreground"
}

export function resolveRoadmapRowTone(
  status: RoadmapSectionStatus,
): ExecutionRowTone {
  if (status === "complete") return "done"
  if (status === "in_progress") return "active"
  return "todo"
}

export function resolveRoadmapSectionRowTone(
  section: RoadmapSection,
): ExecutionRowTone {
  return resolveRoadmapRowTone(resolveRoadmapSectionDerivedStatus(section))
}

export function resolveAcceleratorRowTone({
  step,
  currentStepId,
  completedStepIds,
}: {
  step: WorkspaceAcceleratorCardStep
  currentStepId: string | null
  completedStepIds: Set<string>
}): ExecutionRowTone {
  if (completedStepIds.has(step.id) || step.status === "completed") return "done"
  if (currentStepId === step.id || step.status === "in_progress") return "active"
  return "todo"
}

function resolveRoadmapSubtitle(section: RoadmapSection) {
  return (
    summarizeText(section.subtitle) ||
    summarizeText(section.content) ||
    (section.homework?.label
      ? `Next linked lesson: ${section.homework.label}`
      : "Keep this roadmap lane moving.")
  )
}

function resolveAcceleratorSubtitle(step: WorkspaceAcceleratorCardStep) {
  const detail =
    step.stepTitle === step.moduleTitle
      ? step.stepDescription
      : `${step.stepTitle}${step.stepDescription ? ` · ${step.stepDescription}` : ""}`

  return summarizeText(detail) || "Open this step in the full Accelerator view."
}

function ExecutionStatus({ tone }: { tone: ExecutionRowTone }) {
  return (
    <span
      className={cn(
        "font-medium whitespace-nowrap",
        resolveExecutionToneClassName(tone),
      )}
    >
      {resolveExecutionToneLabel(tone)}
    </span>
  )
}

function ExecutionStateGlyph({ tone }: { tone: ExecutionRowTone }) {
  if (tone === "done") {
    return (
      <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-teal-600 bg-teal-600 text-white">
        <CheckIcon className="size-3.5" aria-hidden />
      </span>
    )
  }

  if (tone === "active") {
    return (
      <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-amber-400 bg-background">
        <span className="size-2 rounded-full bg-amber-400" />
      </span>
    )
  }

  return (
    <span className="inline-flex size-6 shrink-0 rounded-full border border-border bg-background" />
  )
}

function ExecutionGroup({
  icon,
  title,
  subtitle,
  doneCount,
  totalCount,
  progressPercent,
  children,
}: {
  icon: ReactNode
  title: string
  subtitle: string
  doneCount: number
  totalCount: number
  progressPercent: number
  children: ReactNode
}) {
  return (
    <section className="rounded-[26px] border border-border/70 bg-muted/55 p-3 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.3)]">
      <header className="flex items-center justify-between gap-4 px-0 py-1">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground">
            {icon}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight text-foreground">
              {title}
            </p>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {subtitle}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
          <span className="font-medium tabular-nums">
            {doneCount}/{totalCount}
          </span>
          <ProgressCircle progress={progressPercent} color="var(--chart-2)" size={18} />
        </div>
      </header>
      <div className="mt-2 rounded-[22px] border border-border bg-background px-2 py-3">
        {children}
      </div>
    </section>
  )
}

function ExecutionRow({
  tone,
  title,
  subtitle,
  meta,
  onOpen,
  openLabel,
  highlighted = false,
}: {
  tone: ExecutionRowTone
  title: string
  subtitle?: string
  meta?: ReactNode
  onOpen?: () => void
  openLabel?: string
  highlighted?: boolean
}) {
  const displayTitle = subtitle || title
  const rowClassName = cn(
    "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-left transition-colors",
    onOpen
      ? "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      : null,
    highlighted ? "bg-muted/72" : "hover:bg-muted/60",
  )

  const content = (
    <>
      <ExecutionStateGlyph tone={tone} />
      <div className="min-w-0 flex-1">
        <span className="block min-w-0 line-clamp-2 text-left font-medium leading-5 text-foreground">
          {displayTitle}
        </span>
      </div>
      <div className="ml-2 flex shrink-0 items-center gap-2 text-xs">
        {meta}
        {onOpen ? (
          <span
            aria-hidden
            className="inline-flex size-7 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-colors"
          >
            <ArrowUpRightIcon className="size-3.5" aria-hidden />
          </span>
        ) : null}
      </div>
    </>
  )

  if (onOpen) {
    return (
      <Button
        type="button"
        variant="ghost"
        onClick={onOpen}
        aria-label={openLabel ?? `Open ${title}`}
        className={rowClassName}
      >
        {content}
      </Button>
    )
  }

  return <div className={rowClassName}>{content}</div>
}

export function ExecutionRoadmapPane({
  sections,
  doneCount,
  progressPercent,
  onOpenSection,
}: {
  sections: RoadmapSection[]
  doneCount: number
  progressPercent: number
  onOpenSection: (section: RoadmapSection) => void
}) {
  return (
    <ExecutionGroup
      icon={<FolderTreeIcon className="size-5" aria-hidden />}
      title="Strategic Roadmap"
      subtitle="Framework sections, operating priorities, and the next strategic lane to move forward."
      doneCount={doneCount}
      totalCount={sections.length}
      progressPercent={progressPercent}
    >
      <div className="space-y-1">
        {sections.map((section) => {
          const tone = resolveRoadmapSectionRowTone(section)

          return (
            <ExecutionRow
              key={section.id}
              tone={tone}
              title={section.title}
              subtitle={resolveRoadmapSubtitle(section)}
              meta={<ExecutionStatus tone={tone} />}
              onOpen={() => onOpenSection(section)}
              openLabel={`Open ${section.title} roadmap section`}
            />
          )
        })}
      </div>
    </ExecutionGroup>
  )
}

export function ExecutionAcceleratorPane({
  selectedLessonGroupLabel,
  doneCount,
  totalCount,
  progressPercent,
  checklistModules,
  currentStepId,
  completedStepIds,
  onOpenStep,
}: {
  selectedLessonGroupLabel: string | null
  doneCount: number
  totalCount: number
  progressPercent: number
  checklistModules: WorkspaceAcceleratorChecklistModule[]
  currentStepId: string | null
  completedStepIds: Set<string>
  onOpenStep: (step: WorkspaceAcceleratorCardStep) => void
}) {
  const AcceleratorTrackIcon = getTrackIcon(selectedLessonGroupLabel ?? "Accelerator")

  return (
    <ExecutionGroup
      icon={<AcceleratorTrackIcon className="size-5" aria-hidden />}
      title={selectedLessonGroupLabel ?? "Accelerator"}
      subtitle="Classes, lessons, and steps from the selected track, styled like the platform task surface."
      doneCount={doneCount}
      totalCount={totalCount}
      progressPercent={progressPercent}
    >
      <div className="space-y-3">
        {checklistModules.map((module) => (
          <section
            key={module.id}
            className="overflow-hidden rounded-2xl border border-border/70 bg-muted/40"
          >
            <header className="flex items-start gap-3 border-b border-border/70 px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-foreground">
                  {module.title}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {module.groupTitle} ·{" "}
                  {formatWorkspaceAcceleratorModuleCompletionLabel(
                    module.completedStepCount,
                    module.totalSteps,
                  )}
                </p>
              </div>
            </header>
            <div className="space-y-1 px-2 py-2">
              {module.steps.map((step) => {
                const tone = resolveAcceleratorRowTone({
                  step,
                  currentStepId,
                  completedStepIds,
                })

                return (
                  <ExecutionRow
                    key={step.id}
                    tone={tone}
                    title={step.moduleTitle}
                    subtitle={resolveAcceleratorSubtitle(step)}
                    highlighted={currentStepId === step.id}
                    meta={<ExecutionStatus tone={tone} />}
                    onOpen={() => onOpenStep(step)}
                    openLabel={`Open ${step.moduleTitle} in Accelerator`}
                  />
                )
              })}
            </div>
          </section>
        ))}

        {checklistModules.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/35 px-4 py-6 text-sm text-muted-foreground">
            No accelerator steps are available for this track yet.
          </div>
        ) : null}
      </div>
    </ExecutionGroup>
  )
}
