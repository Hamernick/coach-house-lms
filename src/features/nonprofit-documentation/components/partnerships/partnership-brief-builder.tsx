"use client"

import { useState } from "react"
import RotateCcwIcon from "lucide-react/dist/esm/icons/rotate-ccw"

import { Button } from "@/components/ui/button"

import { usePartnershipBrief } from "../../hooks/use-partnership-brief"
import {
  buildPartnershipBriefCsv,
  buildPartnershipReviewPrompt,
} from "../../lib/partnership-brief"
import type { PartnershipBriefDraft } from "../../types"
import { PartnershipBriefFields } from "./partnership-brief-fields"
import { PartnershipBriefResults } from "./partnership-brief-results"

function downloadCsv(draft: PartnershipBriefDraft) {
  const file = new Blob([buildPartnershipBriefCsv(draft)], {
    type: "text/csv;charset=utf-8",
  })
  const url = URL.createObjectURL(file)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = "nonprofit-partnership-brief.csv"
  anchor.click()
  URL.revokeObjectURL(url)
}

export function PartnershipBriefBuilder() {
  const { draft, storageReady, updateDraft, loadExample, reset } =
    usePartnershipBrief()
  const [announcement, setAnnouncement] = useState("")
  const [copied, setCopied] = useState(false)

  const handleReset = () => {
    if (!window.confirm("Reset this partnership brief?")) return
    reset()
    setCopied(false)
    setAnnouncement("Partnership brief reset.")
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildPartnershipReviewPrompt(draft))
      setCopied(true)
      setAnnouncement("Partnership review prompt copied.")
    } catch {
      setCopied(false)
      setAnnouncement("Partnership review prompt could not be copied.")
    }
  }

  return (
    <div>
      <div className="bg-muted/30 flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-6">
        <div>
          <p className="text-sm font-semibold">Working partnership brief</p>
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
              setAnnouncement("Example partnership brief loaded.")
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

      <PartnershipBriefFields draft={draft} updateDraft={updateDraft} />
      <PartnershipBriefResults
        draft={draft}
        copied={copied}
        onCopy={handleCopy}
        onDownload={() => {
          downloadCsv(draft)
          setAnnouncement("Partnership brief CSV downloaded.")
        }}
      />
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  )
}
