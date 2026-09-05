"use client"

import { DEFAULT_NETWORKING_PLAN } from "../../lib/networking-plan"
import { DocumentationDraftToolbar } from "../documentation-draft-toolbar"
import { DocumentationToolFlow } from "../documentation-tool-flow"

import { useState } from "react"

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
    storageStatus,
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
    <fieldset disabled={!storageReady} className="min-w-0">
      <DocumentationDraftToolbar
        ready={storageReady}
        storageStatus={storageStatus}
        hasChanges={
          JSON.stringify(draft) !== JSON.stringify(DEFAULT_NETWORKING_PLAN)
        }
        onLoadExample={() => {
          loadExample()
          setPromptCopied(false)
          setAnnouncement("Example relationship map loaded.")
        }}
        onReset={() => {
          if (!window.confirm("Reset this relationship map?")) return
          reset()
          setPromptCopied(false)
          setAnnouncement("Relationship map reset.")
        }}
      />

      <DocumentationToolFlow
        hasDraft={
          JSON.stringify(draft) !== JSON.stringify(DEFAULT_NETWORKING_PLAN)
        }
        steps={[
          {
            id: "purpose",
            label: "Purpose",
            content: (
              <NetworkingPlanFields draft={draft} updateDraft={updateDraft} />
            ),
          },
          {
            id: "relationships",
            label: "Relationships",
            content: (
              <NetworkingRelationshipFields
                relationships={draft.relationships}
                updateRelationship={updateRelationship}
                addRelationship={addRelationship}
                removeRelationship={removeRelationship}
              />
            ),
          },
          {
            id: "review",
            label: "Review & export",
            content: (
              <NetworkingPlanResults
                draft={draft}
                promptCopied={promptCopied}
                onCopyPrompt={copyPrompt}
                onDownload={() => {
                  downloadCsv(draft)
                  setAnnouncement("Relationship map CSV downloaded.")
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
