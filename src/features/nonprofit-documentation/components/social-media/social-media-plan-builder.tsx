"use client"

import { useState } from "react"
import RotateCcwIcon from "lucide-react/dist/esm/icons/rotate-ccw"

import { Button } from "@/components/ui/button"

import { useSocialMediaPlan } from "../../hooks/use-social-media-plan"
import {
  buildSocialMediaCsv,
  buildSocialMediaReviewPrompt,
} from "../../lib/social-media-plan"
import type { SocialMediaPlanDraft } from "../../types"
import { SocialMediaPlanFields } from "./social-media-plan-fields"
import { SocialMediaPlanResults } from "./social-media-plan-results"

function downloadCsv(draft: SocialMediaPlanDraft) {
  const file = new Blob([buildSocialMediaCsv(draft)], {
    type: "text/csv;charset=utf-8",
  })
  const url = URL.createObjectURL(file)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = "nonprofit-social-media-brief.csv"
  anchor.click()
  URL.revokeObjectURL(url)
}

export function SocialMediaPlanBuilder() {
  const {
    draft,
    storageReady,
    updateDraft,
    updateChannelCadence,
    loadExample,
    reset,
  } = useSocialMediaPlan()
  const [announcement, setAnnouncement] = useState("")
  const [promptCopied, setPromptCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  const copy = async (value: string, success: string, failure: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setAnnouncement(success)
      return true
    } catch {
      setAnnouncement(failure)
      return false
    }
  }

  return (
    <fieldset disabled={!storageReady} className="min-w-0">
      <div className="bg-muted/30 flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-6">
        <div>
          <p className="text-sm font-semibold">Working content brief</p>
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
              setLinkCopied(false)
              setAnnouncement("Example social media brief loaded.")
            }}
          >
            Load example
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="min-h-11"
            onClick={() => {
              if (!window.confirm("Reset this social media brief?")) return
              reset()
              setPromptCopied(false)
              setLinkCopied(false)
              setAnnouncement("Social media brief reset.")
            }}
          >
            <RotateCcwIcon className="size-4" aria-hidden /> Reset
          </Button>
        </div>
      </div>

      <SocialMediaPlanFields
        draft={draft}
        updateDraft={updateDraft}
        updateChannelCadence={updateChannelCadence}
      />
      <SocialMediaPlanResults
        draft={draft}
        promptCopied={promptCopied}
        linkCopied={linkCopied}
        onCopyPrompt={async () => {
          const copied = await copy(
            buildSocialMediaReviewPrompt(draft),
            "Social media review prompt copied.",
            "Social media review prompt could not be copied."
          )
          setPromptCopied(copied)
        }}
        onCopyLink={async (value) => {
          const copied = await copy(
            value,
            "Tracked link copied.",
            "Tracked link could not be copied."
          )
          setLinkCopied(copied)
        }}
        onDownload={() => {
          downloadCsv(draft)
          setAnnouncement("Social media brief CSV downloaded.")
        }}
      />
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </fieldset>
  )
}
