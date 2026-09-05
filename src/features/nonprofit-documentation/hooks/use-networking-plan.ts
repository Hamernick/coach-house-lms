"use client"

import { useDocumentationDraftPersistence } from "./use-documentation-draft-persistence"

import { useCallback, useState } from "react"

import {
  DEFAULT_NETWORKING_PLAN,
  MAX_NETWORKING_RELATIONSHIPS,
  NETWORKING_PLAN_STORAGE_KEY,
  createNetworkingRelationship,
  sanitizeNetworkingPlan,
} from "../lib/networking-plan"
import type { NetworkingPlanDraft, NetworkingRelationshipDraft } from "../types"

const EXAMPLE_NETWORKING_PLAN: NetworkingPlanDraft = {
  version: 1,
  organizationName: "Willow Street Family Resource Network",
  initiativeName: "Current referral pathway review",
  stage: "operating",
  objective: "referral-pathway",
  reviewWeeks: 8,
  networkingPurpose:
    "Improve how adults in three service ZIP codes find current housing and public-benefits help without implying eligibility, capacity, legal advice, or partner endorsement.",
  communityAccountability:
    "A paid bilingual resident advisory circle defines recurring referral barriers, reviews the questions and access options, can challenge the proposed pathway, and receives a plain-language update on decisions and unresolved constraints.",
  existingAssets:
    "Trusted resident advisors, two bilingual navigators, a county legal-aid contact, neighborhood library access points, and a reviewed navigation service page.",
  relationshipGaps:
    "Current benefits-enrollment capacity, disability-led access review, tenant-organizing context, rural transportation knowledge, and a reliable process for partner capacity updates.",
  invitation:
    "Request a 30-minute listening conversation about fit, eligibility, language and disability access, current capacity, referral feedback, and a responsible update rhythm. The conversation creates no referral or partnership commitment.",
  followUpRhythm:
    "Send agreed notes and next steps within three business days; review open loops weekly and provide partners and resident advisors a monthly update, including when there is no progress.",
  accessPlan:
    "Offer English and Spanish materials, remote or accessible in-person options, captions or interpretation when requested, flexible scheduling, transit support, and compensation for resident advisors.",
  dataBoundary:
    "The map stores organization- or role-level context only. Share no participant case details or personal contact information without a defined need, appropriate notice or permission, secure method, access limit, and retention decision.",
  planOwner:
    "Community partnerships manager; program director as operational backup.",
  escalationPath:
    "Route safety, confidentiality, legal, political, lobbying, media, conflict, funding, procurement, discrimination, professional-boundary, or service-capacity concerns to the executive director and qualified reviewer before committing or sharing.",
  relationships: [
    {
      id: "resident-advisory-circle",
      label: "Bilingual resident advisory circle",
      category: "community",
      engagement: "listen",
      purpose:
        "Define recurring referral barriers and what a trustworthy handoff should feel like.",
      theirContext:
        "Residents hold direct knowledge of language, timing, technology, transportation, stigma, eligibility confusion, and failed handoffs.",
      responsibleOffer:
        "Compensated participation, accessible options, reviewed themes, decision influence, and a clear account of what changed or could not change.",
      nextStep:
        "Review the listening questions, participation options, compensation, and how findings will be used.",
      owner: "Community partnerships manager",
      reviewTiming: "Before outreach; close the loop monthly",
    },
    {
      id: "legal-aid-intake",
      label: "County legal-aid intake team",
      category: "peer-nonprofit",
      engagement: "coordinate",
      purpose:
        "Clarify which housing or benefits questions belong in a legal referral and how capacity changes are communicated.",
      theirContext:
        "Eligibility, conflicts, geography, professional duties, grant limits, and appointment capacity shape which referrals can be accepted.",
      responsibleOffer:
        "Accurate navigation boundaries, reviewed referral information, accessible community outreach, and aggregated feedback without case details.",
      nextStep:
        "Hold a 30-minute intake-pathway review with no promise of referral capacity or legal representation.",
      owner: "Program director",
      reviewTiming: "Within three weeks; capacity check monthly",
    },
    {
      id: "neighborhood-library",
      label: "Neighborhood library access team",
      category: "public-agency",
      engagement: "exchange",
      purpose:
        "Understand how residents currently seek information and whether reviewed materials can support appropriate navigation.",
      theirContext:
        "Library staff see recurring questions but do not determine program eligibility or provide legal advice.",
      responsibleOffer:
        "Current plain-language materials, staff briefing, correction contact, and an accessible service-request path.",
      nextStep:
        "Ask the access lead to review the material format, recurring questions, boundaries, and update process.",
      owner: "Lead navigator",
      reviewTiming: "During week four; material review every two months",
    },
    {
      id: "regional-funder-team",
      label: "Regional funder program team",
      category: "funder",
      engagement: "learn",
      purpose:
        "Learn whether referral-access infrastructure fits current priorities before preparing a request.",
      theirContext:
        "Funding priorities, eligible costs, timing, geography, reporting, and conflict rules must be confirmed directly.",
      responsibleOffer:
        "A concise explanation of the need, resident-guided learning, current limits, full-cost assumptions, and questions about fit.",
      nextStep:
        "Request a brief fit conversation; do not send a proposal or imply community endorsement yet.",
      owner: "Executive director",
      reviewTiming: "After resident review; reassess after the conversation",
    },
  ],
  hasCommunityVoiceReview: true,
  hasConsentDataReview: true,
  hasAccessibilityReview: true,
  hasAuthorityConflictReview: true,
}

export function useNetworkingPlan() {
  const [draft, setDraft] = useState(DEFAULT_NETWORKING_PLAN)
  const { storageReady, storageStatus } = useDocumentationDraftPersistence(
    NETWORKING_PLAN_STORAGE_KEY,
    draft,
    setDraft,
    sanitizeNetworkingPlan
  )

  const updateDraft = useCallback(
    <Key extends keyof NetworkingPlanDraft>(
      key: Key,
      value: NetworkingPlanDraft[Key]
    ) => setDraft((current) => ({ ...current, [key]: value })),
    []
  )

  const updateRelationship = useCallback(
    <Key extends keyof NetworkingRelationshipDraft>(
      id: string,
      key: Key,
      value: NetworkingRelationshipDraft[Key]
    ) => {
      setDraft((current) => ({
        ...current,
        relationships: current.relationships.map((item) =>
          item.id === id ? { ...item, [key]: value } : item
        ),
      }))
    },
    []
  )

  const addRelationship = useCallback(() => {
    setDraft((current) => {
      if (current.relationships.length >= MAX_NETWORKING_RELATIONSHIPS) {
        return current
      }
      const id = `relationship-${Date.now()}-${current.relationships.length + 1}`
      return {
        ...current,
        relationships: [
          ...current.relationships,
          createNetworkingRelationship(id),
        ],
      }
    })
  }, [])

  const removeRelationship = useCallback((id: string) => {
    setDraft((current) => {
      const remaining = current.relationships.filter((item) => item.id !== id)
      return {
        ...current,
        relationships:
          remaining.length > 0
            ? remaining
            : [createNetworkingRelationship(`relationship-${Date.now()}`)],
      }
    })
  }, [])

  return {
    draft,
    storageReady,
    storageStatus,
    updateDraft,
    updateRelationship,
    addRelationship,
    removeRelationship,
    loadExample: useCallback(() => setDraft(EXAMPLE_NETWORKING_PLAN), []),
    reset: useCallback(() => setDraft(DEFAULT_NETWORKING_PLAN), []),
  }
}
