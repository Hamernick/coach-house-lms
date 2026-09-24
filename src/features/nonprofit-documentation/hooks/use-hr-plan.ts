"use client"

import { useDocumentationDraftPersistence } from "./use-documentation-draft-persistence"

import { useCallback, useState } from "react"

import {
  DEFAULT_HR_PLAN,
  HR_PLAN_STORAGE_KEY,
  sanitizeHrPlan,
} from "../lib/hr-plan"
import type { HrPlanDraft } from "../hr-types"

const EXAMPLE_HR_PLAN: HrPlanDraft = {
  version: 1,
  organizationName: "Willow Street Family Resource Network",
  roleTitle: "Community Navigation Coordinator",
  stage: "operating",
  relationship: "employee",
  reviewDays: 90,
  missionNeed:
    "Adults using the bilingual benefits-navigation program need accurate scheduled appointments and current referral follow-up. Current staff cannot maintain both direct navigation and partner-capacity updates without delayed responses.",
  roleOutcomes:
    "Participants receive accurate navigation steps in their preferred supported language, referrals reflect reviewed eligibility and capacity information, follow-up commitments close on time, and recurring access barriers reach program review.",
  essentialFunctions:
    "Conduct scheduled English and Spanish navigation appointments; communicate in accessible formats; document approved minimum case information; confirm current referral information; follow up on agreed next steps; participate in weekly supervision; support two planned evening outreach events each month; report safety, safeguarding, privacy, access, and service concerns through the designated path.",
  qualifications:
    "Demonstrated ability to explain complex service information clearly in English and Spanish; experience supporting people across different access needs; accurate record practices; sound boundaries; reliable follow-through; ability to complete required training. Benefits-navigation experience is relevant but can come from paid work, community service, or comparable lived and practical experience.",
  scheduleLocation:
    "Twenty-four hours per week with a published core schedule, two planned evening events monthly, accessible office and remote work, local travel to three ZIP codes, organization-provided systems, and weekly supervisor direction. Final details require wage, overtime, travel-time, reimbursement, remote-work, and state review.",
  compensationResources:
    "Twelve months of grant funding is identified. Before posting, the board-authorized reviewer will approve a documented pay range and full cost covering payroll taxes, benefits and leave review, insurance, laptop, phone, accessibility, training, supervision, mileage or transit reimbursement, administration, and transition. Continued funding is not promised.",
  recruitmentAccess:
    "Publish the same plain-language opportunity through community, workforce, peer-nonprofit, and public channels in accessible HTML and alternate formats. State the relationship under review, eventual pay range, schedule, location, essential functions, application steps, deadline, and accommodation contact. Do not request a photo, age, family details, disability information, or unnecessary identity records.",
  selectionProcess:
    "Use two trained reviewers, disclose conflicts, ask every applicant the same six job-related questions, score only stated evidence against the published rubric, offer interview access and accommodations, record the decision basis, obtain authorized approval, and communicate the outcome promptly. Escalate legal or accommodation questions rather than improvising.",
  onboardingTraining:
    "Complete required employment and payroll documents through approved systems; provide the current role brief, compensation and schedule, policies, technology, minimum record rules, language and disability access practices, participant boundaries, safety and safeguarding training, concern and accommodation paths, supervisor and backup, introductions, and 30-, 60-, and 90-day reviews before independent case work.",
  supervisionFeedback:
    "Hold weekly one-to-one supervision and monthly role review using participant follow-up, record accuracy, closed commitments, workload, access barriers, changing referral capacity, learning needs, and worker feedback. Address urgent pay, safety, accommodation, discrimination, harassment, retaliation, safeguarding, privacy, or authority concerns immediately through the designated route.",
  accommodationsAccess:
    "Name a confidential accommodation contact in recruitment and onboarding; accept requests in plain language and accessible formats; respond promptly through individualized qualified review; provide effective communication, accessible technology and place, and role-specific alternatives where appropriate; restrict related records to authorized access.",
  safetyReporting:
    "Train before participant work on foreseeable office, remote, travel, evening-event, de-escalation, emergency, safeguarding, and data risks. Provide a non-retaliatory reporting path, urgent contacts, optional confidential escalation, prompt acknowledgment, qualified review, corrective action, and follow-up with protected information separated from program notes.",
  recordsBoundary:
    "Keep applicant, personnel, payroll, tax, immigration, medical or accommodation, incident, performance, and participant records in their approved systems with role-based access and applicable retention. The working brief contains no Social Security numbers, identity documents, medical details, background reports, references, case details, or investigation notes.",
  ownerBackup:
    "Program director owns supervision; executive director is the operational backup. The board-authorized reviewer owns compensation approval, and qualified payroll, HR, legal, accessibility, safety, or safeguarding reviewers own questions within their scope.",
  transitionPlan:
    "At renewal, role change, funding change, or separation, confirm authority and qualified review; communicate through a fair process; review final pay, reimbursement, benefits, and notices; remove system and facility access; recover equipment; retain or dispose of records correctly; transfer open participant commitments without unnecessary personal detail; and document learning for role redesign.",
  hasClassificationCompensationReview: true,
  hasFairAccessibleProcessReview: true,
  hasSafetyReportingReview: true,
  hasRecordsAuthorityReview: true,
}

export function useHrPlan() {
  const [draft, setDraft] = useState(DEFAULT_HR_PLAN)
  const { storageReady, storageStatus, authorizeResetAfterReadFailure } =
    useDocumentationDraftPersistence(
      HR_PLAN_STORAGE_KEY,
      draft,
      setDraft,
      sanitizeHrPlan
    )

  const updateDraft = useCallback(
    <Key extends keyof HrPlanDraft>(key: Key, value: HrPlanDraft[Key]) =>
      setDraft((current) => ({ ...current, [key]: value })),
    []
  )

  return {
    draft,
    storageReady,
    storageStatus,
    updateDraft,
    loadExample: useCallback(() => setDraft(EXAMPLE_HR_PLAN), []),
    reset: useCallback(() => {
      authorizeResetAfterReadFailure()
      setDraft(DEFAULT_HR_PLAN)
    }, [authorizeResetAfterReadFailure]),
  }
}
