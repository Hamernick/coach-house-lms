"use client"

import { DEFAULT_CRM_PLAN } from "../../lib/crm-plan"
import { DocumentationDraftToolbar } from "../documentation-draft-toolbar"
import { DocumentationToolFlow } from "../documentation-tool-flow"

import { useState } from "react"

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
    storageStatus,
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
      <DocumentationDraftToolbar
        ready={storageReady}
        storageStatus={storageStatus}
        hasChanges={JSON.stringify(draft) !== JSON.stringify(DEFAULT_CRM_PLAN)}
        onLoadExample={() => {
          loadExample()
          setPromptCopied(false)
          setAnnouncement("Example CRM plan loaded.")
        }}
        onReset={() => {
          if (!window.confirm("Reset this CRM plan?")) return
          reset()
          setPromptCopied(false)
          setAnnouncement("CRM plan reset.")
        }}
      />
      <DocumentationToolFlow
        hasDraft={JSON.stringify(draft) !== JSON.stringify(DEFAULT_CRM_PLAN)}
        steps={[
          {
            id: "purpose",
            label: "Purpose",
            content: <CrmPlanFields draft={draft} updateDraft={updateDraft} />,
          },
          {
            id: "stewardship",
            label: "Access & care",
            content: (
              <CrmGovernanceFields draft={draft} updateDraft={updateDraft} />
            ),
          },
          {
            id: "fields",
            label: "Field dictionary",
            content: (
              <CrmFieldDictionary
                draft={draft}
                updateField={updateField}
                addField={addField}
                removeField={removeField}
              />
            ),
          },
          {
            id: "review",
            label: "Review & export",
            content: (
              <CrmPlanResults
                draft={draft}
                promptCopied={promptCopied}
                onCopyPrompt={copyPrompt}
                onDownload={() => {
                  downloadCsv(draft)
                  setAnnouncement("CRM plan CSV downloaded.")
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
