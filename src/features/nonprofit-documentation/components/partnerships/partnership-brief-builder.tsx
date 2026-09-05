"use client"

import { DEFAULT_PARTNERSHIP_BRIEF } from "../../lib/partnership-brief"
import { DocumentationDraftToolbar } from "../documentation-draft-toolbar"
import { DocumentationToolFlow } from "../documentation-tool-flow"

import { useState } from "react"

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
  const {
    draft,
    storageReady,
    storageStatus,
    updateDraft,
    loadExample,
    reset,
  } = usePartnershipBrief()
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
    <fieldset disabled={!storageReady} className="min-w-0">
      <DocumentationDraftToolbar
        ready={storageReady}
        storageStatus={storageStatus}
        hasChanges={
          JSON.stringify(draft) !== JSON.stringify(DEFAULT_PARTNERSHIP_BRIEF)
        }
        onLoadExample={() => {
          loadExample()
          setCopied(false)
          setAnnouncement("Example partnership brief loaded.")
        }}
        onReset={handleReset}
      />

      <DocumentationToolFlow
        hasDraft={
          JSON.stringify(draft) !== JSON.stringify(DEFAULT_PARTNERSHIP_BRIEF)
        }
        steps={[
          {
            id: "agreement",
            label: "Shared agreement",
            content: (
              <PartnershipBriefFields draft={draft} updateDraft={updateDraft} />
            ),
          },
          {
            id: "review",
            label: "Review & export",
            content: (
              <PartnershipBriefResults
                draft={draft}
                copied={copied}
                onCopy={handleCopy}
                onDownload={() => {
                  downloadCsv(draft)
                  setAnnouncement("Partnership brief CSV downloaded.")
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
