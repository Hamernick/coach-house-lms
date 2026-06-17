"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

import ArrowUpRightIcon from "lucide-react/dist/esm/icons/arrow-up-right"
import PenLineIcon from "lucide-react/dist/esm/icons/pen-line"
import PlusIcon from "lucide-react/dist/esm/icons/plus"
import SendIcon from "lucide-react/dist/esm/icons/send"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

import type {
  EmailOpsCampaign,
  EmailOpsCampaignStatus,
  EmailOpsDashboardInput,
  EmailOpsTestSendAction,
} from "../types"
import { EmailOpsAnalyticsPanel } from "./email-ops-analytics-panel"

type EmailOpsPanelProps = {
  input: EmailOpsDashboardInput
  testSendAction: EmailOpsTestSendAction
}

function resolveCampaignStatusLabel(status: EmailOpsCampaignStatus) {
  if (status === "review") return "In review"
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function resolveCampaignStatusClassName(status: EmailOpsCampaignStatus) {
  if (status === "sent") return "text-emerald-600 dark:text-emerald-300"
  if (status === "scheduled") return "text-sky-600 dark:text-sky-300"
  if (status === "review") return "text-amber-600 dark:text-amber-300"
  if (status === "paused") return "text-muted-foreground"
  return "text-primary"
}

function CampaignSummary({
  campaign,
  audienceLabel,
}: {
  campaign: EmailOpsCampaign
  audienceLabel: string
}) {
  return (
    <div className="grid gap-3 border-t border-border/60 pt-4 text-sm sm:grid-cols-3">
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">Subject</p>
        <p className="mt-1 truncate font-medium">{campaign.subject}</p>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">Audience</p>
        <p className="mt-1 truncate font-medium">{audienceLabel}</p>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">Updated</p>
        <p className="mt-1 truncate font-medium">
          {campaign.updatedAtLabel}
          {campaign.scheduledForLabel ? ` / ${campaign.scheduledForLabel}` : ""}
        </p>
      </div>
    </div>
  )
}

export function EmailOpsPanel({ input }: EmailOpsPanelProps) {
  const [selectedCampaignId, setSelectedCampaignId] = useState(
    input.selectedCampaignId
  )
  const selectedCampaign =
    input.campaigns.find((campaign) => campaign.id === selectedCampaignId) ??
    input.campaigns[0]
  const selectedSegment = input.segments.find(
    (segment) => segment.id === selectedCampaign.audienceSegmentId
  )
  const audienceLabel = selectedSegment
    ? `${selectedSegment.label} / ${selectedSegment.count}`
    : "No audience selected"
  const statusLabel = useMemo(
    () => resolveCampaignStatusLabel(selectedCampaign.status),
    [selectedCampaign.status]
  )

  return (
    <div className="-m-[var(--shell-content-pad)] flex min-h-[calc(100%_+_var(--shell-content-pad)_+_var(--shell-content-pad))] flex-1 flex-col overflow-hidden bg-background">
      <h1 className="sr-only">Email operations</h1>
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-5">
          <section className="rounded-[1.5rem] border border-border/60 bg-background p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1 space-y-3">
                <Select
                  value={selectedCampaign.id}
                  onValueChange={setSelectedCampaignId}
                >
                  <SelectTrigger
                    aria-label="Select email draft"
                    className="h-auto w-full max-w-xl rounded-xl border-border/60 bg-muted/40 px-3 py-2 text-left text-base font-semibold shadow-none"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {input.campaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  {selectedCampaign.previewText}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/email/drafts/new">
                    <PlusIcon aria-hidden />
                    New
                  </Link>
                </Button>
                <Button asChild className="rounded-full">
                  <Link href={`/email/drafts/${selectedCampaign.id}`}>
                    <PenLineIcon aria-hidden />
                    Open draft
                  </Link>
                </Button>
                <Button asChild variant="secondary" className="rounded-full">
                  <Link href={`/email/drafts/${selectedCampaign.id}?mode=send`}>
                    <SendIcon aria-hidden />
                    Send
                  </Link>
                </Button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs font-medium">
              <span
                className={cn(
                  "inline-flex items-center gap-2",
                  resolveCampaignStatusClassName(selectedCampaign.status)
                )}
              >
                <span className="size-1.5 rounded-full bg-current" aria-hidden />
                {statusLabel}
              </span>
              <Link
                href={`/email/drafts/${selectedCampaign.id}`}
                className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                Continue editing
                <ArrowUpRightIcon className="size-3.5" aria-hidden />
              </Link>
            </div>

            <CampaignSummary
              campaign={selectedCampaign}
              audienceLabel={audienceLabel}
            />
          </section>

          <section className="min-h-0">
            <EmailOpsAnalyticsPanel
              heatmap={input.heatmap}
              metricTrend={input.metricTrend}
              summaryMetrics={input.summaryMetrics}
            />
          </section>
        </div>
      </main>
    </div>
  )
}
