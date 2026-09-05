"use client"

import { DEFAULT_MARKETING_PLAN } from "../../lib/marketing-plan"
import { DocumentationDraftToolbar } from "../documentation-draft-toolbar"
import { DocumentationToolFlow } from "../documentation-tool-flow"

import { useState } from "react"

import { useMarketingPlan } from "../../hooks/use-marketing-plan"
import {
  buildMarketingAiPrompt,
  buildMarketingCsv,
} from "../../lib/marketing-plan"
import type { MarketingPlanDraft } from "../../types"
import { MarketingPlanFields } from "./marketing-plan-fields"
import { MarketingPlanResults } from "./marketing-plan-results"

function downloadCsv(draft: MarketingPlanDraft) {
  const file = new Blob([buildMarketingCsv(draft)], {
    type: "text/csv;charset=utf-8",
  })
  const url = URL.createObjectURL(file)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = "nonprofit-marketing-plan.csv"
  anchor.click()
  URL.revokeObjectURL(url)
}

export function MarketingPlanBuilder() {
  const {
    draft,
    storageReady,
    storageStatus,
    updateDraft,
    updateChannelCadence,
    loadExample,
    reset,
  } = useMarketingPlan()
  const [announcement, setAnnouncement] = useState("")
  const [copied, setCopied] = useState(false)

  const handleReset = () => {
    if (!window.confirm("Reset this marketing planning draft?")) return
    reset()
    setCopied(false)
    setAnnouncement("Marketing planning draft reset.")
  }

  const handleDownload = () => {
    downloadCsv(draft)
    setAnnouncement("Marketing plan CSV downloaded.")
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildMarketingAiPrompt(draft))
      setCopied(true)
      setAnnouncement("AI handoff copied.")
    } catch {
      setCopied(false)
      setAnnouncement("AI handoff could not be copied.")
    }
  }

  return (
    <fieldset disabled={!storageReady} className="min-w-0">
      <DocumentationDraftToolbar
        ready={storageReady}
        storageStatus={storageStatus}
        hasChanges={
          JSON.stringify(draft) !== JSON.stringify(DEFAULT_MARKETING_PLAN)
        }
        onLoadExample={() => {
          loadExample()
          setCopied(false)
          setAnnouncement("Example marketing plan loaded.")
        }}
        onReset={handleReset}
      />

      <DocumentationToolFlow
        hasDraft={
          JSON.stringify(draft) !== JSON.stringify(DEFAULT_MARKETING_PLAN)
        }
        steps={[
          {
            id: "audience",
            label: "Audience & message",
            content: (
              <MarketingPlanFields
                part="audience"
                draft={draft}
                updateDraft={updateDraft}
                updateChannelCadence={updateChannelCadence}
              />
            ),
          },
          {
            id: "channels",
            label: "Channels & review",
            content: (
              <MarketingPlanFields
                part="channels"
                draft={draft}
                updateDraft={updateDraft}
                updateChannelCadence={updateChannelCadence}
              />
            ),
          },
          {
            id: "review",
            label: "Review & export",
            content: (
              <MarketingPlanResults
                draft={draft}
                copied={copied}
                onCopy={handleCopy}
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
