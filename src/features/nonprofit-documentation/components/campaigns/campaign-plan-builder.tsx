"use client"

import { useState } from "react"
import RotateCcwIcon from "lucide-react/dist/esm/icons/rotate-ccw"

import { Button } from "@/components/ui/button"

import type { CampaignPlanDraft } from "../../campaign-types"
import { useCampaignPlan } from "../../hooks/use-campaign-plan"
import {
  buildCampaignCsv,
  buildCampaignReviewPrompt,
} from "../../lib/campaign-plan"
import { CampaignBriefFields } from "./campaign-brief-fields"
import { CampaignOperationsFields } from "./campaign-operations-fields"
import { CampaignPlanResults } from "./campaign-plan-results"

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
  const { draft, storageReady, updateDraft, loadExample, reset } =
    useCampaignPlan()
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
    <div>
      <div className="bg-muted/30 flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-6">
        <div>
          <p className="text-sm font-semibold">Working campaign brief</p>
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
              setAnnouncement("Example campaign brief loaded.")
            }}
          >
            Load example
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="min-h-11"
            onClick={() => {
              if (!window.confirm("Reset this campaign brief?")) return
              reset()
              setPromptCopied(false)
              setAnnouncement("Campaign brief reset.")
            }}
          >
            <RotateCcwIcon className="size-4" aria-hidden /> Reset
          </Button>
        </div>
      </div>
      <CampaignBriefFields draft={draft} updateDraft={updateDraft} />
      <CampaignOperationsFields draft={draft} updateDraft={updateDraft} />
      <CampaignPlanResults
        draft={draft}
        promptCopied={promptCopied}
        onCopyPrompt={copyPrompt}
        onDownload={() => {
          downloadCsv(draft)
          setAnnouncement("Campaign brief CSV downloaded.")
        }}
      />
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  )
}
