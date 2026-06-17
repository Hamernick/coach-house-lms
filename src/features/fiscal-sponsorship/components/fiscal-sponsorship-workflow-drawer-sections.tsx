"use client"

import * as React from "react"
import CheckCircle2Icon from "lucide-react/dist/esm/icons/check-circle-2"
import ChevronDownIcon from "lucide-react/dist/esm/icons/chevron-down"
import CircleDashedIcon from "lucide-react/dist/esm/icons/circle-dashed"
import DownloadIcon from "lucide-react/dist/esm/icons/download"
import ExternalLinkIcon from "lucide-react/dist/esm/icons/external-link"
import FileTextIcon from "lucide-react/dist/esm/icons/file-text"
import PenLineIcon from "lucide-react/dist/esm/icons/pen-line"
import UploadIcon from "lucide-react/dist/esm/icons/upload"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

import type {
  FiscalSponsorshipProjectWorkbenchData,
  FiscalSponsorshipProjectWorkbenchDocumentAction,
  FiscalSponsorshipProjectWorkbenchPhase,
  FiscalSponsorshipProjectWorkbenchSigningAction,
} from "../types"

export type WorkflowTab = "work" | "docs" | "sign"

export const FISCAL_WORKFLOW_DISCLOSURE_ROW_CLASSNAME =
  "group rounded-xl border border-transparent transition-[background-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
const FISCAL_WORKFLOW_DISCLOSURE_TRIGGER_CLASSNAME =
  "flex w-full min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left outline-none transition-[background-color,color] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-muted/50 focus-visible:ring-ring/50 focus-visible:ring-2 motion-reduce:transition-none"
const FISCAL_WORKFLOW_DISCLOSURE_BODY_CLASSNAME =
  "grid transition-[grid-template-rows,opacity] duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"

export function resolveWorkflowTabForPhase(
  selectedPhaseId: string | undefined
): WorkflowTab {
  if (
    selectedPhaseId === "required-documents" ||
    selectedPhaseId === "fund-setup" ||
    selectedPhaseId === "grant-request"
  ) {
    return "docs"
  }

  if (selectedPhaseId === "signatures" || selectedPhaseId === "agreement") {
    return "sign"
  }

  return "work"
}

function getPhaseActionIcon(phase: FiscalSponsorshipProjectWorkbenchPhase) {
  if (phase.actionType === "application") return FileTextIcon
  if (phase.actionType === "assets") return UploadIcon
  if (phase.actionType === "signature") return PenLineIcon
  return ExternalLinkIcon
}

export function FiscalWorkflowDisclosureRow({
  children,
  complete,
  defaultOpen = false,
  description,
  id,
  statusLabel,
  title,
}: {
  children?: React.ReactNode
  complete: boolean
  defaultOpen?: boolean
  description?: string
  id: string
  statusLabel: string
  title: string
}) {
  const [open, setOpen] = React.useState(defaultOpen)
  const bodyId = React.useId()
  const StatusIcon = complete ? CheckCircle2Icon : CircleDashedIcon

  React.useEffect(() => {
    if (defaultOpen) setOpen(true)
  }, [defaultOpen])

  return (
    <div
      data-fiscal-workflow-disclosure-row={id}
      data-state={open ? "open" : "closed"}
      className={cn(
        FISCAL_WORKFLOW_DISCLOSURE_ROW_CLASSNAME,
        open && "bg-muted/55"
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        className={FISCAL_WORKFLOW_DISCLOSURE_TRIGGER_CLASSNAME}
        onClick={() => setOpen((currentOpen) => !currentOpen)}
      >
        <span
          className={cn(
            "text-muted-foreground inline-flex size-7 shrink-0 items-center justify-center rounded-full",
            (complete || open) && "bg-primary/10 text-primary"
          )}
          aria-hidden
        >
          <StatusIcon className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center justify-between gap-3">
            <span className="text-foreground min-w-0 truncate text-sm font-medium">
              {title}
            </span>
            <Badge
              variant="outline"
              className={cn(
                "h-7 max-w-full overflow-visible rounded-full border-transparent px-2.5 py-1 leading-none transition-[background-color,color] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]",
                complete
                  ? "bg-emerald-500/10 text-emerald-700 group-focus-within:bg-emerald-500/15 group-focus-within:text-emerald-800 group-hover:bg-emerald-500/15 group-hover:text-emerald-800 dark:text-emerald-300 dark:group-focus-within:text-emerald-200 dark:group-hover:text-emerald-200"
                  : "bg-amber-500/10 text-amber-700 group-focus-within:bg-amber-500/15 group-focus-within:text-amber-800 group-hover:bg-amber-500/15 group-hover:text-amber-800 dark:text-amber-300 dark:group-focus-within:text-amber-200 dark:group-hover:text-amber-200"
              )}
            >
              {statusLabel}
            </Badge>
          </span>
        </span>
        <ChevronDownIcon
          className={cn(
            "text-muted-foreground size-4 shrink-0 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>
      <div
        id={bodyId}
        aria-hidden={!open}
        className={cn(
          FISCAL_WORKFLOW_DISCLOSURE_BODY_CLASSNAME,
          open
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
                open ? "translate-y-0" : "-translate-y-1"
              )}
            >
              {description ? (
                <p className="text-muted-foreground text-xs leading-snug">
                  {description}
                </p>
              ) : null}
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function WorkflowActionButton({
  onOpenApplication,
  phase,
  setActiveTab,
}: {
  onOpenApplication: () => void
  phase: FiscalSponsorshipProjectWorkbenchPhase
  setActiveTab: (value: WorkflowTab) => void
}) {
  const Icon = getPhaseActionIcon(phase)

  if (phase.actionType === "application") {
    return (
      <Button
        type="button"
        size="sm"
        variant={phase.complete ? "ghost" : "default"}
        className="h-8 rounded-full px-3"
        onClick={onOpenApplication}
      >
        <Icon data-icon="inline-start" aria-hidden />
        {phase.actionLabel}
      </Button>
    )
  }

  if (phase.actionType === "assets") {
    return (
      <Button
        type="button"
        size="sm"
        variant={phase.complete ? "ghost" : "default"}
        className="h-8 rounded-full px-3"
        onClick={() => setActiveTab("docs")}
      >
        <Icon data-icon="inline-start" aria-hidden />
        {phase.actionLabel}
      </Button>
    )
  }

  if (
    (phase.actionType === "document" || phase.actionType === "signature") &&
    phase.href
  ) {
    return (
      <Button asChild size="sm" className="h-8 rounded-full px-3">
        <a href={phase.href} target="_blank" rel="noreferrer">
          <Icon data-icon="inline-start" aria-hidden />
          {phase.actionLabel}
        </a>
      </Button>
    )
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className="h-8 rounded-full px-3"
      disabled
    >
      {phase.actionLabel}
    </Button>
  )
}

export function WorkflowPhases({
  data,
  onOpenApplication,
  selectedPhaseId,
  setActiveTab,
}: {
  data: FiscalSponsorshipProjectWorkbenchData
  onOpenApplication: () => void
  selectedPhaseId?: string
  setActiveTab: (value: WorkflowTab) => void
}) {
  const defaultOpenPhaseId =
    selectedPhaseId ??
    data.phases.find((phase) => !phase.complete)?.id ??
    data.phases[0]?.id

  return (
    <div className="flex flex-col gap-3">
      <div className="px-1 pt-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold">Fiscal sponsorship progress</p>
            <p className="text-muted-foreground mt-1 text-xs leading-snug">
              {data.nextStep}
            </p>
          </div>
          <p className="text-sm font-semibold tabular-nums">
            {data.readinessPercent}%
          </p>
        </div>
        <Progress value={data.readinessPercent} className="mt-3 h-1.5" />
      </div>

      <div className="flex flex-col gap-1">
        {data.phases.map((phase) => (
          <FiscalWorkflowDisclosureRow
            key={phase.id}
            id={`phase-${phase.id}`}
            title={phase.label}
            description={phase.description}
            statusLabel={phase.statusLabel}
            complete={phase.complete}
            defaultOpen={phase.id === defaultOpenPhaseId}
          >
            <WorkflowActionButton
              phase={phase}
              setActiveTab={setActiveTab}
              onOpenApplication={onOpenApplication}
            />
          </FiscalWorkflowDisclosureRow>
        ))}
      </div>
    </div>
  )
}

export function RequiredDataSummary({
  data,
}: {
  data: FiscalSponsorshipProjectWorkbenchData
}) {
  return (
    <section className="flex flex-col gap-2">
      <p className="text-sm font-semibold">Required data</p>
      <div className="flex flex-col gap-1">
        {data.requiredItems.map((item) => (
          <FiscalWorkflowDisclosureRow
            key={item.id}
            id={`required-${item.id}`}
            title={item.label}
            description={item.description}
            statusLabel={item.complete ? "Complete" : "Needed"}
            complete={item.complete}
          />
        ))}
      </div>
    </section>
  )
}

function DocumentActionButtons({
  document,
}: {
  document: FiscalSponsorshipProjectWorkbenchDocumentAction
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {document.viewHref ? (
        <Button asChild variant="ghost" size="sm" className="h-8 rounded-full">
          <a href={document.viewHref} target="_blank" rel="noreferrer">
            <ExternalLinkIcon data-icon="inline-start" aria-hidden />
            View
          </a>
        </Button>
      ) : null}
      {document.downloadHref ? (
        <Button asChild variant="ghost" size="sm" className="h-8 rounded-full">
          <a href={document.downloadHref} target="_blank" rel="noreferrer">
            <DownloadIcon data-icon="inline-start" aria-hidden />
            Download
          </a>
        </Button>
      ) : null}
    </div>
  )
}

export function DocumentsAndSigning({
  data,
}: {
  data: FiscalSponsorshipProjectWorkbenchData
}) {
  const visibleDocuments = data.documentActions.filter(
    (document) => document.viewHref || document.downloadHref
  )

  return (
    <div className="flex flex-col gap-3">
      {visibleDocuments.length > 0 ? (
        <div className="flex flex-col gap-1">
          {visibleDocuments.map((document) => (
            <FiscalWorkflowDisclosureRow
              key={document.id}
              id={`document-${document.id}`}
              title={document.title}
              description={document.description}
              statusLabel={document.statusLabel}
              complete={true}
            >
              <DocumentActionButtons document={document} />
            </FiscalWorkflowDisclosureRow>
          ))}
        </div>
      ) : (
        <Alert>
          <FileTextIcon aria-hidden />
          <AlertTitle>No prepared documents yet</AlertTitle>
          <AlertDescription>
            Agreement and executed document links appear here after Coach House
            review, confirmation, and DocuSeal activity.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export function SigningActions({
  signingActions,
}: {
  signingActions: FiscalSponsorshipProjectWorkbenchSigningAction[]
}) {
  if (signingActions.length === 0) {
    return (
      <Alert>
        <PenLineIcon aria-hidden />
        <AlertTitle>No signature packet yet</AlertTitle>
        <AlertDescription>
          Applicant and Coach House signing links appear after the agreement is
          generated and sent.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {signingActions.map((action) => (
        <FiscalWorkflowDisclosureRow
          key={action.id}
          id={`signing-${action.id}`}
          title={action.title}
          description={action.description}
          statusLabel={action.statusLabel}
          complete={!action.href}
        >
          {action.href ? (
            <Button asChild size="sm" className="w-fit rounded-full">
              <a href={action.href} target="_blank" rel="noreferrer">
                <PenLineIcon data-icon="inline-start" aria-hidden />
                Sign
              </a>
            </Button>
          ) : null}
        </FiscalWorkflowDisclosureRow>
      ))}
    </div>
  )
}
