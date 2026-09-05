"use client"

import { DEFAULT_FINANCE_PLAN } from "../../lib/finance-plan"
import { DocumentationDraftToolbar } from "../documentation-draft-toolbar"
import { DocumentationToolFlow } from "../documentation-tool-flow"

import { useState } from "react"

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
  const {
    draft,
    storageReady,
    storageStatus,
    updateDraft,
    loadExample,
    reset,
  } = useFinancePlan()
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
      <DocumentationDraftToolbar
        ready={storageReady}
        storageStatus={storageStatus}
        hasChanges={
          JSON.stringify(draft) !== JSON.stringify(DEFAULT_FINANCE_PLAN)
        }
        onLoadExample={() => {
          loadExample()
          setPromptCopied(false)
          setAnnouncement("Example finance plan loaded.")
        }}
        onReset={() => {
          if (!window.confirm("Reset this finance plan?")) return
          reset()
          setPromptCopied(false)
          setAnnouncement("Finance plan reset.")
        }}
      />
      <DocumentationToolFlow
        hasDraft={
          JSON.stringify(draft) !== JSON.stringify(DEFAULT_FINANCE_PLAN)
        }
        steps={[
          {
            id: "budget",
            label: "Budget & cash",
            content: (
              <FinancePlanFields draft={draft} updateDraft={updateDraft} />
            ),
          },
          {
            id: "controls",
            label: "Review & controls",
            content: (
              <FinanceOperationsFields
                draft={draft}
                updateDraft={updateDraft}
              />
            ),
          },
          {
            id: "review",
            label: "Review & export",
            content: (
              <FinancePlanResults
                draft={draft}
                promptCopied={promptCopied}
                onCopyPrompt={copyPrompt}
                onDownload={() => {
                  downloadCsv(draft)
                  setAnnouncement("Finance plan CSV downloaded.")
                }}
              />
            ),
          },
        ]}
      />
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </fieldset>
  )
}
