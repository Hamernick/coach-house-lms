"use client"

import { useState } from "react"
import RotateCcwIcon from "lucide-react/dist/esm/icons/rotate-ccw"

import { Button } from "@/components/ui/button"

import type { FinancePlanDraft } from "../../finance-types"
import { useFinancePlan } from "../../hooks/use-finance-plan"
import {
  buildFinanceCsv,
  buildFinanceReviewPrompt,
} from "../../lib/finance-plan"
import { FinanceOperationsFields } from "./finance-operations-fields"
import { FinancePlanFields } from "./finance-plan-fields"
import { FinancePlanResults } from "./finance-plan-results"

function downloadCsv(draft: FinancePlanDraft) {
  const file = new Blob([buildFinanceCsv(draft)], {
    type: "text/csv;charset=utf-8",
  })
  const url = URL.createObjectURL(file)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = "nonprofit-operating-finance-plan.csv"
  anchor.click()
  URL.revokeObjectURL(url)
}

export function FinancePlanBuilder() {
  const { draft, storageReady, updateDraft, loadExample, reset } =
    useFinancePlan()
  const [announcement, setAnnouncement] = useState("")
  const [promptCopied, setPromptCopied] = useState(false)

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(buildFinanceReviewPrompt(draft))
      setPromptCopied(true)
      setAnnouncement("Finance review prompt copied.")
    } catch {
      setPromptCopied(false)
      setAnnouncement("Finance review prompt could not be copied.")
    }
  }

  return (
    <fieldset disabled={!storageReady} className="min-w-0">
      <div className="bg-muted/30 flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-6">
        <div>
          <p className="text-sm font-semibold">
            Working operating-finance plan
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {storageReady ? "Saved on this device" : "Loading saved draft…"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={() => {
              loadExample()
              setPromptCopied(false)
              setAnnouncement("Example finance plan loaded.")
            }}
          >
            Load example
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="min-h-11"
            onClick={() => {
              if (!window.confirm("Reset this finance plan?")) return
              reset()
              setPromptCopied(false)
              setAnnouncement("Finance plan reset.")
            }}
          >
            <RotateCcwIcon className="size-4" aria-hidden /> Reset
          </Button>
        </div>
      </div>
      <FinancePlanFields draft={draft} updateDraft={updateDraft} />
      <FinanceOperationsFields draft={draft} updateDraft={updateDraft} />
      <FinancePlanResults
        draft={draft}
        promptCopied={promptCopied}
        onCopyPrompt={copyPrompt}
        onDownload={() => {
          downloadCsv(draft)
          setAnnouncement("Finance plan CSV downloaded.")
        }}
      />
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </fieldset>
  )
}
