"use client"

import { DEFAULT_LEGAL_PLAN } from "../../lib/legal-plan"
import { DocumentationDraftToolbar } from "../documentation-draft-toolbar"
import { DocumentationToolFlow } from "../documentation-tool-flow"

import { useState } from "react"

import { useLegalPlan } from "../../hooks/use-legal-plan"
import { buildLegalCsv, buildLegalReviewPrompt } from "../../lib/legal-plan"
import type { LegalPlanDraft } from "../../legal-types"
import { LegalMatterFields } from "./legal-matter-fields"
import { LegalOperationsFields } from "./legal-operations-fields"
import { LegalPlanResults } from "./legal-plan-results"

function downloadCsv(draft: LegalPlanDraft) {
  const file = new Blob([buildLegalCsv(draft)], {
    type: "text/csv;charset=utf-8",
  })
  const url = URL.createObjectURL(file)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = "nonprofit-legal-matter-referral-brief.csv"
  anchor.click()
  URL.revokeObjectURL(url)
}

export function LegalPlanBuilder() {
  const {
    draft,
    storageReady,
    storageStatus,
    updateDraft,
    loadExample,
    reset,
  } = useLegalPlan()
  const [announcement, setAnnouncement] = useState("")
  const [promptCopied, setPromptCopied] = useState(false)

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(buildLegalReviewPrompt(draft))
      setPromptCopied(true)
      setAnnouncement("Legal matter review prompt copied.")
    } catch {
      setPromptCopied(false)
      setAnnouncement("Legal matter review prompt could not be copied.")
    }
  }

  return (
    <fieldset disabled={!storageReady} className="min-w-0">
      <DocumentationDraftToolbar
        ready={storageReady}
        storageStatus={storageStatus}
        hasChanges={
          JSON.stringify(draft) !== JSON.stringify(DEFAULT_LEGAL_PLAN)
        }
        onLoadExample={() => {
          loadExample()
          setPromptCopied(false)
          setAnnouncement("Example legal matter brief loaded.")
        }}
        onReset={() => {
          if (!window.confirm("Reset this legal matter brief?")) return
          reset()
          setPromptCopied(false)
          setAnnouncement("Legal matter brief reset.")
        }}
      />
      <DocumentationToolFlow
        hasDraft={JSON.stringify(draft) !== JSON.stringify(DEFAULT_LEGAL_PLAN)}
        steps={[
          {
            id: "matter",
            label: "Your question",
            content: (
              <LegalMatterFields draft={draft} updateDraft={updateDraft} />
            ),
          },
          {
            id: "preparation",
            label: "Prepare for counsel",
            content: (
              <LegalOperationsFields draft={draft} updateDraft={updateDraft} />
            ),
          },
          {
            id: "review",
            label: "Review & export",
            content: (
              <LegalPlanResults
                draft={draft}
                promptCopied={promptCopied}
                onCopyPrompt={copyPrompt}
                onDownload={() => {
                  downloadCsv(draft)
                  setAnnouncement("Legal matter brief CSV downloaded.")
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
