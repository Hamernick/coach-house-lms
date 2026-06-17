"use client"

import CheckCircle2Icon from "lucide-react/dist/esm/icons/check-circle-2"
import CircleDashedIcon from "lucide-react/dist/esm/icons/circle-dashed"
import ExternalLinkIcon from "lucide-react/dist/esm/icons/external-link"
import FileTextIcon from "lucide-react/dist/esm/icons/file-text"
import FolderOpenIcon from "lucide-react/dist/esm/icons/folder-open"
import HourglassIcon from "lucide-react/dist/esm/icons/hourglass"

import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

import type {
  FiscalSponsorshipProjectAssetOption,
  FiscalSponsorshipProjectWorkbenchAdminActionProps,
  FiscalSponsorshipProjectWorkbenchDocumentActionProps,
  FiscalSponsorshipProjectWorkbenchData,
  FiscalSponsorshipProjectWorkbenchItem,
  FiscalSponsorshipProjectWorkbenchPhase,
} from "../types"
import { FiscalSponsorshipMark } from "./fiscal-sponsorship-mark"
import { FiscalSponsorshipProjectWorkbenchAdminActions } from "./fiscal-sponsorship-project-workbench-admin-actions"
import { FiscalSponsorshipProjectWorkbenchDocuments } from "./fiscal-sponsorship-project-workbench-documents"
import { FiscalSponsorshipProjectWorkbenchRequiredDocuments } from "./fiscal-sponsorship-project-workbench-required-documents"
import { FiscalSponsorshipWorkflowTimeline } from "./fiscal-sponsorship-workflow-timeline"

function WorkbenchItemRow({
  item,
}: {
  item: FiscalSponsorshipProjectWorkbenchItem
}) {
  const Icon = item.complete ? CheckCircle2Icon : CircleDashedIcon

  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          item.complete ? "text-emerald-600" : "text-amber-600"
        )}
        aria-hidden
      />
      <div className="min-w-0">
        <p className="text-foreground truncate text-xs font-medium">
          {item.label}
        </p>
        <p className="text-muted-foreground mt-0.5 line-clamp-2 text-[11px] leading-snug">
          {item.description}
        </p>
      </div>
    </div>
  )
}

function WorkbenchSection({
  title,
  items,
}: {
  title: string
  items: FiscalSponsorshipProjectWorkbenchItem[]
}) {
  return (
    <section className="min-w-0">
      <p className="text-muted-foreground mb-2 text-[11px] font-medium tracking-wide uppercase">
        {title}
      </p>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <WorkbenchItemRow key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}

function WorkbenchPhaseRow({
  item,
  onOpenApplication,
  onOpenAssets,
}: {
  item: FiscalSponsorshipProjectWorkbenchPhase
  onOpenApplication?: () => void
  onOpenAssets?: () => void
}) {
  const complete = item.complete
  const Icon = complete ? CheckCircle2Icon : HourglassIcon
  const canOpenApplication =
    item.actionType === "application" && Boolean(onOpenApplication)
  const canOpenAssets = item.actionType === "assets" && Boolean(onOpenAssets)
  const canOpenHref =
    (item.actionType === "document" || item.actionType === "signature") &&
    Boolean(item.href)
  const hasAction = canOpenApplication || canOpenAssets || canOpenHref
  const disabled = item.actionType === "waiting" || !hasAction
  const buttonContent = (
    <>
      {canOpenHref ? (
        <ExternalLinkIcon data-icon="inline-start" aria-hidden />
      ) : null}
      {item.actionType === "assets" ? (
        <FolderOpenIcon data-icon="inline-start" aria-hidden />
      ) : null}
      {item.actionLabel}
    </>
  )

  return (
    <div
      data-fiscal-sponsorship-workbench-phase={item.id}
      className="flex min-w-0 flex-col gap-2 py-2.5 sm:flex-row sm:items-start sm:gap-3"
    >
      <div className="flex min-w-0 flex-1 items-start gap-2.5">
        <Icon
          className={cn(
            "mt-1 size-4 shrink-0",
            complete ? "text-emerald-600" : "text-amber-600"
          )}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="text-foreground truncate text-xs font-medium">
              {item.label}
            </p>
            <Badge className="bg-secondary text-secondary-foreground h-6 rounded-full border-transparent px-2 py-0.5 text-[11px] leading-none">
              {item.statusLabel}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-0.5 line-clamp-2 text-[11px] leading-snug">
            {item.description}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 sm:justify-end">
        {canOpenHref ? (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 rounded-full px-3"
            data-fiscal-sponsorship-phase-action={item.actionType}
          >
            <a href={item.href ?? "#"} target="_blank" rel="noreferrer">
              {buttonContent}
            </a>
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 rounded-full px-3"
            disabled={disabled}
            onClick={
              canOpenApplication
                ? onOpenApplication
                : canOpenAssets
                  ? onOpenAssets
                  : undefined
            }
            data-fiscal-sponsorship-phase-action={item.actionType}
          >
            {buttonContent}
          </Button>
        )}
      </div>
    </div>
  )
}

function WorkbenchPhaseTimeline({
  items,
  onOpenApplication,
  onOpenAssets,
}: {
  items: FiscalSponsorshipProjectWorkbenchPhase[]
  onOpenApplication?: () => void
  onOpenAssets?: () => void
}) {
  return (
    <section className="min-w-0">
      <div>
        <p className="text-sm font-semibold">Fiscal sponsorship progress</p>
        <p className="text-muted-foreground mt-1 text-xs leading-snug">
          Follow the handbook flow: intake, required documents, review,
          agreement, signatures, then grant requests.
        </p>
      </div>
      <div className="divide-border/70 mt-2 divide-y divide-dashed">
        {items.map((item) => (
          <WorkbenchPhaseRow
            key={item.id}
            item={item}
            onOpenApplication={onOpenApplication}
            onOpenAssets={onOpenAssets}
          />
        ))}
      </div>
    </section>
  )
}

export function FiscalSponsorshipProjectWorkbench({
  canConnectDocuments = false,
  className,
  connectFiscalSponsorshipDocumentAssetAction,
  data,
  editApplicationDisabled = false,
  generateFiscalSponsorshipAgreementAction,
  onEditApplication,
  onOpenAssets,
  projectAssets = [],
  reviewFiscalSponsorshipApplicationAction,
  reviewFiscalSponsorshipDocumentAction,
  sendFiscalSponsorshipAgreementForSignatureAction,
}: FiscalSponsorshipProjectWorkbenchAdminActionProps &
  FiscalSponsorshipProjectWorkbenchDocumentActionProps & {
    canConnectDocuments?: boolean
    className?: string
    data: FiscalSponsorshipProjectWorkbenchData
    editApplicationDisabled?: boolean
    onEditApplication?: () => void
    onOpenAssets?: () => void
    projectAssets?: FiscalSponsorshipProjectAssetOption[]
  }) {
  return (
    <Card
      data-fiscal-sponsorship-project-workbench={data.projectId}
      className={cn(
        "text-card-foreground border-border/60 bg-muted flex w-full max-w-[42rem] flex-col rounded-[2rem] border p-3 shadow-sm",
        className
      )}
    >
      <CardHeader className="px-4 pt-2 pb-3">
        <div className="flex min-w-0 items-start gap-3">
          <FiscalSponsorshipMark className="size-9 rounded-[1.15rem] text-base" />
          <div className="min-w-0">
            <CardTitle className="text-foreground truncate text-[15px] leading-5 font-semibold tracking-tight">
              Fiscal Sponsorship
            </CardTitle>
            <p className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-snug">
              {data.projectName} for {data.organizationName}
            </p>
          </div>
        </div>
        <CardAction>
          <Badge className="bg-primary/10 text-primary h-7 rounded-full border-transparent px-2.5 py-1 leading-none">
            {data.statusLabel}
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="bg-background border-border/60 rounded-[1.45rem] border p-3">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              Fiscal sponsorship workbench
            </p>
            <p className="text-muted-foreground mt-1 text-xs leading-snug">
              One place for intake, uploads, review, generated documents,
              signatures, and grant-payment readiness.
            </p>
          </div>
          <div className="text-right">
            <p className="text-foreground text-sm font-semibold tabular-nums">
              {data.readinessPercent}%
            </p>
            <p className="text-muted-foreground text-[11px]">ready</p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {data.metrics.map((metric) => (
            <div key={metric.id} className="min-w-0">
              <p className="text-muted-foreground text-[11px]">
                {metric.label}
              </p>
              <p className="text-foreground truncate text-xs font-medium">
                {metric.value}
              </p>
            </div>
          ))}
        </div>

        <Separator className="my-3 border-t border-dashed bg-transparent" />

        <WorkbenchPhaseTimeline
          items={data.phases}
          onOpenApplication={onEditApplication}
          onOpenAssets={onOpenAssets}
        />

        <Separator className="my-3 border-t border-dashed bg-transparent" />

        <FiscalSponsorshipWorkflowTimeline events={data.timelineEvents} />

        <Separator className="my-3 border-t border-dashed bg-transparent" />

        <FiscalSponsorshipProjectWorkbenchRequiredDocuments
          assets={projectAssets}
          canConnectDocuments={canConnectDocuments}
          connectFiscalSponsorshipDocumentAssetAction={
            connectFiscalSponsorshipDocumentAssetAction
          }
          documents={data.workflowSummary?.requiredDocuments ?? []}
          legalEntityType={data.workflowSummary?.legalEntityType ?? null}
          onOpenAssets={onOpenAssets}
          projectId={data.projectId}
          reviewFiscalSponsorshipDocumentAction={
            reviewFiscalSponsorshipDocumentAction
          }
        />

        <Separator className="my-3 border-t border-dashed bg-transparent" />

        <FiscalSponsorshipProjectWorkbenchDocuments
          documents={data.documentActions}
          signingActions={data.signingActions}
        />

        <Separator className="my-3 border-t border-dashed bg-transparent" />

        <WorkbenchSection title="Required data" items={data.requiredItems} />
      </CardContent>

      <CardFooter className="items-center justify-between gap-3 px-4 pt-3 pb-1">
        <div className="min-w-0">
          <p className="text-muted-foreground truncate text-[11px]">
            Applicant: {data.applicantName}
          </p>
          <p className="text-muted-foreground truncate text-[11px]">
            Next: {data.nextStep}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 rounded-full px-3"
            disabled={!onEditApplication || editApplicationDisabled}
            onClick={onEditApplication}
          >
            <FileTextIcon data-icon="inline-start" aria-hidden />
            Edit
          </Button>
          <FiscalSponsorshipProjectWorkbenchAdminActions
            agreementDocumentId={data.latestAgreementDocumentId}
            canApproveApplication={data.canApproveApplication}
            canGenerateAgreement={data.canGenerateAgreement}
            canSendAgreement={data.canSendAgreement}
            generateFiscalSponsorshipAgreementAction={
              generateFiscalSponsorshipAgreementAction
            }
            projectId={data.projectId}
            reviewFiscalSponsorshipApplicationAction={
              reviewFiscalSponsorshipApplicationAction
            }
            reviewFiscalSponsorshipDocumentAction={
              reviewFiscalSponsorshipDocumentAction
            }
            sendFiscalSponsorshipAgreementForSignatureAction={
              sendFiscalSponsorshipAgreementForSignatureAction
            }
          />
        </div>
      </CardFooter>
    </Card>
  )
}
