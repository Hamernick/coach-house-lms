"use client"

import * as React from "react"
import CheckIcon from "lucide-react/dist/esm/icons/check"
import ChevronDownIcon from "lucide-react/dist/esm/icons/chevron-down"
import ClockIcon from "lucide-react/dist/esm/icons/clock"
import RotateCcwIcon from "lucide-react/dist/esm/icons/rotate-ccw"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

import type { FiscalSponsorshipPrototypeStep } from "../types"

const RUN_FILES_USED = [
  "How it works PDF",
  "Sponsee application PDF",
  "Compliance review checklist",
  "Model C agreement PDF",
  "Re-grant request PDF",
]

const RUN_OUTPUTS = [
  "Application packet placeholder",
  "DocuSeal signing packet",
  "Executed agreement placeholder",
  "Re-grant checklist",
  "Documents folder handoff",
]

function DetailGroup({
  items,
  title,
}: {
  items: string[]
  title: string
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-2xl bg-muted/45 p-3">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </p>
      <div className="flex min-w-0 flex-col gap-1.5">
        {items.map((item) => (
          <div
            className="flex min-w-0 items-center justify-between gap-3 text-sm"
            key={item}
          >
            <span className="min-w-0 truncate text-foreground">{item}</span>
            <span className="size-1.5 shrink-0 rounded-full bg-primary/55" />
          </div>
        ))}
      </div>
    </div>
  )
}

function ActionDetailGroup({
  steps,
}: {
  steps: FiscalSponsorshipPrototypeStep[]
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-2xl bg-muted/45 p-3">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Actions
      </p>
      <div className="flex min-w-0 flex-col gap-1.5">
        {steps.map((step) => (
          <div className="flex min-w-0 items-center gap-2" key={step.id}>
            <span className="min-w-0 flex-1 truncate text-sm text-foreground">
              {step.title}
            </span>
            <Badge
              variant="secondary"
              className={cn(
                "rounded-full border-transparent px-2 py-0.5 text-[11px]",
                (step.status === "complete" || step.status === "approved") &&
                  "bg-primary/10 text-primary",
                step.status === "running" && "bg-amber-500/12 text-amber-700",
                step.status === "skipped" && "text-muted-foreground"
              )}
            >
              {step.status === "complete" ? "Done" : step.status}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  )
}

function RunDetails({
  steps,
}: {
  steps: FiscalSponsorshipPrototypeStep[]
}) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <DetailGroup items={RUN_FILES_USED} title="Files used" />
      <ActionDetailGroup steps={steps} />
      <DetailGroup items={RUN_OUTPUTS} title="Outputs" />
    </div>
  )
}

function DetailsDisclosure({
  steps,
}: {
  steps: FiscalSponsorshipPrototypeStep[]
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">Run details</p>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="rounded-full">
            {open ? "Hide details" : "View details"}
            <ChevronDownIcon
              data-icon="inline-end"
              className={cn(
                "transition-transform duration-200",
                open && "rotate-180"
              )}
            />
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="mt-3">
        <RunDetails steps={steps} />
      </CollapsibleContent>
    </Collapsible>
  )
}

export function FiscalSponsorshipRunningPanel({
  activeRunIndex,
  onAdvanceRun,
  runnableCount,
  steps,
}: {
  activeRunIndex: number
  onAdvanceRun: () => void
  runnableCount: number
  steps: FiscalSponsorshipPrototypeStep[]
}) {
  const completedCount = steps.filter((step) => step.status === "complete").length
  const currentStep = steps[activeRunIndex]
  const progressValue =
    runnableCount > 0
      ? Math.min(100, Math.round(((completedCount + 0.35) / runnableCount) * 100))
      : 0

  return (
    <div
      aria-live="polite"
      className="animate-in fade-in-0 zoom-in-95 bg-background border-border/60 mx-3 rounded-[1.6rem] border p-6 duration-200"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-amber-500" aria-hidden />
            <p className="text-sm font-semibold text-amber-700">In progress</p>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Action running
          </h2>
          <p className="max-w-xl text-base text-muted-foreground">
            {currentStep
              ? `Running ${currentStep.title.toLowerCase()}.`
              : "Preparing the next approved action."}
          </p>
        </div>
        <Badge
          variant="secondary"
          className="rounded-full border-transparent px-3 py-1"
        >
          {Math.max(activeRunIndex + 1, 1)} of {runnableCount}
        </Badge>
      </div>
      <div className="mt-7 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium">
            Running step {Math.max(activeRunIndex + 1, 1)} of {runnableCount}
          </p>
          <span className="text-sm text-muted-foreground">
            {completedCount} done
          </span>
        </div>
        <Progress value={progressValue} className="h-1.5" />
      </div>
      <div className="mt-6">
        <DetailsDisclosure steps={steps} />
      </div>
      <div className="mt-6 flex justify-end">
        <Button className="rounded-full" onClick={onAdvanceRun}>
          <ClockIcon data-icon="inline-start" />
          Complete step
        </Button>
      </div>
    </div>
  )
}

export function FiscalSponsorshipCompletionPanel({
  onReset,
  steps,
}: {
  onReset: () => void
  steps: FiscalSponsorshipPrototypeStep[]
}) {
  const completedCount = steps.filter((step) => step.status === "complete").length
  const skippedCount = steps.filter((step) => step.status === "skipped").length

  return (
    <div
      aria-live="polite"
      className="animate-in fade-in-0 zoom-in-95 bg-background border-border/60 mx-3 rounded-[1.6rem] border p-8 duration-200"
    >
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <CheckIcon className="size-7" aria-hidden />
      </div>
      <div className="mt-7 flex flex-col gap-2">
        <h2 className="text-2xl font-semibold tracking-tight">Plan executed</h2>
        <p className="max-w-xl text-base text-muted-foreground">
          {completedCount} steps ran. {skippedCount} skipped. Output saved to
          Documents.
        </p>
      </div>
      <div className="mt-6">
        <DetailsDisclosure steps={steps} />
      </div>
      <Button variant="secondary" className="mt-6 rounded-full" onClick={onReset}>
        <RotateCcwIcon data-icon="inline-start" />
        New plan
      </Button>
    </div>
  )
}
