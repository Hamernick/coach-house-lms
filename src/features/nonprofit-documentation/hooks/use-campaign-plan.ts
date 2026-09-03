"use client"

import { useCallback, useEffect, useState } from "react"

import type { CampaignPlanDraft } from "../campaign-types"
import {
  CAMPAIGN_PLAN_STORAGE_KEY,
  DEFAULT_CAMPAIGN_PLAN,
  sanitizeCampaignPlan,
} from "../lib/campaign-plan"

const EXAMPLE_CAMPAIGN_PLAN: CampaignPlanDraft = {
  version: 1,
  organizationName: "Willow Street Family Resource Network",
  campaignName: "Appointments without the guesswork",
  stage: "operating",
  campaignType: "service-access",
  startDate: "2026-10-05",
  endDate: "2026-11-15",
  objective:
    "Help more eligible residents understand the current benefits-navigation offer and use the appropriate appointment path while keeping weekly demand within reviewed service capacity.",
  primaryAudience:
    "Spanish- and English-speaking adults living in three named ZIP codes who may qualify for benefits navigation, expect a fee, or do not know telephone interpretation is available.",
  audienceEvidence:
    "Three recent listening sessions identified cost and language assumptions. Current program records show unused weekday appointment capacity. The sample is small and does not represent every eligible resident; partner and participant review remains necessary.",
  desiredAction:
    "Read the reviewed service page, confirm that the service appears relevant, then complete the mobile appointment request or call the published number. People should not share case details in public replies.",
  mainMessage:
    "Free benefits-navigation appointments are available in Spanish and English, with telephone interpretation for additional languages. Check current fit and request an appointment through the reviewed service page.",
  supportingEvidence:
    "Use the current program page, approved eligibility and service description, current appointment schedule, verified ZIP-code service area, language-access process, and program-owner review. Do not promise eligibility, benefit approval, wait time, or outcome.",
  offerDestination:
    "The mobile service page states who the program serves, what it does and does not do, current cost, languages and interpretation, accessibility contact, service area, hours, appointment length, privacy note, request form, phone option, and response expectation.",
  channelRoles:
    "Partner flyers create local recognition; partner email reaches existing relationships; organization social posts repeat the sourced message; two tabling events answer general questions; every path uses the same reviewed destination and campaign identifier.",
  timelineMilestones:
    "Week 0: source, access, permission, legal, capacity, destination, and owner review. Week 1: partner briefing and small launch. Weeks 2–5: delivery, response, weekly source and capacity check. Week 6: final delivery, closeout, audience feedback, and decision review.",
  budgetCapacity:
    "Working budget covers bilingual editing, print, two events, and limited paid distribution after the small test. The program owner confirms appointment inventory weekly. Promotion pauses when the response queue reaches the reviewed threshold or the destination is not current.",
  ownersApprovals:
    "Program lead owns service facts and capacity; communications lead owns the brief and final assets; language and accessibility reviewers approve relevant formats; operations owns request routing; executive director approves spending; a backup is named for each live function.",
  accessibilityLanguage:
    "Provide reviewed Spanish and English versions, plain-language headings, descriptive links, meaningful alternative text, captions and transcripts where needed, readable print, accessible forms, telephone interpretation information, and a published accommodation contact.",
  consentPrivacy:
    "Use only approved program and partner lists for their documented purposes. Do not add event contacts without an appropriate basis. Collect the minimum request information at the destination, keep case details out of campaign tools, honor opt-outs, and limit access to response owners.",
  complianceReview:
    "Review tax status, charitable and program claims, state and local service context, email and text classification, list source and opt-outs, paid-placement and partner disclosures, intellectual-property rights, accessibility, platform rules, grant terms, and contracts before use.",
  responseEscalation:
    "Operations answers service-path questions through approved channels within the published expectation. Public replies do not collect case details. Access requests move to the accommodation contact; misinformation triggers source review and correction; safety, privacy, legal, press, or capacity issues go to named qualified owners; promotion can pause.",
  measurementPlan:
    "Record distribution by channel, destination visits by campaign identifier, form starts, completed requests, phone referrals that can be counted without exposing case data, kept appointments, recurring questions, access requests, opt-outs, corrections, response time, queue size, staff hours, and direct campaign cost. State attribution and duplication limits.",
  learningDecision:
    "At closeout, decide whether to maintain, revise, repeat, expand, pause, archive, or stop the message, destination, channel mix, partner approach, translation, response process, or appointment capacity. Record evidence, limits, owner, and next review date.",
  hasClaimReview: true,
  hasAccessibilityReview: true,
  hasConsentPrivacyReview: true,
  hasLegalChannelReview: true,
  hasDeliveryCapacityReview: true,
}

export function useCampaignPlan() {
  const [draft, setDraft] = useState(DEFAULT_CAMPAIGN_PLAN)
  const [storageReady, setStorageReady] = useState(false)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(CAMPAIGN_PLAN_STORAGE_KEY)
      if (stored) setDraft(sanitizeCampaignPlan(JSON.parse(stored)))
    } catch {
      // Keep the safe default when browser storage is unavailable or invalid.
    } finally {
      setStorageReady(true)
    }
  }, [])

  useEffect(() => {
    if (!storageReady) return
    try {
      window.localStorage.setItem(
        CAMPAIGN_PLAN_STORAGE_KEY,
        JSON.stringify(draft)
      )
    } catch {
      // The tool remains usable when browser storage is unavailable.
    }
  }, [draft, storageReady])

  const updateDraft = useCallback(
    <Key extends keyof CampaignPlanDraft>(
      key: Key,
      value: CampaignPlanDraft[Key]
    ) => setDraft((current) => ({ ...current, [key]: value })),
    []
  )

  return {
    draft,
    storageReady,
    updateDraft,
    loadExample: useCallback(() => setDraft(EXAMPLE_CAMPAIGN_PLAN), []),
    reset: useCallback(() => setDraft(DEFAULT_CAMPAIGN_PLAN), []),
  }
}
