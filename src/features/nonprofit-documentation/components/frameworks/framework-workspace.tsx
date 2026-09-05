"use client"

import { DEFAULT_LOGIC_MODEL_DRAFT } from "../../lib/framework-workspace"
import { DocumentationDraftToolbar } from "../documentation-draft-toolbar"
import { DocumentationToolFlow } from "../documentation-tool-flow"

import { useState } from "react"

import { useFrameworkWorkspace } from "../../hooks/use-framework-workspace"
import {
  buildLogicModelCsv,
  buildLogicModelReviewPrompt,
} from "../../lib/framework-workspace"
import type { LogicModelDraft } from "../../types"
import { FrameworkWorkspaceFields } from "./framework-workspace-fields"
import { FrameworkWorkspaceResults } from "./framework-workspace-results"

function downloadCsv(draft: LogicModelDraft) {
  const file = new Blob([buildLogicModelCsv(draft)], {
    type: "text/csv;charset=utf-8",
  })
  const url = URL.createObjectURL(file)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = "nonprofit-logic-model.csv"
  anchor.click()
  URL.revokeObjectURL(url)
}

export function FrameworkWorkspace() {
  const {
    draft,
    storageReady,
    storageStatus,
    updateDraft,
    loadExample,
    reset,
  } = useFrameworkWorkspace()
  const [announcement, setAnnouncement] = useState("")
  const [copied, setCopied] = useState(false)

  const handleReset = () => {
    if (!window.confirm("Reset this framework workspace?")) return
    reset()
    setCopied(false)
    setAnnouncement("Framework workspace reset.")
  }

  const handleDownload = () => {
    downloadCsv(draft)
    setAnnouncement("Logic model CSV downloaded.")
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildLogicModelReviewPrompt(draft))
      setCopied(true)
      setAnnouncement("Framework review prompt copied.")
    } catch {
      setCopied(false)
      setAnnouncement("Framework review prompt could not be copied.")
    }
  }

  return (
    <fieldset disabled={!storageReady} className="min-w-0">
      <DocumentationDraftToolbar
        ready={storageReady}
        storageStatus={storageStatus}
        hasChanges={
          JSON.stringify(draft) !== JSON.stringify(DEFAULT_LOGIC_MODEL_DRAFT)
        }
        onLoadExample={() => {
          loadExample()
          setCopied(false)
          setAnnouncement("Example logic model loaded.")
        }}
        onReset={handleReset}
      />

      <DocumentationToolFlow
        hasDraft={
          JSON.stringify(draft) !== JSON.stringify(DEFAULT_LOGIC_MODEL_DRAFT)
        }
        steps={[
          {
            id: "model",
            label: "Build the model",
            content: (
              <FrameworkWorkspaceFields
                draft={draft}
                updateDraft={updateDraft}
              />
            ),
          },
          {
            id: "review",
            label: "Review & export",
            content: (
              <FrameworkWorkspaceResults
                draft={draft}
                copied={copied}
                onCopy={handleCopy}
                onDownload={handleDownload}
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
