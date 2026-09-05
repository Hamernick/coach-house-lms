"use client"

import { useState } from "react"
import RotateCcwIcon from "lucide-react/dist/esm/icons/rotate-ccw"

import { Button } from "@/components/ui/button"

import type { CrmPlanDraft } from "../../crm-types"
import { useCrmPlan } from "../../hooks/use-crm-plan"
import { buildCrmCsv, buildCrmReviewPrompt } from "../../lib/crm-plan"
import { CrmFieldDictionary } from "./crm-field-dictionary"
import { CrmGovernanceFields } from "./crm-governance-fields"
import { CrmPlanFields } from "./crm-plan-fields"
import { CrmPlanResults } from "./crm-plan-results"

function downloadCsv(draft: CrmPlanDraft) {
  const file = new Blob([buildCrmCsv(draft)], {
    type: "text/csv;charset=utf-8",
  })
  const url = URL.createObjectURL(file)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = "nonprofit-crm-data-stewardship-plan.csv"
  anchor.click()
  URL.revokeObjectURL(url)
}

export function CrmPlanBuilder() {
  const {
    draft,
    storageReady,
    updateDraft,
    updateField,
    addField,
    removeField,
    loadExample,
    reset,
  } = useCrmPlan()
  const [announcement, setAnnouncement] = useState("")
  const [promptCopied, setPromptCopied] = useState(false)

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(buildCrmReviewPrompt(draft))
      setPromptCopied(true)
      setAnnouncement("CRM review prompt copied.")
    } catch {
      setPromptCopied(false)
      setAnnouncement("CRM review prompt could not be copied.")
    }
  }

  return (
    <fieldset disabled={!storageReady} className="min-w-0">
      <div className="bg-muted/30 flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-6">
        <div>
          <p className="text-sm font-semibold">Working CRM plan</p>
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
              setAnnouncement("Example CRM plan loaded.")
            }}
          >
            Load example
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="min-h-11"
            onClick={() => {
              if (!window.confirm("Reset this CRM plan?")) return
              reset()
              setPromptCopied(false)
              setAnnouncement("CRM plan reset.")
            }}
          >
            <RotateCcwIcon data-icon="inline-start" aria-hidden />
            Reset
          </Button>
        </div>
      </div>
      <CrmPlanFields draft={draft} updateDraft={updateDraft} />
      <CrmGovernanceFields draft={draft} updateDraft={updateDraft} />
      <CrmFieldDictionary
        draft={draft}
        updateField={updateField}
        addField={addField}
        removeField={removeField}
      />
      <CrmPlanResults
        draft={draft}
        promptCopied={promptCopied}
        onCopyPrompt={copyPrompt}
        onDownload={() => {
          downloadCsv(draft)
          setAnnouncement("CRM plan CSV downloaded.")
        }}
      />
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </fieldset>
  )
}
