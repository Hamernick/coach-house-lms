"use client"

import { useState } from "react"
import RotateCcwIcon from "lucide-react/dist/esm/icons/rotate-ccw"

import { Button } from "@/components/ui/button"

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
  const { draft, storageReady, updateDraft, loadExample, reset } =
    useSustainabilityPlan()
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
    <div>
      <div className="bg-muted/30 flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-6">
        <div>
          <p className="text-sm font-semibold">
            Working sustainability scenario
          </p>
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
              setAnnouncement("Example sustainability scenario loaded.")
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
            <RotateCcwIcon className="size-4" aria-hidden /> Reset
          </Button>
        </div>
      </div>

      <SustainabilityPlanFields draft={draft} updateDraft={updateDraft} />
      <SustainabilityPlanResults
        draft={draft}
        copied={copied}
        onCopy={handleCopy}
        onDownload={() => {
          downloadCsv(draft)
          setAnnouncement("Sustainability scenario CSV downloaded.")
        }}
      />
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  )
}
