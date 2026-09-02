"use client"

import { useState } from "react"
import RotateCcwIcon from "lucide-react/dist/esm/icons/rotate-ccw"

import { Button } from "@/components/ui/button"

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
    <div>
      <div className="bg-muted/30 flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-6">
        <div>
          <p className="text-sm font-semibold">Campaign assumptions</p>
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
              setCopied(false)
              setAnnouncement("Example marketing plan loaded.")
            }}
          >
            Load example
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="min-h-11"
            onClick={handleReset}
          >
            <RotateCcwIcon className="size-4" aria-hidden />
            Reset
          </Button>
        </div>
      </div>

      <MarketingPlanFields
        draft={draft}
        updateDraft={updateDraft}
        updateChannelCadence={updateChannelCadence}
      />
      <MarketingPlanResults
        draft={draft}
        copied={copied}
        onCopy={handleCopy}
        onDownload={handleDownload}
      />
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  )
}
