"use client"

import { useState } from "react"
import RotateCcwIcon from "lucide-react/dist/esm/icons/rotate-ccw"

import { Button } from "@/components/ui/button"

import { useLegalPlan } from "../../hooks/use-legal-plan"
import { buildLegalCsv, buildLegalReviewPrompt } from "../../lib/legal-plan"
import type { LegalPlanDraft } from "../../legal-types"
import { LegalMatterFields } from "./legal-matter-fields"
import { LegalOperationsFields } from "./legal-operations-fields"
import { LegalPlanResults } from "./legal-plan-results"

function downloadCsv(draft: LegalPlanDraft) {
  const file = new Blob([buildLegalCsv(draft)], {
    type: "text/csv;charset=utf-8",
  })
  const url = URL.createObjectURL(file)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = "nonprofit-legal-matter-referral-brief.csv"
  anchor.click()
  URL.revokeObjectURL(url)
}

export function LegalPlanBuilder() {
  const { draft, storageReady, updateDraft, loadExample, reset } =
    useLegalPlan()
  const [announcement, setAnnouncement] = useState("")
  const [promptCopied, setPromptCopied] = useState(false)

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(buildLegalReviewPrompt(draft))
      setPromptCopied(true)
      setAnnouncement("Legal matter review prompt copied.")
    } catch {
      setPromptCopied(false)
      setAnnouncement("Legal matter review prompt could not be copied.")
    }
  }

  return (
    <fieldset disabled={!storageReady} className="min-w-0">
      <div className="bg-muted/30 flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-6">
        <div>
          <p className="text-sm font-semibold">
            Working legal matter and referral brief
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
              setAnnouncement("Example legal matter brief loaded.")
            }}
          >
            Load example
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="min-h-11"
            onClick={() => {
              if (!window.confirm("Reset this legal matter brief?")) return
              reset()
              setPromptCopied(false)
              setAnnouncement("Legal matter brief reset.")
            }}
          >
            <RotateCcwIcon className="size-4" aria-hidden /> Reset
          </Button>
        </div>
      </div>
      <LegalMatterFields draft={draft} updateDraft={updateDraft} />
      <LegalOperationsFields draft={draft} updateDraft={updateDraft} />
      <LegalPlanResults
        draft={draft}
        promptCopied={promptCopied}
        onCopyPrompt={copyPrompt}
        onDownload={() => {
          downloadCsv(draft)
          setAnnouncement("Legal matter brief CSV downloaded.")
        }}
      />
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </fieldset>
  )
}
