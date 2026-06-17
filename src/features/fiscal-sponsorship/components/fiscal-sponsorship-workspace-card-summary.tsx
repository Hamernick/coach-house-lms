"use client"

import * as React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import CheckCircle2Icon from "lucide-react/dist/esm/icons/check-circle-2"
import CircleDashedIcon from "lucide-react/dist/esm/icons/circle-dashed"
import FileTextIcon from "lucide-react/dist/esm/icons/file-text"
import ImageIcon from "lucide-react/dist/esm/icons/image"
import PanelRightOpenIcon from "lucide-react/dist/esm/icons/panel-right-open"

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Sheet } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

import {
  FISCAL_SPONSORSHIP_HANDBOOK_HREF,
  formatFiscalSponsorshipProgramAmount,
  resolveFiscalSponsorshipProgramLocation,
} from "../lib/application-data"
import { buildFiscalSponsorshipProjectWorkbenchData } from "../lib/project-workbench-data"
import type {
  FiscalSponsorshipApplicationPrefill,
  FiscalSponsorshipProgramOption,
  FiscalSponsorshipProjectWorkflowSummary,
} from "../types"
import { FiscalSponsorshipApplicationDrawer } from "./fiscal-sponsorship-application-drawer"
import { FiscalSponsorshipMark } from "./fiscal-sponsorship-mark"
import { FiscalSponsorshipWorkflowDrawer } from "./fiscal-sponsorship-workflow-drawer"

const FALLBACK_WORKFLOW_ITEMS = [
  {
    id: "application-intake",
    label: "Application intake",
    description: "Project, legal, budget, fundraising, and risk details.",
    complete: true,
  },
  {
    id: "required-documents",
    label: "Required documents",
    description: "Tax identity, formation, budget, and fundraising support.",
    complete: false,
  },
  {
    id: "agreement",
    label: "Agreement",
    description: "Coach House review, Model C agreement, and DocuSeal packet.",
    complete: false,
  },
  {
    id: "grant-request",
    label: "Submit grant request",
    description: "Amount, payment method, use of funds, and documentation.",
    complete: false,
  },
] as const

const FISCAL_SPONSORSHIP_WORKFLOW_ITEM_ROW_CLASSNAME =
  "group -mx-1 flex min-w-0 items-center gap-2 rounded-xl border border-transparent px-3 py-2.5 transition-[background-color,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
const FISCAL_SPONSORSHIP_WORKFLOW_ITEM_BUTTON_CLASSNAME =
  "text-left outline-none hover:bg-muted/50 focus-visible:ring-ring/50 focus-visible:ring-2"
const FISCAL_SPONSORSHIP_WORKFLOW_ITEM_ACTION_PILL_CLASSNAME =
  "text-muted-foreground ml-auto inline-flex h-6 shrink-0 items-center justify-center rounded-md px-2 text-[10px] font-medium leading-none transition-colors group-hover:bg-accent group-hover:text-foreground group-focus-visible:bg-accent group-focus-visible:text-foreground motion-reduce:transition-none"

function cleanText(value: string | null | undefined) {
  const trimmed = value?.trim() ?? ""
  return trimmed.length > 0 ? trimmed : null
}

function firstText(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const cleaned = cleanText(value)
    if (cleaned) return cleaned
  }

  return null
}

function dateInputValue(value: string | null | undefined) {
  const cleaned = cleanText(value)
  if (!cleaned) return null

  const dateMatch = cleaned.match(/^\d{4}-\d{2}-\d{2}/)
  return dateMatch ? dateMatch[0] : null
}

function resolveWorkflowItemActionLabel(item: {
  id: string
  complete: boolean
  actionLabel?: string
  actionType?: string
}) {
  if (item.complete) return "View"

  if (item.actionType === "application") return "Start"
  if (item.actionType === "signature") return "Sign"
  if (item.actionType === "document") return "View"
  if (item.actionType === "assets") {
    const normalizedLabel = item.actionLabel?.toLowerCase() ?? ""

    if (normalizedLabel.includes("upload")) return "Upload"

    return "Edit"
  }
  if (item.actionType === "waiting") {
    if (item.actionLabel === "Locked") return "Locked"
    if (item.actionLabel === "Coach House managed") return "Managed"

    return "Waiting"
  }

  if (item.id === "required-documents") return "Upload"
  if (item.id === "agreement") return "Sign"
  if (item.id === "grant-request") return "Start"

  return "Start"
}

function resolveSelectedProgram(
  programs: FiscalSponsorshipProgramOption[],
  selectedProgramId: string | null
) {
  return (
    programs.find((program) => program.id === selectedProgramId) ??
    programs[0] ??
    null
  )
}

function resolveProgramSourceLabel(program: FiscalSponsorshipProgramOption) {
  return firstText(program.objectKind, program.focusArea, "Activity")
}

function resolveProgramHeroImageUrl(program: FiscalSponsorshipProgramOption) {
  return firstText(program.bannerImageUrl, program.imageUrl)
}

export function buildSelectedProgramPrefill({
  basePrefill,
  program,
}: {
  basePrefill: FiscalSponsorshipApplicationPrefill | null
  program: FiscalSponsorshipProgramOption | null
}): FiscalSponsorshipApplicationPrefill | null {
  if (!program) return basePrefill

  const location = resolveFiscalSponsorshipProgramLocation(program)
  const formattedGoal = formatFiscalSponsorshipProgramAmount(program.goalCents)
  const formattedRaised = formatFiscalSponsorshipProgramAmount(
    program.raisedCents
  )
  const fundingParts = [
    program.prospectiveFundingSources,
    formattedGoal ? `Public fundraising goal: ${formattedGoal}` : null,
    formattedRaised ? `Raised to date: ${formattedRaised}` : null,
  ].filter((part): part is string => Boolean(part))
  const estimatedBudgetCents =
    typeof program.estimatedBudgetCents === "number" &&
    program.estimatedBudgetCents > 0
      ? program.estimatedBudgetCents
      : typeof program.goalCents === "number" && program.goalCents > 0
        ? program.goalCents
        : (basePrefill?.estimatedBudgetCents ?? null)

  return {
    ...basePrefill,
    sourceActivityId: program.id,
    sourceActivityTitle: cleanText(program.title),
    sourceActivityKind: resolveProgramSourceLabel(program),
    projectName: firstText(program.title, basePrefill?.projectName),
    projectDescription: firstText(
      program.description,
      program.subtitle,
      basePrefill?.projectDescription
    ),
    projectLocation: firstText(
      location === "Location needed" ? null : location,
      basePrefill?.projectLocation
    ),
    focusArea: firstText(
      program.focusArea,
      program.objectKind,
      basePrefill?.focusArea
    ),
    projectDurationType: dateInputValue(program.endDate)
      ? "temporary"
      : dateInputValue(program.startDate)
        ? "ongoing_multi_year"
        : (basePrefill?.projectDurationType ?? null),
    temporaryStartDate: firstText(
      dateInputValue(program.startDate),
      basePrefill?.temporaryStartDate
    ),
    temporaryEndDate: firstText(
      dateInputValue(program.endDate),
      basePrefill?.temporaryEndDate
    ),
    estimatedBudgetCents,
    expenseSummary: firstText(
      program.expenseSummary,
      basePrefill?.expenseSummary
    ),
    prospectiveFundingSources: firstText(
      fundingParts.join("; "),
      basePrefill?.prospectiveFundingSources
    ),
    publicBenefit: firstText(program.publicBenefit, basePrefill?.publicBenefit),
    shortPublicDescription: firstText(
      program.subtitle,
      program.description,
      basePrefill?.shortPublicDescription
    ),
  }
}

function resolveProgramSummary(programs: FiscalSponsorshipProgramOption[]) {
  const count = programs.length
  const totalGoal = programs.reduce(
    (sum, program) => sum + Math.max(0, program.goalCents ?? 0),
    0
  )
  const formattedGoal = formatFiscalSponsorshipProgramAmount(totalGoal)

  if (count === 0) {
    return {
      label: "No activity selected",
      description: "Create or connect an activity before applying.",
    }
  }

  return {
    label: `${count} ${count === 1 ? "activity" : "activities"} ready`,
    description: formattedGoal
      ? `${formattedGoal} in visible fundraising goals can prefill intake.`
      : "Activity records can prefill sponsorship intake.",
  }
}

export function FiscalSponsorshipWorkspaceCardSummary({
  applicationPrefill = null,
  fiscalSponsorshipProjectId = null,
  fiscalSponsorshipWorkflowSummary = null,
  organizationName = null,
  programs = [],
}: {
  applicationPrefill?: FiscalSponsorshipApplicationPrefill | null
  fiscalSponsorshipProjectId?: string | null
  fiscalSponsorshipWorkflowSummary?: FiscalSponsorshipProjectWorkflowSummary | null
  organizationName?: string | null
  programs?: FiscalSponsorshipProgramOption[]
}) {
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [applicationOpen, setApplicationOpen] = React.useState(false)
  const [selectedProgramId, setSelectedProgramId] = React.useState<
    string | null
  >(() => programs[0]?.id ?? null)
  const [selectedPhaseId, setSelectedPhaseId] =
    React.useState("application-intake")
  React.useEffect(() => {
    if (programs.length === 0) {
      setSelectedProgramId(null)
      return
    }

    setSelectedProgramId((currentProgramId) =>
      programs.some((program) => program.id === currentProgramId)
        ? currentProgramId
        : (programs[0]?.id ?? null)
    )
  }, [programs])
  const selectedProgram = React.useMemo(
    () => resolveSelectedProgram(programs, selectedProgramId),
    [programs, selectedProgramId]
  )
  const selectedProgramPrefill = React.useMemo(
    () =>
      buildSelectedProgramPrefill({
        basePrefill: applicationPrefill,
        program: selectedProgram,
      }),
    [applicationPrefill, selectedProgram]
  )
  const programSummary = resolveProgramSummary(programs)
  const applicationData = React.useMemo(() => {
    if (!fiscalSponsorshipProjectId) return null

    const primaryProgram = selectedProgram
    const locationLabel =
      selectedProgramPrefill?.projectLocation?.trim() ||
      [primaryProgram?.addressCity, primaryProgram?.addressState]
        .filter(Boolean)
        .join(", ") ||
      primaryProgram?.location ||
      null

    return buildFiscalSponsorshipProjectWorkbenchData({
      project: {
        id: fiscalSponsorshipProjectId,
        name:
          selectedProgramPrefill?.projectName?.trim() ||
          primaryProgram?.title?.trim() ||
          "Fiscal sponsorship application",
        description:
          selectedProgramPrefill?.projectDescription ??
          primaryProgram?.description ??
          null,
        locationLabel,
        fileCount: 0,
        noteCount: 0,
        taskCount: 0,
        assigneeCount: 0,
      },
      organization: {
        name: organizationName?.trim() || "Your organization",
        ownerName: selectedProgramPrefill?.applicantFullName ?? null,
        memberCount: 0,
      },
      applicationPrefill: selectedProgramPrefill,
      workflowSummary: fiscalSponsorshipWorkflowSummary,
    })
  }, [
    fiscalSponsorshipProjectId,
    fiscalSponsorshipWorkflowSummary,
    organizationName,
    selectedProgram,
    selectedProgramPrefill,
  ])
  const workflowItems = applicationData?.phases ?? FALLBACK_WORKFLOW_ITEMS
  const completedCount = workflowItems.filter((item) => item.complete).length
  const progress =
    applicationData?.readinessPercent ??
    Math.round((completedCount / workflowItems.length) * 100)
  const primaryPhase =
    applicationData?.phases.find((phase) => !phase.complete) ??
    applicationData?.phases[0] ??
    null
  const primaryActionLabel =
    primaryPhase?.actionType === "application"
      ? primaryPhase.complete
        ? "View application"
        : "Start application"
      : primaryPhase?.actionType === "assets" ||
          primaryPhase?.actionType === "signature"
        ? primaryPhase.actionLabel
        : "Open workflow"

  const openFlow = React.useCallback((phaseId = "application-intake") => {
    setSelectedPhaseId(phaseId)
    setSheetOpen(true)
  }, [])

  const openApplication = React.useCallback(() => {
    if (!applicationData) return
    setSheetOpen(false)
    setApplicationOpen(true)
  }, [applicationData])

  return (
    <>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <Card
          data-workspace-card="fiscal-sponsorship"
          data-fiscal-sponsorship-surface="workspace-card"
          className="border-border/60 bg-muted relative w-full max-w-[42rem] rounded-[2rem] p-3 shadow-sm"
        >
          <CardHeader className="workspace-card-drag-handle cursor-grab touch-manipulation px-4 pt-2 pb-4 select-none active:cursor-grabbing">
            <div className="flex min-w-0 items-center gap-3">
              <FiscalSponsorshipMark />
              <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                <CardTitle className="truncate text-xl font-semibold tracking-tight">
                  Fiscal Sponsorship
                </CardTitle>
                <Badge
                  variant="secondary"
                  className="ml-auto rounded-full px-3 py-1"
                >
                  Model C
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="bg-background border-border/60 mx-3 rounded-[1.6rem] border p-3">
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {programSummary.label}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs leading-snug">
                    {programSummary.description}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums">
                    {progress}%
                  </p>
                  <p className="text-muted-foreground text-[11px]">ready</p>
                </div>
              </div>
              <Progress value={progress} className="mt-3 h-1.5" />
              {programs.length > 0 ? (
                <div className="mt-3 flex flex-col gap-1.5">
                  <p className="text-muted-foreground px-1 text-[11px] font-medium">
                    Activity source
                  </p>
                  {programs.map((program) => {
                    const selected = selectedProgram?.id === program.id
                    const sourceLabel = resolveProgramSourceLabel(program)
                    const formattedGoal = formatFiscalSponsorshipProgramAmount(
                      program.goalCents
                    )
                    const heroImageUrl = resolveProgramHeroImageUrl(program)

                    return (
                      <button
                        key={program.id}
                        type="button"
                        aria-pressed={selected}
                        className={cn(
                          "group hover:bg-muted/50 focus-visible:ring-ring/50 flex min-w-0 items-center justify-between gap-3 rounded-xl border border-transparent p-2 text-left transition-[background-color,color] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] outline-none focus-visible:ring-2 motion-reduce:transition-none",
                          selected && "bg-muted/60"
                        )}
                        onClick={() => setSelectedProgramId(program.id)}
                      >
                        <span className="flex min-w-0 flex-1 items-center gap-3">
                          <span className="bg-muted ring-border/60 relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl ring-1">
                            {heroImageUrl ? (
                              <Image
                                src={heroImageUrl}
                                alt=""
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            ) : (
                              <ImageIcon
                                className="text-muted-foreground size-4"
                                aria-hidden
                              />
                            )}
                          </span>
                          <span className="min-w-0">
                            <span className="text-foreground block truncate text-xs font-medium">
                              {program.title?.trim() || "Untitled activity"}
                            </span>
                            <span className="text-muted-foreground mt-0.5 block truncate text-[11px]">
                              {[sourceLabel, formattedGoal]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          </span>
                        </span>
                        <Badge
                          variant={selected ? "default" : "outline"}
                          className="h-6 shrink-0 rounded-full px-2 text-[10px]"
                        >
                          {selected ? "Selected" : "Use"}
                        </Badge>
                      </button>
                    )
                  })}
                </div>
              ) : null}
              <div className="mt-3 flex flex-col gap-1.5">
                {workflowItems.map((item) => {
                  const Icon = item.complete
                    ? CheckCircle2Icon
                    : CircleDashedIcon
                  const clickable = Boolean(applicationData)
                  const actionLabel = resolveWorkflowItemActionLabel(item)

                  const content = (
                    <>
                      <Icon
                        className={cn(
                          "size-4 shrink-0",
                          item.complete ? "text-emerald-600" : "text-amber-600"
                        )}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1 text-left">
                        <p className="text-foreground truncate text-xs font-medium">
                          {item.label}
                        </p>
                      </div>
                      <span
                        className={
                          FISCAL_SPONSORSHIP_WORKFLOW_ITEM_ACTION_PILL_CLASSNAME
                        }
                      >
                        {actionLabel}
                      </span>
                    </>
                  )

                  return clickable ? (
                    <button
                      key={item.id}
                      type="button"
                      className={cn(
                        FISCAL_SPONSORSHIP_WORKFLOW_ITEM_ROW_CLASSNAME,
                        FISCAL_SPONSORSHIP_WORKFLOW_ITEM_BUTTON_CLASSNAME,
                        item.complete && "bg-muted/55"
                      )}
                      onClick={() => openFlow(item.id)}
                    >
                      {content}
                    </button>
                  ) : (
                    <div
                      key={item.id}
                      className={cn(
                        FISCAL_SPONSORSHIP_WORKFLOW_ITEM_ROW_CLASSNAME,
                        item.complete && "bg-muted/55"
                      )}
                    >
                      {content}
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
          <CardFooter className="items-center justify-between gap-3 px-4 pt-4 pb-1">
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <a href={FISCAL_SPONSORSHIP_HANDBOOK_HREF}>
                <FileTextIcon data-icon="inline-start" aria-hidden />
                Handbook
              </a>
            </Button>
            <Button
              type="button"
              size="sm"
              className="rounded-full"
              onClick={() => openFlow()}
              disabled={!applicationData}
            >
              <PanelRightOpenIcon data-icon="inline-start" aria-hidden />
              {primaryActionLabel}
            </Button>
          </CardFooter>
        </Card>
        {applicationData ? (
          <FiscalSponsorshipWorkflowDrawer
            data={applicationData}
            selectedPhaseId={selectedPhaseId}
            onClose={() => setSheetOpen(false)}
            onOpenApplication={openApplication}
          />
        ) : null}
      </Sheet>
      {applicationData ? (
        <FiscalSponsorshipApplicationDrawer
          data={applicationData}
          open={applicationOpen}
          onOpenChange={setApplicationOpen}
          onSaved={() => router.refresh()}
        />
      ) : null}
    </>
  )
}
