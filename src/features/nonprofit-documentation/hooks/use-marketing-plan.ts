"use client"

import { useDocumentationDraftPersistence } from "./use-documentation-draft-persistence"

import { useCallback, useState } from "react"

import {
  DEFAULT_MARKETING_PLAN,
  MARKETING_PLAN_STORAGE_KEY,
  sanitizeMarketingPlan,
} from "../lib/marketing-plan"
import type { MarketingChannelId, MarketingPlanDraft } from "../types"

const EXAMPLE_MARKETING_PLAN: MarketingPlanDraft = {
  version: 1,
  organizationName: "Willow Street Family Resource Network",
  campaignName: "Know your options",
  stage: "operating",
  objective: "service-access",
  primaryAudience:
    "Adults in three service ZIP codes who have a housing or public-benefits question",
  mainMessage:
    "Free, confidential legal-navigation appointments help residents understand options and next steps before or during a housing or benefits problem.",
  proofPoint:
    "The reviewed program page confirms that appointments are free, available without an existing court case, and provided in English and Spanish.",
  invitation:
    "Review eligibility and request a 30-minute appointment on the service page.",
  channelCadence: {
    email: 1,
    website: 1,
    social: 8,
    partners: 2,
    events: 1,
    media: 0,
  },
  hasStoryPermissionProcess: true,
  hasContentReviewProcess: true,
  hasLinkTrackingConvention: true,
}

export function useMarketingPlan() {
  const [draft, setDraft] = useState(DEFAULT_MARKETING_PLAN)
  const { storageReady, storageStatus } = useDocumentationDraftPersistence(
    MARKETING_PLAN_STORAGE_KEY,
    draft,
    setDraft,
    sanitizeMarketingPlan
  )

  const updateDraft = useCallback(
    <Key extends keyof MarketingPlanDraft>(
      key: Key,
      value: MarketingPlanDraft[Key]
    ) => {
      setDraft((current) => ({ ...current, [key]: value }))
    },
    []
  )

  const updateChannelCadence = useCallback(
    (channelId: MarketingChannelId, value: number) => {
      setDraft((current) => ({
        ...current,
        channelCadence: {
          ...current.channelCadence,
          [channelId]: value,
        },
      }))
    },
    []
  )

  const loadExample = useCallback(() => setDraft(EXAMPLE_MARKETING_PLAN), [])
  const reset = useCallback(() => setDraft(DEFAULT_MARKETING_PLAN), [])

  return {
    draft,
    storageReady,
    storageStatus,
    updateDraft,
    updateChannelCadence,
    loadExample,
    reset,
  }
}
