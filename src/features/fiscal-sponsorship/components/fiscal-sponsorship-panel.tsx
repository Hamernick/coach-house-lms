"use client"

import * as React from "react"
import CircleCheckIcon from "lucide-react/dist/esm/icons/circle-check"
import CircleDashedIcon from "lucide-react/dist/esm/icons/circle-dashed"
import ClockIcon from "lucide-react/dist/esm/icons/clock"
import PlayIcon from "lucide-react/dist/esm/icons/play"
import XIcon from "lucide-react/dist/esm/icons/x"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Sheet } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

import { FISCAL_SPONSORSHIP_PROTOTYPE_STEPS } from "../lib/prototype-data"
import type {
  FiscalSponsorshipInput,
  FiscalSponsorshipProgramOption,
  FiscalSponsorshipPrototypeStep,
  FiscalSponsorshipPrototypeStepStatus,
} from "../types"
import { FiscalSponsorshipMark } from "./fiscal-sponsorship-mark"
import {
  FiscalSponsorshipCompletionPanel,
  FiscalSponsorshipRunningPanel,
} from "./fiscal-sponsorship-run-panels"
import { FiscalSponsorshipStepDrawer } from "./fiscal-sponsorship-step-drawer"

function getInitialReviewedStepIds() {
  return new Set(
    FISCAL_SPONSORSHIP_PROTOTYPE_STEPS.filter(
      (step) => step.status === "approved" || step.status === "complete"
    ).map((step) => step.id)
  )
}

function getUserFacingStepStateLabel(step: FiscalSponsorshipPrototypeStep) {
  if (step.id === "application") {
    return step.status === "approved" || step.status === "complete"
      ? "Submitted"
      : "Not submitted"
  }

  if (step.id === "agreement") {
    if (step.status === "complete") return "Signed"
    if (step.status === "approved") return "Ready to sign"
    return "Not sent"
  }

  return step.status === "complete" ? "Done" : step.badgeLabel
}

function StatusBadge({ step }: { step: FiscalSponsorshipPrototypeStep }) {
  const { status } = step
  const Icon =
    status === "approved" || status === "complete"
      ? CircleCheckIcon
      : status === "running"
        ? ClockIcon
        : status === "skipped"
          ? XIcon
          : CircleDashedIcon

  return (
    <Badge
      variant={
        status === "planned" || status === "skipped" ? "secondary" : "outline"
      }
      className={cn(
        "h-7 rounded-full border-transparent px-2.5 py-1 leading-none",
        (status === "approved" || status === "complete") &&
          "bg-primary/10 text-primary",
        status === "running" && "bg-primary/10 text-primary",
        status === "skipped" && "text-muted-foreground"
      )}
      aria-label={`${step.title}: ${getUserFacingStepStateLabel(step)}`}
    >
      <Icon aria-hidden />
      {getUserFacingStepStateLabel(step)}
    </Badge>
  )
}

function StepIcon({
  active,
  step,
}: {
  active: boolean
  step: FiscalSponsorshipPrototypeStep
}) {
  const Icon = step.icon
  return (
    <span
      className={cn(
        "text-muted-foreground inline-flex size-7 shrink-0 items-center justify-center rounded-full",
        active && "bg-primary/10 text-primary",
        step.status === "approved" && "text-primary",
        step.status === "running" && "bg-primary/10 text-primary",
        step.status === "skipped" && "opacity-45"
      )}
    >
      <Icon className="size-4" aria-hidden />
    </span>
  )
}

function StepRow({
  active,
  onApprove,
  onOpenDetails,
  onSelect,
  reviewed,
  step,
}: {
  active: boolean
  onApprove: () => void
  onOpenDetails: () => void
  onSelect: () => void
  reviewed: boolean
  step: FiscalSponsorshipPrototypeStep
}) {
  const expanded = active && step.status !== "skipped"
  const canApprove = reviewed || step.status === "approved"
  const isApprovedOrComplete =
    step.status === "approved" || step.status === "complete"
  const isApplicationStep = step.id === "application"
  const isAgreementStep = step.id === "agreement"
  const viewButtonLabel =
    isApplicationStep || isAgreementStep
      ? getUserFacingStepStateLabel(step)
      : "View"

  return (
    <div
      className={cn(
        "group rounded-2xl transition-[background-color,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
        active && "bg-muted/55",
        step.status === "skipped" && "text-muted-foreground"
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "flex w-full items-start gap-3 rounded-2xl px-3 py-2.5 text-left transition-[background-color] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] outline-none motion-reduce:transition-none",
          "hover:bg-muted/50 focus-visible:ring-ring/50 focus-visible:ring-2"
        )}
        aria-expanded={expanded}
      >
        <StepIcon step={step} active={active} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex min-w-0 items-center justify-between gap-3">
            <span className="text-foreground min-w-0 flex-1 truncate text-base leading-7 font-semibold">
              {step.title}
            </span>
            <StatusBadge step={step} />
          </span>
        </span>
      </button>
      <div
        aria-hidden={!expanded}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
          expanded
            ? "grid-rows-[1fr] opacity-100"
            : "pointer-events-none grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-3 px-3 pb-3">
            <span aria-hidden />
            <div
              className={cn(
                "flex min-w-0 flex-col gap-2 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                expanded ? "translate-y-0" : "-translate-y-1"
              )}
            >
              <p className="text-muted-foreground text-sm leading-snug">
                {step.description}
              </p>
              <span className="bg-muted text-muted-foreground w-fit rounded-md px-2 py-1 text-xs font-medium">
                {step.toolLabel}
              </span>
              <div className="flex w-full flex-wrap items-center gap-2">
                {isApprovedOrComplete ||
                isApplicationStep ||
                isAgreementStep ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto rounded-full"
                    disabled={!expanded}
                    onClick={onOpenDetails}
                  >
                    {viewButtonLabel}
                  </Button>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full"
                      disabled={!expanded}
                      onClick={onOpenDetails}
                    >
                      Review
                    </Button>
                    <Button
                      size="sm"
                      className="ml-auto rounded-full"
                      disabled={!expanded || !canApprove}
                      onClick={onApprove}
                    >
                      Approve
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function nextRunnableIndex(
  steps: FiscalSponsorshipPrototypeStep[],
  fromIndex: number
) {
  return steps.findIndex(
    (step, index) => index > fromIndex && step.status === "approved"
  )
}

export function FiscalSponsorshipPanel({
  input,
  programs,
  surface = "prototype",
}: {
  input: FiscalSponsorshipInput
  programs?: FiscalSponsorshipProgramOption[]
  surface?: "prototype" | "workspace-card"
}) {
  const embeddedInWorkspaceCard = surface === "workspace-card"
  const [steps, setSteps] = React.useState(FISCAL_SPONSORSHIP_PROTOTYPE_STEPS)
  const [reviewedStepIds, setReviewedStepIds] = React.useState<Set<string>>(
    getInitialReviewedStepIds
  )
  const [selectedStepId, setSelectedStepId] = React.useState(
    FISCAL_SPONSORSHIP_PROTOTYPE_STEPS[2]?.id ??
      FISCAL_SPONSORSHIP_PROTOTYPE_STEPS[0].id
  )
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [mode, setMode] = React.useState<"review" | "running" | "complete">(
    "review"
  )
  const selectedStep =
    steps.find((step) => step.id === selectedStepId) ?? steps[0]
  const approvedCount = steps.filter(
    (step) => step.status === "approved" || step.status === "complete"
  ).length
  const runnableCount = steps.filter((step) => step.status !== "skipped").length
  const activeRunIndex = steps.findIndex((step) => step.status === "running")
  const canRunPlan = steps.every(
    (step) =>
      step.status === "skipped" ||
      step.status === "approved" ||
      step.status === "complete"
  )
  const planStatusLabel =
    mode === "running"
      ? "Workflow running"
      : mode === "complete"
        ? "Workflow complete"
        : null

  const updateStepStatus = React.useCallback(
    (id: string, status: FiscalSponsorshipPrototypeStepStatus) => {
      setSteps((current) =>
        current.map((step) => (step.id === id ? { ...step, status } : step))
      )
    },
    []
  )

  const markStepReviewed = React.useCallback((stepId: string) => {
    setReviewedStepIds((current) => {
      if (current.has(stepId)) return current

      const next = new Set(current)
      next.add(stepId)
      return next
    })
  }, [])

  const handleSelectStep = React.useCallback((stepId: string) => {
    setSelectedStepId(stepId)
  }, [])

  const handleOpenStepDetails = React.useCallback(
    (stepId: string) => {
      setSelectedStepId(stepId)
      markStepReviewed(stepId)
      setSheetOpen(true)
    },
    [markStepReviewed]
  )

  const handleRunPlan = React.useCallback(() => {
    if (!canRunPlan) return

    setMode("running")
    setSheetOpen(false)
    setSteps((current) => {
      const prepared = current
      const firstRunnableIndex = prepared.findIndex(
        (step) => step.status === "approved"
      )
      if (firstRunnableIndex < 0) {
        setMode("complete")
        return prepared
      }

      return prepared.map((step, index) => ({
        ...step,
        status: index === firstRunnableIndex ? "running" : step.status,
      }))
    })
  }, [canRunPlan])

  const handleAdvanceRun = React.useCallback(() => {
    const runningIndex = steps.findIndex((step) => step.status === "running")
    if (runningIndex < 0) return

    const nextIndex = nextRunnableIndex(steps, runningIndex)
    if (nextIndex < 0) {
      setSteps((current) =>
        current.map((step, index) =>
          index === runningIndex ? { ...step, status: "complete" } : step
        )
      )
      setMode("complete")
      return
    }

    setSteps((current) =>
      current.map((step, index) =>
        index === runningIndex
          ? { ...step, status: "complete" }
          : index === nextIndex
            ? { ...step, status: "running" }
            : step
      )
    )
  }, [steps])

  const handleReset = React.useCallback(() => {
    setMode("review")
    setSteps(FISCAL_SPONSORSHIP_PROTOTYPE_STEPS)
    setReviewedStepIds(getInitialReviewedStepIds())
    setSelectedStepId(
      FISCAL_SPONSORSHIP_PROTOTYPE_STEPS[2]?.id ??
        FISCAL_SPONSORSHIP_PROTOTYPE_STEPS[0].id
    )
  }, [])

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <section
        data-fiscal-sponsorship-prototype={input.id}
        data-fiscal-sponsorship-surface={surface}
        className={cn(
          embeddedInWorkspaceCard
            ? "w-full min-w-0"
            : "flex min-h-[68vh] w-full items-center justify-center p-4"
        )}
      >
        <Card
          data-workspace-card={
            embeddedInWorkspaceCard ? "fiscal-sponsorship" : undefined
          }
          className="border-border/60 bg-muted relative w-full max-w-[42rem] rounded-[2rem] p-3 shadow-sm"
        >
          <CardHeader
            className={cn(
              "relative flex items-center gap-3 px-4 pt-2 pb-4",
              planStatusLabel ? "pr-32" : "pr-4",
              embeddedInWorkspaceCard &&
                "workspace-card-drag-handle cursor-grab touch-manipulation select-none active:cursor-grabbing"
            )}
          >
            <div className="flex min-w-0 items-center gap-3">
              <FiscalSponsorshipMark />
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <CardTitle className="truncate text-xl font-semibold tracking-tight">
                    Fiscal Sponsorship
                  </CardTitle>
                  <Badge variant="secondary" className="rounded-full px-3 py-1">
                    {steps.length} steps
                  </Badge>
                </div>
              </div>
            </div>
            {planStatusLabel ? (
              <span
                className={cn(
                  "absolute top-2 right-4 inline-flex items-center gap-1.5 text-sm font-semibold",
                  mode === "running" && "text-amber-600",
                  mode === "complete" && "text-primary"
                )}
              >
                {mode === "running" ? (
                  <span
                    className="size-2 rounded-full bg-current"
                    aria-hidden
                  />
                ) : null}
                {planStatusLabel}
              </span>
            ) : null}
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {mode === "complete" ? (
              <FiscalSponsorshipCompletionPanel
                steps={steps}
                onReset={handleReset}
              />
            ) : mode === "running" ? (
              <FiscalSponsorshipRunningPanel
                activeRunIndex={activeRunIndex}
                onAdvanceRun={handleAdvanceRun}
                runnableCount={runnableCount}
                steps={steps}
              />
            ) : (
              <div className="bg-background border-border/60 mx-3 rounded-[1.6rem] border p-3">
                <div className="flex flex-col gap-1">
                  {steps.map((step, index) => (
                    <React.Fragment key={step.id}>
                      <StepRow
                        step={step}
                        active={
                          selectedStepId === step.id ||
                          step.status === "running"
                        }
                        onSelect={() => handleSelectStep(step.id)}
                        onApprove={() => {
                          if (!reviewedStepIds.has(step.id)) return

                          setSelectedStepId(step.id)
                          updateStepStatus(step.id, "approved")
                        }}
                        onOpenDetails={() => handleOpenStepDetails(step.id)}
                        reviewed={reviewedStepIds.has(step.id)}
                      />
                      {index < steps.length - 1 ? (
                        <Separator className="border-border/70 border-t border-dashed bg-transparent" />
                      ) : null}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          {mode === "review" ? (
            <CardFooter className="items-center justify-between gap-3 px-4 pt-4 pb-1">
              <>
                <p className="text-sm font-medium">{approvedCount} approved</p>
                <div className="flex items-center gap-2">
                  <Button
                    className="rounded-full"
                    disabled={!canRunPlan}
                    onClick={handleRunPlan}
                  >
                    <PlayIcon data-icon="inline-start" />
                    Start workflow
                  </Button>
                </div>
              </>
            </CardFooter>
          ) : null}
        </Card>
      </section>
      <FiscalSponsorshipStepDrawer
        selectedStep={selectedStep}
        programs={programs}
        onApprove={(status) => {
          markStepReviewed(selectedStep.id)
          updateStepStatus(selectedStep.id, status)
        }}
        onClose={() => setSheetOpen(false)}
      />
    </Sheet>
  )
}
