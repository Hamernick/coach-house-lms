"use client"

import { useDocumentationDraftPersistence } from "./use-documentation-draft-persistence"

import { useCallback, useState } from "react"

import {
  DEFAULT_SOCIAL_MEDIA_PLAN,
  SOCIAL_MEDIA_PLAN_STORAGE_KEY,
  sanitizeSocialMediaPlan,
} from "../lib/social-media-plan"
import type { SocialMediaChannelId, SocialMediaPlanDraft } from "../types"

const EXAMPLE_SOCIAL_MEDIA_PLAN: SocialMediaPlanDraft = {
  version: 1,
  organizationName: "Willow Street Family Resource Network",
  campaignName: "Know your options",
  stage: "operating",
  objective: "service-access",
  campaignWeeks: 8,
  primaryAudience:
    "Adults in three service ZIP codes who have a housing or public-benefits question",
  desiredAction:
    "Review eligibility and request a free 30-minute navigation appointment.",
  destinationUrl: "https://example.org/navigation-appointments",
  mainMessage:
    "Willow Street offers free, confidential 30-minute benefits-navigation appointments in English and Spanish. A navigator can help residents understand available options and identify a next step; the service is not legal advice.",
  sourceEvidence:
    "The reviewed program page dated August 28, 2026 confirms current ZIP codes, eligibility, languages, appointment length, no-cost status, confidentiality statement, service boundary, and request process.",
  storyPermissionContext:
    "This draft uses no participant story, identity, quotation, image, voice, or case detail. Any future story requires a separate context-specific permission and safety review.",
  voiceGuidance:
    "Plain, calm, specific, bilingual where the source is reviewed, and never urgent without a real deadline.",
  postCopy:
    "Have a housing or public-benefits question? Willow Street offers free, confidential 30-minute navigation appointments in English and Spanish for adults in our three service ZIP codes. A navigator can help you understand available options and identify a next step; the service is not legal advice. Review eligibility and request an appointment at the service page.",
  visualDescription:
    "A simple text-led service card showing the program name, free appointment length, supported languages, and descriptive action. No participant photography.",
  alternativeText:
    "Willow Street service card: Free 30-minute benefits-navigation appointments in English and Spanish. Review eligibility and request an appointment.",
  captionsPlan:
    "If adapted to video, provide reviewed open captions and a transcript that includes the service boundary and action; identify speakers and relevant sounds.",
  linkLabel: "Review eligibility and request an appointment",
  responseProtocol:
    "Answer general program questions from the current source. Do not request personal case details publicly. Move service questions to the secure request form and escalate legal, safety, media, complaint, or capacity issues.",
  approvalOwner: "Program director; communications manager as backup.",
  escalationOwner:
    "Executive director for safety, legal, media, political, privacy, or service-capacity concerns.",
  previewChannel: "instagram",
  channelCadence: {
    instagram: 2,
    facebook: 1,
    linkedin: 1,
    tiktok: 0,
    youtube: 0,
    bluesky: 0,
    other: 0,
  },
  hasStoryPermissionReview: true,
  hasClaimSourceReview: true,
  hasAccessibilityReview: true,
  hasApprovalEscalationPlan: true,
}

export function useSocialMediaPlan() {
  const [draft, setDraft] = useState(DEFAULT_SOCIAL_MEDIA_PLAN)
  const { storageReady, storageStatus, authorizeResetAfterReadFailure } =
    useDocumentationDraftPersistence(
      SOCIAL_MEDIA_PLAN_STORAGE_KEY,
      draft,
      setDraft,
      sanitizeSocialMediaPlan
    )

  const updateDraft = useCallback(
    <Key extends keyof SocialMediaPlanDraft>(
      key: Key,
      value: SocialMediaPlanDraft[Key]
    ) => setDraft((current) => ({ ...current, [key]: value })),
    []
  )

  const updateChannelCadence = useCallback(
    (channel: SocialMediaChannelId, value: number) => {
      setDraft((current) => ({
        ...current,
        channelCadence: { ...current.channelCadence, [channel]: value },
      }))
    },
    []
  )

  return {
    draft,
    storageReady,
    storageStatus,
    updateDraft,
    updateChannelCadence,
    loadExample: useCallback(() => setDraft(EXAMPLE_SOCIAL_MEDIA_PLAN), []),
    reset: useCallback(() => {
      authorizeResetAfterReadFailure()
      setDraft(DEFAULT_SOCIAL_MEDIA_PLAN)
    }, [authorizeResetAfterReadFailure]),
  }
}
