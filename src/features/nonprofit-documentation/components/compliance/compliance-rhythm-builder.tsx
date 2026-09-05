"use client"

import { DocumentationToolFlow } from "../documentation-tool-flow"

import { DEFAULT_COMPLIANCE_RHYTHM } from "../../lib/compliance-rhythm"
import { DocumentationDraftToolbar } from "../documentation-draft-toolbar"

import { useMemo, useState } from "react"
import DownloadIcon from "lucide-react/dist/esm/icons/download"
import ExternalLinkIcon from "lucide-react/dist/esm/icons/external-link"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { useComplianceRhythm } from "../../hooks/use-compliance-rhythm"
import {
  US_STATE_OPTIONS,
  buildComplianceCsv,
  buildComplianceTasks,
  commonFederalFilingPath,
  nominalAnnualReturnDueDate,
  stateNameFor,
} from "../../lib/compliance-rhythm"
import type {
  ComplianceAssetsBand,
  ComplianceReceiptsBand,
  ComplianceRhythmDraft,
} from "../../types"

const RECEIPTS_OPTIONS: Array<{
  value: ComplianceReceiptsBand
  label: string
}> = [
  { value: "normally-50k-or-less", label: "$50,000 or less, normally" },
  { value: "under-200k", label: "More than $50,000, under $200,000" },
  { value: "200k-or-more", label: "$200,000 or more" },
]

const ASSETS_OPTIONS: Array<{ value: ComplianceAssetsBand; label: string }> = [
  { value: "under-500k", label: "Under $500,000" },
  { value: "500k-or-more", label: "$500,000 or more" },
]

const EMPTY_STATE_VALUE = "choose-jurisdiction"

function downloadCsv(draft: ComplianceRhythmDraft) {
  const file = new Blob([buildComplianceCsv(draft)], {
    type: "text/csv;charset=utf-8",
  })
  const url = URL.createObjectURL(file)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = "nonprofit-compliance-rhythm.csv"
  anchor.click()
  URL.revokeObjectURL(url)
}

function BuilderFields({
  draft,
  updateDraft,
}: {
  draft: ComplianceRhythmDraft
  updateDraft: <Key extends keyof ComplianceRhythmDraft>(
    key: Key,
    value: ComplianceRhythmDraft[Key]
  ) => void
}) {
  return (
    <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="compliance-state">Primary state or territory</Label>
        <Select
          value={draft.stateCode || EMPTY_STATE_VALUE}
          onValueChange={(value) =>
            updateDraft("stateCode", value === EMPTY_STATE_VALUE ? "" : value)
          }
        >
          <SelectTrigger id="compliance-state" className="min-h-11 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={EMPTY_STATE_VALUE}>
              Choose a jurisdiction…
            </SelectItem>
            {US_STATE_OPTIONS.map(([code, name]) => (
              <SelectItem key={code} value={code}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tax-year-end">Tax-year end</Label>
        <Input
          id="tax-year-end"
          name="taxYearEnd"
          type="date"
          value={draft.taxYearEnd}
          onChange={(event) => updateDraft("taxYearEnd", event.target.value)}
          className="min-h-11 text-base"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="gross-receipts">Annual gross receipts</Label>
        <Select
          value={draft.receiptsBand}
          onValueChange={(value) =>
            updateDraft("receiptsBand", value as ComplianceReceiptsBand)
          }
        >
          <SelectTrigger id="gross-receipts" className="min-h-11 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RECEIPTS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="total-assets">Total assets at year end</Label>
        <Select
          value={draft.assetsBand}
          onValueChange={(value) =>
            updateDraft("assetsBand", value as ComplianceAssetsBand)
          }
        >
          <SelectTrigger id="total-assets" className="min-h-11 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ASSETS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <label className="hover:bg-muted/35 flex min-h-14 cursor-pointer items-center gap-3 border p-4 transition-colors lg:col-span-2">
        <Checkbox
          checked={draft.solicitsContributions}
          onCheckedChange={(checked) =>
            updateDraft("solicitsContributions", checked === true)
          }
        />
        <span className="min-w-0">
          <span className="block text-sm font-medium">
            The organization solicits contributions
          </span>
          <span className="text-muted-foreground block text-xs leading-5">
            Include charitable solicitation registration and renewal review.
          </span>
        </span>
      </label>

      <label className="hover:bg-muted/35 flex min-h-14 cursor-pointer items-center gap-3 border p-4 transition-colors lg:col-span-2">
        <Checkbox
          checked={draft.hasEmployees}
          onCheckedChange={(checked) =>
            updateDraft("hasEmployees", checked === true)
          }
        />
        <span className="min-w-0">
          <span className="block text-sm font-medium">
            The organization has employees
          </span>
          <span className="text-muted-foreground block text-xs leading-5">
            Include federal and state employer-system review.
          </span>
        </span>
      </label>
    </div>
  )
}

export function ComplianceRhythmBuilder() {
  const {
    draft,
    storageReady,
    storageStatus,
    updateDraft,
    loadExample,
    reset,
  } = useComplianceRhythm()
  const [announcement, setAnnouncement] = useState("")
  const filingPath = useMemo(
    () => commonFederalFilingPath(draft.receiptsBand, draft.assetsBand),
    [draft.assetsBand, draft.receiptsBand]
  )
  const dueDate = useMemo(
    () => nominalAnnualReturnDueDate(draft.taxYearEnd),
    [draft.taxYearEnd]
  )
  const tasks = useMemo(() => buildComplianceTasks(draft), [draft])
  const stateName = stateNameFor(draft.stateCode)

  const handleReset = () => {
    if (!window.confirm("Reset this compliance planning draft?")) return
    reset()
    setAnnouncement("Compliance planning draft reset.")
  }

  const handleDownload = () => {
    downloadCsv(draft)
    setAnnouncement("Compliance planning CSV downloaded.")
  }

  return (
    <fieldset disabled={!storageReady} className="min-w-0">
      <DocumentationDraftToolbar
        ready={storageReady}
        storageStatus={storageStatus}
        hasChanges={
          JSON.stringify(draft) !== JSON.stringify(DEFAULT_COMPLIANCE_RHYTHM)
        }
        onLoadExample={() => {
          loadExample()
          setAnnouncement("Example compliance profile loaded.")
        }}
        onReset={handleReset}
      />

      <DocumentationToolFlow
        hasDraft={
          JSON.stringify(draft) !== JSON.stringify(DEFAULT_COMPLIANCE_RHYTHM)
        }
        steps={[
          {
            id: "facts",
            label: "Organization facts",
            content: <BuilderFields draft={draft} updateDraft={updateDraft} />,
          },
          {
            id: "review",
            label: "Calendar & export",
            content: (
              <div className="bg-muted/20 border-t p-5 sm:p-6">
                <div className="bg-border grid gap-px overflow-hidden border sm:grid-cols-2">
                  <div className="bg-background p-5">
                    <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                      Common federal path
                    </p>
                    <p className="mt-3 text-lg font-semibold">
                      {filingPath.form}
                    </p>
                    <p className="text-muted-foreground mt-2 text-sm leading-6">
                      {filingPath.explanation}
                    </p>
                  </div>
                  <div className="bg-background p-5">
                    <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                      Annual return planning date
                    </p>
                    <p className="mt-3 text-lg font-semibold tabular-nums">
                      {dueDate?.label ?? "Add the tax-year end"}
                    </p>
                    <p className="text-muted-foreground mt-2 text-sm leading-6">
                      This is the nominal Form 990-series date. Confirm
                      weekends, holidays, extensions, exceptions, and the
                      applicable form with the IRS.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">Planning rhythm</h3>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {tasks.length} review lanes
                      {stateName ? ` · Starting with ${stateName}` : ""}
                    </p>
                  </div>
                  <Button
                    type="button"
                    className="min-h-11"
                    onClick={handleDownload}
                  >
                    <DownloadIcon className="size-4" aria-hidden />
                    Download CSV
                  </Button>
                </div>

                <ol className="mt-4 divide-y border-y">
                  {tasks.map((task, index) => (
                    <li
                      key={task.id}
                      className="grid gap-3 py-5 sm:grid-cols-[2.5rem_minmax(0,1fr)]"
                    >
                      <span className="text-muted-foreground font-mono text-xs tabular-nums">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-muted-foreground text-xs">
                            {task.category}
                          </span>
                          <span className="bg-muted border px-2 py-0.5 text-[11px] font-medium">
                            {task.status}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 font-semibold">
                          {task.task}
                        </p>
                        <p className="text-muted-foreground mt-2 text-sm leading-6">
                          <strong className="text-foreground">Timing:</strong>{" "}
                          {task.timing}
                        </p>
                        <p className="text-muted-foreground mt-1 text-sm leading-6">
                          <strong className="text-foreground">Keep:</strong>{" "}
                          {task.evidence}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-muted-foreground max-w-xl text-xs leading-5">
                    This tool creates a planning draft, not a legal
                    determination. Its filing path uses common IRS thresholds
                    and may not fit organizations with special filing rules.
                  </p>
                  <a
                    href="https://www.irs.gov/charities-non-profits/state-links"
                    target="_blank"
                    rel="noreferrer"
                    className="focus-visible:ring-ring inline-flex min-h-11 items-center gap-2 px-1 text-sm font-semibold underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
                  >
                    Open IRS state directory
                    <ExternalLinkIcon className="size-4" aria-hidden />
                  </a>
                </div>
                <p className="sr-only" aria-live="polite">
                  {announcement}
                </p>
              </div>
            ),
          },
        ]}
      />
    </fieldset>
  )
}
