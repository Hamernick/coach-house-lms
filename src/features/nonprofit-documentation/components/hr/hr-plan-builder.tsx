"use client"

import { DEFAULT_HR_PLAN } from "../../lib/hr-plan"
import { DocumentationDraftToolbar } from "../documentation-draft-toolbar"
import { DocumentationToolFlow } from "../documentation-tool-flow"

import { useState } from "react"

import { useHrPlan } from "../../hooks/use-hr-plan"
import { buildHrCsv, buildHrReviewPrompt } from "../../lib/hr-plan"
import type { HrPlanDraft } from "../../hr-types"
import { HrOperationsFields } from "./hr-operations-fields"
import { HrPlanFields } from "./hr-plan-fields"
import { HrPlanResults } from "./hr-plan-results"

function downloadCsv(draft: HrPlanDraft) {
  const file = new Blob([buildHrCsv(draft)], {
    type: "text/csv;charset=utf-8",
  })
  const url = URL.createObjectURL(file)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = "nonprofit-role-people-practices-brief.csv"
  anchor.click()
  URL.revokeObjectURL(url)
}

export function HrPlanBuilder() {
  const {
    draft,
    storageReady,
    storageStatus,
    updateDraft,
    loadExample,
    reset,
  } = useHrPlan()
  const [announcement, setAnnouncement] = useState("")
  const [promptCopied, setPromptCopied] = useState(false)

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(buildHrReviewPrompt(draft))
      setPromptCopied(true)
      setAnnouncement("Role review prompt copied.")
    } catch {
      setPromptCopied(false)
      setAnnouncement("Role review prompt could not be copied.")
    }
  }

  return (
    <fieldset disabled={!storageReady} className="min-w-0">
      <DocumentationDraftToolbar
        ready={storageReady}
        storageStatus={storageStatus}
        hasChanges={JSON.stringify(draft) !== JSON.stringify(DEFAULT_HR_PLAN)}
        onLoadExample={() => {
          loadExample()
          setPromptCopied(false)
          setAnnouncement("Example role brief loaded.")
        }}
        onReset={() => {
          if (!window.confirm("Reset this role brief?")) return
          reset()
          setPromptCopied(false)
          setAnnouncement("Role brief reset.")
        }}
      />
      <DocumentationToolFlow
        ready={storageReady}
        draftFingerprint={JSON.stringify(draft)}
        hasDraft={JSON.stringify(draft) !== JSON.stringify(DEFAULT_HR_PLAN)}
        steps={[
          {
            id: "role",
            label: "Define the role",
            content: <HrPlanFields draft={draft} updateDraft={updateDraft} />,
          },
          {
            id: "support",
            label: "Cost & support",
            content: (
              <HrOperationsFields draft={draft} updateDraft={updateDraft} />
            ),
          },
          {
            id: "review",
            label: "Review & export",
            content: (
              <HrPlanResults
                draft={draft}
                promptCopied={promptCopied}
                onCopyPrompt={copyPrompt}
                onDownload={() => {
                  downloadCsv(draft)
                  setAnnouncement("Role brief CSV downloaded.")
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
