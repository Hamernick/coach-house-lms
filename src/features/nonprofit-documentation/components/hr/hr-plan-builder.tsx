"use client"

import { useState } from "react"
import RotateCcwIcon from "lucide-react/dist/esm/icons/rotate-ccw"

import { Button } from "@/components/ui/button"

import { useHrPlan } from "../../hooks/use-hr-plan"
import { buildHrCsv, buildHrReviewPrompt } from "../../lib/hr-plan"
import type { HrPlanDraft } from "../../hr-types"
import { HrOperationsFields } from "./hr-operations-fields"
import { HrPlanFields } from "./hr-plan-fields"
import { HrPlanResults } from "./hr-plan-results"

function downloadCsv(draft: HrPlanDraft) {
  const file = new Blob([buildHrCsv(draft)], {
    type: "text/csv;charset=utf-8",
  })
  const url = URL.createObjectURL(file)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = "nonprofit-role-people-practices-brief.csv"
  anchor.click()
  URL.revokeObjectURL(url)
}

export function HrPlanBuilder() {
  const { draft, storageReady, updateDraft, loadExample, reset } = useHrPlan()
  const [announcement, setAnnouncement] = useState("")
  const [promptCopied, setPromptCopied] = useState(false)

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(buildHrReviewPrompt(draft))
      setPromptCopied(true)
      setAnnouncement("Role review prompt copied.")
    } catch {
      setPromptCopied(false)
      setAnnouncement("Role review prompt could not be copied.")
    }
  }

  return (
    <div>
      <div className="bg-muted/30 flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-6">
        <div>
          <p className="text-sm font-semibold">
            Working role and people-practices brief
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
              setPromptCopied(false)
              setAnnouncement("Example role brief loaded.")
            }}
          >
            Load example
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="min-h-11"
            onClick={() => {
              if (!window.confirm("Reset this role brief?")) return
              reset()
              setPromptCopied(false)
              setAnnouncement("Role brief reset.")
            }}
          >
            <RotateCcwIcon className="size-4" aria-hidden /> Reset
          </Button>
        </div>
      </div>
      <HrPlanFields draft={draft} updateDraft={updateDraft} />
      <HrOperationsFields draft={draft} updateDraft={updateDraft} />
      <HrPlanResults
        draft={draft}
        promptCopied={promptCopied}
        onCopyPrompt={copyPrompt}
        onDownload={() => {
          downloadCsv(draft)
          setAnnouncement("Role brief CSV downloaded.")
        }}
      />
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  )
}
