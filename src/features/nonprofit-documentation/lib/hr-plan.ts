import type {
  HrPlanAction,
  HrPlanDraft,
  HrPlanSummary,
  HrRelationshipId,
} from "../hr-types"
import type { DocumentationStageId } from "../types"

export const HR_PLAN_STORAGE_KEY = "coach-house:documentation:hr-plan:v1"

export const HR_RELATIONSHIPS: Array<{
  id: HrRelationshipId
  label: string
  description: string
}> = [
  {
    id: "employee",
    label: "Employee relationship to review",
    description:
      "Paid work directed by the organization; wage, hour, tax, leave, benefits, and state rules may apply.",
  },
  {
    id: "volunteer",
    label: "Volunteer relationship to review",
    description:
      "Service offered freely for a public purpose; the actual duties, expectations, compensation, and displacement of paid work matter.",
  },
  {
    id: "independent-contractor",
    label: "Independent-contractor relationship to review",
    description:
      "A result-focused service relationship whose classification depends on facts and applicable tests, not the contract title alone.",
  },
  {
    id: "board-member",
    label: "Board-member relationship to review",
    description:
      "A governance role with fiduciary authority that should remain distinct from staff supervision and service delivery.",
  },
  {
    id: "intern-fellow",
    label: "Intern or fellow relationship to review",
    description:
      "A learning or service arrangement requiring fact-specific wage, education, funding, and supervision review.",
  },
  {
    id: "mixed-team",
    label: "Mixed team to review",
    description:
      "Work shared across relationship types; review each relationship and handoff separately.",
  },
]

export const HR_REVIEW_DAYS = [30, 60, 90, 180] as const

export const HR_LIFECYCLE = [
  {
    id: "define",
    label: "Define",
    description:
      "Connect the role to mission need, outcomes, and essential work.",
    fields: ["missionNeed", "roleOutcomes", "essentialFunctions"] as const,
  },
  {
    id: "review",
    label: "Review",
    description:
      "Review the working relationship, resources, authority, and applicable rules.",
    fields: ["scheduleLocation", "compensationResources"] as const,
  },
  {
    id: "recruit",
    label: "Recruit",
    description:
      "Use job-related qualifications and a fair, accessible selection process.",
    fields: [
      "qualifications",
      "recruitmentAccess",
      "selectionProcess",
    ] as const,
  },
  {
    id: "onboard",
    label: "Onboard",
    description:
      "Provide the information, training, tools, access, and boundaries needed to begin.",
    fields: ["onboardingTraining"] as const,
  },
  {
    id: "support",
    label: "Support",
    description:
      "Maintain supervision, feedback, access, safety, reporting, and protected records.",
    fields: [
      "supervisionFeedback",
      "accommodationsAccess",
      "safetyReporting",
      "recordsBoundary",
      "ownerBackup",
    ] as const,
  },
  {
    id: "transition",
    label: "Transition",
    description:
      "Close or change the relationship with clear decisions, records, access, and continuity.",
    fields: ["transitionPlan"] as const,
  },
] as const

export const DEFAULT_HR_PLAN: HrPlanDraft = {
  version: 1,
  organizationName: "",
  roleTitle: "",
  stage: "exploring",
  relationship: "employee",
  reviewDays: 90,
  missionNeed: "",
  roleOutcomes: "",
  essentialFunctions: "",
  qualifications: "",
  scheduleLocation: "",
  compensationResources: "",
  recruitmentAccess: "",
  selectionProcess: "",
  onboardingTraining: "",
  supervisionFeedback: "",
  accommodationsAccess: "",
  safetyReporting: "",
  recordsBoundary: "",
  ownerBackup: "",
  transitionPlan: "",
  hasClassificationCompensationReview: false,
  hasFairAccessibleProcessReview: false,
  hasSafetyReportingReview: false,
  hasRecordsAuthorityReview: false,
}

const STAGES: DocumentationStageId[] = [
  "exploring",
  "forming",
  "operating",
  "growing",
]
const RELATIONSHIPS = HR_RELATIONSHIPS.map(({ id }) => id)

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function safeText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : ""
}

export function sanitizeHrPlan(value: unknown): HrPlanDraft {
  if (!isRecord(value)) return DEFAULT_HR_PLAN
  const stage = STAGES.includes(value.stage as DocumentationStageId)
    ? (value.stage as DocumentationStageId)
    : DEFAULT_HR_PLAN.stage
  const relationship = RELATIONSHIPS.includes(
    value.relationship as HrRelationshipId
  )
    ? (value.relationship as HrRelationshipId)
    : DEFAULT_HR_PLAN.relationship
  const reviewDays = HR_REVIEW_DAYS.includes(
    value.reviewDays as 30 | 60 | 90 | 180
  )
    ? (value.reviewDays as 30 | 60 | 90 | 180)
    : DEFAULT_HR_PLAN.reviewDays

  return {
    version: 1,
    organizationName: safeText(value.organizationName, 120),
    roleTitle: safeText(value.roleTitle, 120),
    stage,
    relationship,
    reviewDays,
    missionNeed: safeText(value.missionNeed, 700),
    roleOutcomes: safeText(value.roleOutcomes, 700),
    essentialFunctions: safeText(value.essentialFunctions, 900),
    qualifications: safeText(value.qualifications, 700),
    scheduleLocation: safeText(value.scheduleLocation, 600),
    compensationResources: safeText(value.compensationResources, 700),
    recruitmentAccess: safeText(value.recruitmentAccess, 700),
    selectionProcess: safeText(value.selectionProcess, 700),
    onboardingTraining: safeText(value.onboardingTraining, 800),
    supervisionFeedback: safeText(value.supervisionFeedback, 700),
    accommodationsAccess: safeText(value.accommodationsAccess, 700),
    safetyReporting: safeText(value.safetyReporting, 700),
    recordsBoundary: safeText(value.recordsBoundary, 700),
    ownerBackup: safeText(value.ownerBackup, 300),
    transitionPlan: safeText(value.transitionPlan, 700),
    hasClassificationCompensationReview:
      value.hasClassificationCompensationReview === true,
    hasFairAccessibleProcessReview:
      value.hasFairAccessibleProcessReview === true,
    hasSafetyReportingReview: value.hasSafetyReportingReview === true,
    hasRecordsAuthorityReview: value.hasRecordsAuthorityReview === true,
  }
}

const DRAFT_AREAS: Array<keyof HrPlanDraft> = [
  "missionNeed",
  "roleOutcomes",
  "essentialFunctions",
  "qualifications",
  "scheduleLocation",
  "compensationResources",
  "recruitmentAccess",
  "selectionProcess",
  "onboardingTraining",
  "supervisionFeedback",
  "accommodationsAccess",
  "safetyReporting",
  "recordsBoundary",
  "ownerBackup",
  "transitionPlan",
]

function hasText(draft: HrPlanDraft, key: keyof HrPlanDraft) {
  return typeof draft[key] === "string" && String(draft[key]).trim().length > 0
}

export function summarizeHrPlan(draft: HrPlanDraft): HrPlanSummary {
  return {
    draftedAreaCount: DRAFT_AREAS.filter((key) => hasText(draft, key)).length,
    totalAreaCount: DRAFT_AREAS.length,
    safeguardCount: [
      draft.hasClassificationCompensationReview,
      draft.hasFairAccessibleProcessReview,
      draft.hasSafetyReportingReview,
      draft.hasRecordsAuthorityReview,
    ].filter(Boolean).length,
    totalSafeguardCount: 4,
    lifecycleStepCount: HR_LIFECYCLE.filter(({ fields }) =>
      fields.every((key) => hasText(draft, key))
    ).length,
    totalLifecycleStepCount: HR_LIFECYCLE.length,
  }
}

export function hrRelationshipLabel(relationship: HrRelationshipId) {
  return (
    HR_RELATIONSHIPS.find(({ id }) => id === relationship)?.label ??
    relationship
  )
}

const STAGE_ACTIONS: Record<DocumentationStageId, HrPlanAction> = {
  exploring: {
    id: "stage-exploring",
    phase: "Purpose",
    action:
      "Test whether the work is necessary, bounded, funded, supportable, and distinct from founder or board authority before recruiting anyone.",
    evidence:
      "Mission need, participant input, essential work, realistic workload, responsible owner, available resources, and alternatives to creating the role.",
  },
  forming: {
    id: "stage-forming",
    phase: "Relationship",
    action:
      "Review the actual working relationship, full cost, decision authority, and operating support before choosing a title or publishing an opportunity.",
    evidence:
      "Role brief, relationship analysis, compensation basis, budget approval, schedule, location, supervision, equipment, insurance, and jurisdiction review.",
  },
  operating: {
    id: "stage-operating",
    phase: "Support",
    action:
      "Use a repeatable role lifecycle with timely pay or reimbursement, supervision, feedback, access, safety reporting, record controls, and documented decisions.",
    evidence:
      "Current role brief, onboarding record, work and pay records where required, check-ins, training, access decisions, safety follow-up, and review dates.",
  },
  growing: {
    id: "stage-growing",
    phase: "Transition",
    action:
      "Review role consistency, manager capacity, compensation governance, access, records, succession, and local requirements before adding people or locations.",
    evidence:
      "Comparable role architecture, documented approvals, manager spans, full-cost scenarios, location-specific review, backups, transitions, and worker feedback.",
  },
}

export function buildHrActions(draft: HrPlanDraft): HrPlanAction[] {
  const actions: HrPlanAction[] = [STAGE_ACTIONS[draft.stage]]
  const missing: Array<HrPlanAction | false> = [
    (!draft.missionNeed ||
      !draft.roleOutcomes ||
      !draft.essentialFunctions) && {
      id: "missing-purpose",
      phase: "Purpose",
      action:
        "Define the mission need, observable role outcomes, and essential functions before describing a person or credential.",
      evidence:
        "Participant or program need, work that must be done, expected results, essential tasks, boundaries, and work that remains with other roles.",
    },
    (!draft.scheduleLocation || !draft.compensationResources) && {
      id: "missing-relationship-review",
      phase: "Relationship",
      action:
        "Document the real schedule, location, direction, resources, compensation, expenses, and full cost for classification and budget review.",
      evidence:
        "Facts about control and independence, hours, location, tools, duration, pay, taxes, benefits, reimbursements, insurance, administration, and approved budget.",
    },
    (!draft.qualifications ||
      !draft.recruitmentAccess ||
      !draft.selectionProcess) && {
      id: "missing-recruitment",
      phase: "Recruit",
      action:
        "Build a job-related, fair, consistent, and accessible recruitment and selection process.",
      evidence:
        "Essential qualifications, accessible posting and application, consistent questions and rubric, decision roles, accommodation path, conflicts, and retained evidence.",
    },
    !draft.onboardingTraining && {
      id: "missing-onboarding",
      phase: "Onboard",
      action:
        "Plan the information, training, tools, access, introductions, and boundaries needed before independent work begins.",
      evidence:
        "Role expectations, policies, required forms, payroll or reimbursement setup, safety and safeguarding training, system access, contacts, and first review.",
    },
    (!draft.supervisionFeedback ||
      !draft.accommodationsAccess ||
      !draft.safetyReporting ||
      !draft.recordsBoundary ||
      !draft.ownerBackup) && {
      id: "missing-support",
      phase: "Support",
      action:
        "Complete the ongoing supervision, feedback, accommodation, safety, reporting, records, ownership, and backup practices.",
      evidence:
        "Check-in rhythm, fair expectations, request and reporting paths, response owners, non-retaliation, minimum records, access limits, retention, and escalation.",
    },
    !draft.transitionPlan && {
      id: "missing-transition",
      phase: "Transition",
      action:
        "Define how the role changes or ends, including communication, final decisions, access removal, records, equipment, continuity, and learning.",
      evidence:
        "Authorized decision, fair process, final pay or reimbursement review, property and access checklist, records handling, handoff, and post-transition contact.",
    },
    (!draft.hasClassificationCompensationReview ||
      !draft.hasFairAccessibleProcessReview ||
      !draft.hasSafetyReportingReview ||
      !draft.hasRecordsAuthorityReview) && {
      id: "remaining-safeguards",
      phase: "Safeguards",
      action:
        "Complete the remaining human reviews that apply before recruiting, engaging, paying, supervising, or ending the relationship.",
      evidence:
        "Qualified reviewer, jurisdiction, source, date, decision, approval, unresolved question, and trigger for renewed review.",
    },
  ]
  actions.push(...missing.filter((item): item is HrPlanAction => Boolean(item)))
  return actions
}

export function buildHrReviewPrompt(draft: HrPlanDraft) {
  const safe = sanitizeHrPlan(draft)
  return [
    "Review this nonprofit role and people-practices brief for human decision-making.",
    "",
    `Organization: ${safe.organizationName || "Not provided"}`,
    `Role: ${safe.roleTitle || "Not provided"}`,
    `Stage: ${safe.stage}`,
    `Working relationship under review: ${hrRelationshipLabel(safe.relationship)}`,
    `Review period: ${safe.reviewDays} days`,
    `Mission need: ${safe.missionNeed || "Not provided"}`,
    `Role outcomes: ${safe.roleOutcomes || "Not provided"}`,
    `Essential functions: ${safe.essentialFunctions || "Not provided"}`,
    `Qualifications: ${safe.qualifications || "Not provided"}`,
    `Schedule and location: ${safe.scheduleLocation || "Not provided"}`,
    `Compensation and resources: ${safe.compensationResources || "Not provided"}`,
    `Recruitment and access: ${safe.recruitmentAccess || "Not provided"}`,
    `Selection process: ${safe.selectionProcess || "Not provided"}`,
    `Onboarding and training: ${safe.onboardingTraining || "Not provided"}`,
    `Supervision and feedback: ${safe.supervisionFeedback || "Not provided"}`,
    `Accommodations and access: ${safe.accommodationsAccess || "Not provided"}`,
    `Safety and reporting: ${safe.safetyReporting || "Not provided"}`,
    `Records boundary: ${safe.recordsBoundary || "Not provided"}`,
    `Owner and backup: ${safe.ownerBackup || "Not provided"}`,
    `Transition plan: ${safe.transitionPlan || "Not provided"}`,
    "",
    "Requirements:",
    "- Do not decide or imply worker classification, exemption, wage, overtime, benefit, leave, tax, immigration, accommodation, safety, background-check, discipline, termination, or other legal conclusions.",
    "- Do not invent applicants, workers, credentials, references, protected information, performance, consent, incidents, approvals, policies, laws, deadlines, pay data, market data, or results.",
    "- Mark every assumption or missing fact as [NEEDS HUMAN INPUT].",
    "- Separate essential work from preferences and identify unclear outcomes, authority, workload, access, safety, records, supervision, and transition boundaries.",
    "- Identify questions for the worker, community, manager, board, payroll provider, insurer, and qualified HR, legal, tax, accessibility, safety, or safeguarding reviewer as applicable.",
    "- Return a review table and options. Do not rank, score, screen, recommend, approve, reject, hire, classify, discipline, or terminate a person.",
  ].join("\n")
}

function csvCell(value: string | number) {
  let text = String(value)
  if (/^[=+\-@]/.test(text)) text = `'${text}`
  return `"${text.replaceAll('"', '""')}"`
}

export function buildHrCsv(draft: HrPlanDraft) {
  const summary = summarizeHrPlan(draft)
  const rows: Array<Array<string | number>> = [
    ["Area", "Working role and people-practices brief"],
    ["Organization", draft.organizationName],
    ["Role", draft.roleTitle],
    ["Stage", draft.stage],
    [
      "Working relationship under review",
      hrRelationshipLabel(draft.relationship),
    ],
    ["Review days", draft.reviewDays],
    ["Mission need", draft.missionNeed],
    ["Role outcomes", draft.roleOutcomes],
    ["Essential functions", draft.essentialFunctions],
    ["Qualifications", draft.qualifications],
    ["Schedule and location", draft.scheduleLocation],
    ["Compensation and resources", draft.compensationResources],
    ["Recruitment and access", draft.recruitmentAccess],
    ["Selection process", draft.selectionProcess],
    ["Onboarding and training", draft.onboardingTraining],
    ["Supervision and feedback", draft.supervisionFeedback],
    ["Accommodations and access", draft.accommodationsAccess],
    ["Safety and reporting", draft.safetyReporting],
    ["Records boundary", draft.recordsBoundary],
    ["Owner and backup", draft.ownerBackup],
    ["Transition plan", draft.transitionPlan],
    [
      "Drafted areas",
      `${summary.draftedAreaCount} of ${summary.totalAreaCount}`,
    ],
    [
      "Complete lifecycle steps",
      `${summary.lifecycleStepCount} of ${summary.totalLifecycleStepCount}`,
    ],
    [
      "Safeguards selected",
      `${summary.safeguardCount} of ${summary.totalSafeguardCount}`,
    ],
    [],
    ["Action phase", "Action", "Evidence"],
    ...buildHrActions(draft).map((item) => [
      item.phase,
      item.action,
      item.evidence,
    ]),
  ]
  return rows.map((row) => row.map(csvCell).join(",")).join("\n")
}
