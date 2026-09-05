"use client"

import { DEFAULT_SUSTAINABILITY_PLAN } from "../../lib/sustainability-plan"
import { DocumentationDraftToolbar } from "../documentation-draft-toolbar"
import { DocumentationToolFlow } from "../documentation-tool-flow"

import { useState } from "react"

import { useSustainabilityPlan } from "../../hooks/use-sustainability-plan"
import {
  buildSustainabilityCsv,
  buildSustainabilityReviewPrompt,
} from "../../lib/sustainability-plan"
import type { SustainabilityPlanDraft } from "../../types"
import { SustainabilityPlanFields } from "./sustainability-plan-fields"
import { SustainabilityPlanResults } from "./sustainability-plan-results"

function downloadCsv(draft: SustainabilityPlanDraft) {
  const file = new Blob([buildSustainabilityCsv(draft)], {
    type: "text/csv;charset=utf-8",
  })
  const url = URL.createObjectURL(file)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = "nonprofit-sustainability-scenario.csv"
  anchor.click()
  URL.revokeObjectURL(url)
}

export function SustainabilityPlanBuilder() {
  const {
    draft,
    storageReady,
    storageStatus,
    updateDraft,
    loadExample,
    reset,
  } = useSustainabilityPlan()
  const [announcement, setAnnouncement] = useState("")
  const [copied, setCopied] = useState(false)

  const handleReset = () => {
    if (!window.confirm("Reset this sustainability scenario?")) return
    reset()
    setCopied(false)
    setAnnouncement("Sustainability scenario reset.")
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        buildSustainabilityReviewPrompt(draft)
      )
      setCopied(true)
      setAnnouncement("Sustainability review prompt copied.")
    } catch {
      setCopied(false)
      setAnnouncement("Sustainability review prompt could not be copied.")
    }
  }

  return (
    <fieldset disabled={!storageReady} className="min-w-0">
      <DocumentationDraftToolbar
        ready={storageReady}
        storageStatus={storageStatus}
        hasChanges={
          JSON.stringify(draft) !== JSON.stringify(DEFAULT_SUSTAINABILITY_PLAN)
        }
        onLoadExample={() => {
          loadExample()
          setCopied(false)
          setAnnouncement("Example sustainability scenario loaded.")
        }}
        onReset={handleReset}
      />

      <DocumentationToolFlow
        hasDraft={
          JSON.stringify(draft) !== JSON.stringify(DEFAULT_SUSTAINABILITY_PLAN)
        }
        steps={[
          {
            id: "scenario",
            label: "Your scenario",
            content: (
              <SustainabilityPlanFields
                draft={draft}
                updateDraft={updateDraft}
              />
            ),
          },
          {
            id: "review",
            label: "Review & export",
            content: (
              <SustainabilityPlanResults
                draft={draft}
                copied={copied}
                onCopy={handleCopy}
                onDownload={() => {
                  downloadCsv(draft)
                  setAnnouncement("Sustainability scenario CSV downloaded.")
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
