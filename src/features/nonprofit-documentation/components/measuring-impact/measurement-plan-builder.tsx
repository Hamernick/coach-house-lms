"use client"

import { DEFAULT_MEASUREMENT_PLAN } from "../../lib/measurement-plan"
import { DocumentationDraftToolbar } from "../documentation-draft-toolbar"
import { DocumentationToolFlow } from "../documentation-tool-flow"

import { useState } from "react"

import { useMeasurementPlan } from "../../hooks/use-measurement-plan"
import {
  buildMeasurementPlanCsv,
  buildMeasurementReviewPrompt,
} from "../../lib/measurement-plan"
import type { MeasurementPlanDraft } from "../../types"
import { MeasurementPlanFields } from "./measurement-plan-fields"
import { MeasurementPlanResults } from "./measurement-plan-results"

function downloadCsv(draft: MeasurementPlanDraft) {
  const file = new Blob([buildMeasurementPlanCsv(draft)], {
    type: "text/csv;charset=utf-8",
  })
  const url = URL.createObjectURL(file)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = "nonprofit-measurement-plan.csv"
  anchor.click()
  URL.revokeObjectURL(url)
}

export function MeasurementPlanBuilder() {
  const {
    draft,
    storageReady,
    storageStatus,
    updateDraft,
    loadExample,
    reset,
  } = useMeasurementPlan()
  const [announcement, setAnnouncement] = useState("")
  const [copied, setCopied] = useState(false)

  const handleReset = () => {
    if (!window.confirm("Reset this measurement plan?")) return
    reset()
    setCopied(false)
    setAnnouncement("Measurement plan reset.")
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildMeasurementReviewPrompt(draft))
      setCopied(true)
      setAnnouncement("Measurement review prompt copied.")
    } catch {
      setCopied(false)
      setAnnouncement("Measurement review prompt could not be copied.")
    }
  }

  return (
    <fieldset disabled={!storageReady} className="min-w-0">
      <DocumentationDraftToolbar
        ready={storageReady}
        storageStatus={storageStatus}
        hasChanges={
          JSON.stringify(draft) !== JSON.stringify(DEFAULT_MEASUREMENT_PLAN)
        }
        onLoadExample={() => {
          loadExample()
          setCopied(false)
          setAnnouncement("Example measurement plan loaded.")
        }}
        onReset={handleReset}
      />

      <DocumentationToolFlow
        ready={storageReady}
        draftFingerprint={JSON.stringify(draft)}
        hasDraft={
          JSON.stringify(draft) !== JSON.stringify(DEFAULT_MEASUREMENT_PLAN)
        }
        steps={[
          {
            id: "evidence",
            label: "Plan the evidence",
            content: (
              <MeasurementPlanFields draft={draft} updateDraft={updateDraft} />
            ),
          },
          {
            id: "review",
            label: "Review & export",
            content: (
              <MeasurementPlanResults
                draft={draft}
                copied={copied}
                onCopy={handleCopy}
                onDownload={() => {
                  downloadCsv(draft)
                  setAnnouncement("Measurement plan CSV downloaded.")
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
