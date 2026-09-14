"use client"

import { useState } from "react"
import RotateCcwIcon from "lucide-react/dist/esm/icons/rotate-ccw"

import { Button } from "@/components/ui/button"

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
  const { draft, storageReady, updateDraft, loadExample, reset } =
    useMeasurementPlan()
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
    <div>
      <div className="bg-muted/30 flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-6">
        <div>
          <p className="text-sm font-semibold">Working measurement plan</p>
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
              setAnnouncement("Example measurement plan loaded.")
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

      <MeasurementPlanFields draft={draft} updateDraft={updateDraft} />
      <MeasurementPlanResults
        draft={draft}
        copied={copied}
        onCopy={handleCopy}
        onDownload={() => {
          downloadCsv(draft)
          setAnnouncement("Measurement plan CSV downloaded.")
        }}
      />
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  )
}
