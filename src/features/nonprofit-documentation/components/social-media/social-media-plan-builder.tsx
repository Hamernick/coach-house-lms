"use client"

import { DEFAULT_SOCIAL_MEDIA_PLAN } from "../../lib/social-media-plan"
import { DocumentationDraftToolbar } from "../documentation-draft-toolbar"
import { DocumentationToolFlow } from "../documentation-tool-flow"

import { useState } from "react"

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
    storageStatus,
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
      <DocumentationDraftToolbar
        ready={storageReady}
        storageStatus={storageStatus}
        hasChanges={
          JSON.stringify(draft) !== JSON.stringify(DEFAULT_SOCIAL_MEDIA_PLAN)
        }
        onLoadExample={() => {
          loadExample()
          setPromptCopied(false)
          setLinkCopied(false)
          setAnnouncement("Example social media brief loaded.")
        }}
        onReset={() => {
          if (!window.confirm("Reset this social media brief?")) return
          reset()
          setPromptCopied(false)
          setLinkCopied(false)
          setAnnouncement("Social media brief reset.")
        }}
      />

      <DocumentationToolFlow
        hasDraft={
          JSON.stringify(draft) !== JSON.stringify(DEFAULT_SOCIAL_MEDIA_PLAN)
        }
        steps={[
          {
            id: "content",
            label: "Plan the content",
            content: (
              <SocialMediaPlanFields
                draft={draft}
                updateDraft={updateDraft}
                updateChannelCadence={updateChannelCadence}
              />
            ),
          },
          {
            id: "review",
            label: "Review & export",
            content: (
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
