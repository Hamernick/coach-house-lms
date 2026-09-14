"use client"

import { useState } from "react"
import RotateCcwIcon from "lucide-react/dist/esm/icons/rotate-ccw"

import { Button } from "@/components/ui/button"

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
    <div>
      <div className="bg-muted/30 flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-6">
        <div>
          <p className="text-sm font-semibold">Planning assumptions</p>
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
              setAnnouncement("Example fundraising plan loaded.")
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

      <FundraisingPlanFields
        draft={draft}
        updateDraft={updateDraft}
        updateChannelTarget={updateChannelTarget}
      />
      <FundraisingPlanResults draft={draft} onDownload={handleDownload} />
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  )
}
