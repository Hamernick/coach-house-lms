"use client"

import { useCallback, useEffect, useState } from "react"

import {
  DEFAULT_PARTNERSHIP_BRIEF,
  PARTNERSHIP_BRIEF_STORAGE_KEY,
  sanitizePartnershipBrief,
} from "../lib/partnership-brief"
import type { PartnershipBriefDraft } from "../types"

const EXAMPLE_PARTNERSHIP_BRIEF: PartnershipBriefDraft = {
  version: 1,
  organizationName: "Willow Street Family Resource Network",
  partnerName: "Harbor County Legal Aid",
  partnershipName: "Neighborhood legal navigation pathway",
  stage: "operating",
  model: "co-delivery",
  termMonths: 12,
  reviewEveryMonths: 3,
  sharedPurpose:
    "Help participating residents understand a housing or benefits issue, complete an appropriate next step, and reach qualified legal help when needed.",
  communityRole:
    "A paid resident advisory group reviews the pathway, language access, workshop schedule, consent language, and quarterly findings. Participants may decline follow-up without losing service.",
  organizationContribution:
    "Trusted bilingual navigators, accessible neighborhood space, outreach, scheduling, non-legal navigation, and participant feedback with documented consent.",
  partnerContribution:
    "Attorney-approved information, monthly workshops, referral criteria, conflict screening, legal consultations when eligible, and current capacity updates.",
  jointActivities:
    "Train navigators, publish a plain-language referral pathway, hold one workshop each month, review exceptions, and update public service information.",
  intendedResult:
    "Residents can identify and complete an appropriate next step. Review referral completion, wait time, access barriers, participant interpretation, exceptions, and workload without claiming legal outcomes caused by the partnership.",
  decisionRights:
    "Each organization controls its own services, staff, records, and professional judgments. Program leads may adjust scheduling; material scope, money, data, brand, or term changes require both executive directors and any required board approval.",
  financialTerms:
    "Each party tracks staff time and direct cost. Willow Street covers access supports from restricted program funds only when allowable. No referral fee or exchange of participant data is assumed. New costs require written approval.",
  dataBoundaries:
    "Share aggregate pathway counts and de-identified learning. Do not share case facts or identities across organizations without a documented purpose, minimum fields, appropriate authority or consent, secure method, retention term, and professional review.",
  communicationRhythm:
    "Program leads meet monthly and confirm capacity weekly by secure channel. Resident advisors and both leads interpret findings quarterly. Executive directors receive material risks and change requests.",
  conflictPath:
    "Leads document and try to resolve operational issues within five business days. Safety, confidentiality, legal-ethics, discrimination, conflicts, or material scope issues escalate immediately to authorized leaders and qualified reviewers.",
  closeoutPlan:
    "At month ten, partners decide whether to renew, revise, transfer, or end. They will provide accessible notice, complete open referrals responsibly, reconcile funds, return or delete records as required, remove outdated public claims, and record lessons.",
  organizationLead: "Program director; executive director as escalation lead.",
  partnerLead:
    "Community partnerships attorney; legal director as escalation lead.",
  hasConflictReview: true,
  hasDataReview: true,
  hasAccessibilityPlan: true,
  hasAuthorizedApproval: false,
}

export function usePartnershipBrief() {
  const [draft, setDraft] = useState(DEFAULT_PARTNERSHIP_BRIEF)
  const [storageReady, setStorageReady] = useState(false)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(PARTNERSHIP_BRIEF_STORAGE_KEY)
      if (stored) setDraft(sanitizePartnershipBrief(JSON.parse(stored)))
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
        PARTNERSHIP_BRIEF_STORAGE_KEY,
        JSON.stringify(draft)
      )
    } catch {
      // The builder remains usable when browser persistence is unavailable.
    }
  }, [draft, storageReady])

  const updateDraft = useCallback(
    <Key extends keyof PartnershipBriefDraft>(
      key: Key,
      value: PartnershipBriefDraft[Key]
    ) => setDraft((current) => ({ ...current, [key]: value })),
    []
  )

  const loadExample = useCallback(() => setDraft(EXAMPLE_PARTNERSHIP_BRIEF), [])
  const reset = useCallback(() => setDraft(DEFAULT_PARTNERSHIP_BRIEF), [])

  return { draft, storageReady, updateDraft, loadExample, reset }
}
