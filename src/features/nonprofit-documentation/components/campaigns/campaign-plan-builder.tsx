"use client"

import { DEFAULT_CAMPAIGN_PLAN } from "../../lib/campaign-plan"
import { DocumentationDraftToolbar } from "../documentation-draft-toolbar"
import { DocumentationToolFlow } from "../documentation-tool-flow"

import { useState } from "react"

import type { CampaignPlanDraft } from "../../campaign-types"
import { useCampaignPlan } from "../../hooks/use-campaign-plan"
import {
  buildCampaignCsv,
  buildCampaignReviewPrompt,
} from "../../lib/campaign-plan"
import { CampaignBriefFields } from "./campaign-brief-fields"
import { CampaignOperationsFields } from "./campaign-operations-fields"
import { CampaignPlanResults } from "./campaign-plan-results"
import { AdGrantsCampaignStarter } from "./ad-grants-campaign-starter"

function downloadCsv(draft: CampaignPlanDraft) {
  const file = new Blob([buildCampaignCsv(draft)], {
    type: "text/csv;charset=utf-8",
  })
  const url = URL.createObjectURL(file)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = "nonprofit-campaign-brief.csv"
  anchor.click()
  URL.revokeObjectURL(url)
}

export function CampaignPlanBuilder() {
  const {
    draft,
    storageReady,
    storageStatus,
    updateDraft,
    loadExample,
    loadDraft,
    reset,
  } = useCampaignPlan()
  const [announcement, setAnnouncement] = useState("")
  const [promptCopied, setPromptCopied] = useState(false)

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(buildCampaignReviewPrompt(draft))
      setPromptCopied(true)
      setAnnouncement("Campaign review prompt copied.")
    } catch {
      setPromptCopied(false)
      setAnnouncement("Campaign review prompt could not be copied.")
    }
  }

  return (
    <fieldset disabled={!storageReady} className="min-w-0">
      <DocumentationDraftToolbar
        ready={storageReady}
        storageStatus={storageStatus}
        hasChanges={
          JSON.stringify(draft) !== JSON.stringify(DEFAULT_CAMPAIGN_PLAN)
        }
        onLoadExample={() => {
          loadExample()
          setPromptCopied(false)
          setAnnouncement("Example campaign brief loaded.")
        }}
        onReset={() => {
          if (!window.confirm("Reset this campaign brief?")) return
          reset()
          setPromptCopied(false)
          setAnnouncement("Campaign brief reset.")
        }}
      />
      <AdGrantsCampaignStarter
        draft={draft}
        onLoad={(value) => {
          loadDraft(value)
          setPromptCopied(false)
          setAnnouncement(
            "Ad Grants starter loaded. Replace the bracketed prompts with your details."
          )
        }}
      />
      <DocumentationToolFlow
        hasDraft={
          JSON.stringify(draft) !== JSON.stringify(DEFAULT_CAMPAIGN_PLAN)
        }
        steps={[
          {
            id: "brief",
            label: "Audience & message",
            content: (
              <CampaignBriefFields draft={draft} updateDraft={updateDraft} />
            ),
          },
          {
            id: "delivery",
            label: "Delivery & measurement",
            content: (
              <CampaignOperationsFields
                draft={draft}
                updateDraft={updateDraft}
              />
            ),
          },
          {
            id: "review",
            label: "Review & export",
            content: (
              <CampaignPlanResults
                draft={draft}
                promptCopied={promptCopied}
                onCopyPrompt={copyPrompt}
                onDownload={() => {
                  downloadCsv(draft)
                  setAnnouncement("Campaign brief CSV downloaded.")
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
