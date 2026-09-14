"use client"

import { useState } from "react"
import RotateCcwIcon from "lucide-react/dist/esm/icons/rotate-ccw"

import { Button } from "@/components/ui/button"

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
  const { draft, storageReady, updateDraft, loadExample, reset } =
    useFrameworkWorkspace()
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
    <div>
      <div className="bg-muted/30 flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-6">
        <div>
          <p className="text-sm font-semibold">Working model</p>
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
              setAnnouncement("Example logic model loaded.")
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

      <FrameworkWorkspaceFields draft={draft} updateDraft={updateDraft} />
      <FrameworkWorkspaceResults
        draft={draft}
        copied={copied}
        onCopy={handleCopy}
        onDownload={handleDownload}
      />
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  )
}
