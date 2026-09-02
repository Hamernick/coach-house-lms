"use client"

import { useState } from "react"
import RotateCcwIcon from "lucide-react/dist/esm/icons/rotate-ccw"

import { Button } from "@/components/ui/button"

import { useNetworkingPlan } from "../../hooks/use-networking-plan"
import {
  buildNetworkingCsv,
  buildNetworkingReviewPrompt,
} from "../../lib/networking-plan"
import type { NetworkingPlanDraft } from "../../types"
import { NetworkingPlanFields } from "./networking-plan-fields"
import { NetworkingPlanResults } from "./networking-plan-results"
import { NetworkingRelationshipFields } from "./networking-relationship-fields"

function downloadCsv(draft: NetworkingPlanDraft) {
  const file = new Blob([buildNetworkingCsv(draft)], {
    type: "text/csv;charset=utf-8",
  })
  const url = URL.createObjectURL(file)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = "nonprofit-relationship-map.csv"
  anchor.click()
  URL.revokeObjectURL(url)
}

export function NetworkingPlanBuilder() {
  const {
    draft,
    storageReady,
    updateDraft,
    updateRelationship,
    addRelationship,
    removeRelationship,
    loadExample,
    reset,
  } = useNetworkingPlan()
  const [announcement, setAnnouncement] = useState("")
  const [promptCopied, setPromptCopied] = useState(false)

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(buildNetworkingReviewPrompt(draft))
      setPromptCopied(true)
      setAnnouncement("Relationship-map review prompt copied.")
    } catch {
      setPromptCopied(false)
      setAnnouncement("Relationship-map review prompt could not be copied.")
    }
  }

  return (
    <div>
      <div className="bg-muted/30 flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-6">
        <div>
          <p className="text-sm font-semibold">Working relationship map</p>
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
              setAnnouncement("Example relationship map loaded.")
            }}
          >
            Load example
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="min-h-11"
            onClick={() => {
              if (!window.confirm("Reset this relationship map?")) return
              reset()
              setPromptCopied(false)
              setAnnouncement("Relationship map reset.")
            }}
          >
            <RotateCcwIcon className="size-4" aria-hidden /> Reset
          </Button>
        </div>
      </div>

      <NetworkingPlanFields draft={draft} updateDraft={updateDraft} />
      <NetworkingRelationshipFields
        relationships={draft.relationships}
        updateRelationship={updateRelationship}
        addRelationship={addRelationship}
        removeRelationship={removeRelationship}
      />
      <NetworkingPlanResults
        draft={draft}
        promptCopied={promptCopied}
        onCopyPrompt={copyPrompt}
        onDownload={() => {
          downloadCsv(draft)
          setAnnouncement("Relationship map CSV downloaded.")
        }}
      />
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  )
}
