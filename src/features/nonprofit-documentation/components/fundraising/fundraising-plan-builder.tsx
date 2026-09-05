"use client"

import { DEFAULT_FUNDRAISING_PLAN } from "../../lib/fundraising-plan"
import { DocumentationDraftToolbar } from "../documentation-draft-toolbar"
import { DocumentationToolFlow } from "../documentation-tool-flow"

import { useState } from "react"

import { useFundraisingPlan } from "../../hooks/use-fundraising-plan"
import { buildFundraisingCsv } from "../../lib/fundraising-plan"
import type { FundraisingPlanDraft } from "../../types"
import { FundraisingPlanFields } from "./fundraising-plan-fields"
import { FundraisingPlanResults } from "./fundraising-plan-results"

function downloadCsv(draft: FundraisingPlanDraft) {
  const file = new Blob([buildFundraisingCsv(draft)], {
    type: "text/csv;charset=utf-8",
  })
  const url = URL.createObjectURL(file)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = "nonprofit-fundraising-plan.csv"
  anchor.click()
  URL.revokeObjectURL(url)
}

export function FundraisingPlanBuilder() {
  const {
    draft,
    storageReady,
    storageStatus,
    updateDraft,
    updateChannelTarget,
    loadExample,
    reset,
  } = useFundraisingPlan()
  const [announcement, setAnnouncement] = useState("")

  const handleReset = () => {
    if (!window.confirm("Reset this fundraising planning draft?")) return
    reset()
    setAnnouncement("Fundraising planning draft reset.")
  }

  const handleDownload = () => {
    downloadCsv(draft)
    setAnnouncement("Fundraising plan CSV downloaded.")
  }

  return (
    <fieldset disabled={!storageReady} className="min-w-0">
      <DocumentationDraftToolbar
        ready={storageReady}
        storageStatus={storageStatus}
        hasChanges={
          JSON.stringify(draft) !== JSON.stringify(DEFAULT_FUNDRAISING_PLAN)
        }
        onLoadExample={() => {
          loadExample()
          setAnnouncement("Example fundraising plan loaded.")
        }}
        onReset={handleReset}
      />

      <DocumentationToolFlow
        hasDraft={
          JSON.stringify(draft) !== JSON.stringify(DEFAULT_FUNDRAISING_PLAN)
        }
        steps={[
          {
            id: "need",
            label: "Funding need",
            content: (
              <FundraisingPlanFields
                part="need"
                draft={draft}
                updateDraft={updateDraft}
                updateChannelTarget={updateChannelTarget}
              />
            ),
          },
          {
            id: "channels",
            label: "Channel mix",
            content: (
              <FundraisingPlanFields
                part="channels"
                draft={draft}
                updateDraft={updateDraft}
                updateChannelTarget={updateChannelTarget}
              />
            ),
          },
          {
            id: "review",
            label: "Review & export",
            content: (
              <FundraisingPlanResults
                draft={draft}
                onDownload={handleDownload}
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
