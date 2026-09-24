import { documentationCsvCell } from "./csv-cell"
import type {
  CrmFieldCategoryId,
  CrmFieldDraft,
  CrmFieldSensitivityId,
  CrmPlanAction,
  CrmPlanDraft,
  CrmPlanSummary,
  CrmRelationshipContextId,
} from "../crm-types"
import type { DocumentationStageId } from "../types"

export const CRM_PLAN_STORAGE_KEY =
  "coach-house:documentation:crm-data-stewardship-plan:v1"

export const CRM_RELATIONSHIP_CONTEXTS: Array<{
  id: CrmRelationshipContextId
  label: string
  description: string
}> = [
  {
    id: "fundraising",
    label: "Fundraising and stewardship",
    description: "Support donor relationships, gifts, follow-up, and promises.",
  },
  {
    id: "program-service",
    label: "Program or service relationships",
    description:
      "Support access, participation, delivery, follow-up, and learning.",
  },
  {
    id: "volunteer",
    label: "Volunteer relationships",
    description: "Support interest, placement, service, and recognition.",
  },
  {
    id: "membership",
    label: "Membership",
    description: "Support membership status, benefits, and participation.",
  },
  {
    id: "partnership",
    label: "Partners and institutions",
    description: "Support organizational relationships and shared work.",
  },
  {
    id: "advocacy-community",
    label: "Advocacy or community relationships",
    description:
      "Support appropriate participation, communication, and follow-through.",
  },
  {
    id: "mixed",
    label: "Multiple relationship contexts",
    description:
      "Separate purposes and access when one system supports several contexts.",
  },
]

export const CRM_FIELD_CATEGORIES: Array<{
  id: CrmFieldCategoryId
  label: string
  description: string
}> = [
  {
    id: "identity",
    label: "Identity",
    description: "The minimum attributes needed to distinguish a record.",
  },
  {
    id: "contact-preference",
    label: "Contact and preference",
    description: "Approved contact paths, choices, notices, and suppressions.",
  },
  {
    id: "relationship",
    label: "Relationship",
    description: "Relevant role, history, commitments, and next steps.",
  },
  {
    id: "transaction",
    label: "Transaction",
    description: "Gift, payment, registration, or other accountable activity.",
  },
  {
    id: "program-service",
    label: "Program or service",
    description: "Participation or service information with explicit limits.",
  },
  {
    id: "demographic",
    label: "Demographic or identity detail",
    description:
      "Potentially sensitive information requiring a defined need and review.",
  },
  {
    id: "notes",
    label: "Notes or narrative",
    description: "Bounded factual context with correction and access rules.",
  },
  {
    id: "system",
    label: "System metadata",
    description: "Record source, owner, timestamps, status, and identifiers.",
  },
]

export const CRM_FIELD_SENSITIVITY: Array<{
  id: CrmFieldSensitivityId
  label: string
  description: string
}> = [
  {
    id: "standard",
    label: "Standard review",
    description: "Still personal or operational data; apply normal controls.",
  },
  {
    id: "restricted",
    label: "Restricted",
    description: "Limit access, use, export, and disclosure to named roles.",
  },
  {
    id: "high-risk",
    label: "High-risk review",
    description:
      "Pause collection until necessity, harm, law, security, and alternatives are reviewed.",
  },
]

export const CRM_REVIEW_MONTHS = [3, 6, 12] as const
export const MAX_CRM_FIELDS = 8

export function createCrmField(id = "field-1"): CrmFieldDraft {
  return {
    id,
    label: "",
    category: "identity",
    purpose: "",
    source: "",
    sensitivity: "standard",
    accessRole: "",
    retentionReview: "",
  }
}

export const CRM_LIFECYCLE: Array<{
  id: CrmPlanAction["phase"]
  label: string
  description: string
  fields: Array<keyof CrmPlanDraft>
}> = [
  {
    id: "Define",
    label: "Define",
    description: "Name the purpose, people, decisions, and record boundary.",
    fields: ["systemPurpose", "peopleAndDecisions", "recordBoundary"],
  },
  {
    id: "Collect",
    label: "Collect",
    description: "Document source, notice, necessity, and migration limits.",
    fields: ["collectionNoticeConsent", "vendorMigration"],
  },
  {
    id: "Permission",
    label: "Permission",
    description: "Honor communication choices, language, and access needs.",
    fields: ["communicationPreferences", "accessibilityLanguage"],
  },
  {
    id: "Maintain",
    label: "Maintain",
    description: "Resolve identity, duplicates, errors, and stale records.",
    fields: ["identityDeduplication", "dataQualityCorrection"],
  },
  {
    id: "Use",
    label: "Use",
    description: "Connect relationship work and reporting to real decisions.",
    fields: ["relationshipLifecycle", "reportingDecision"],
  },
  {
    id: "Protect",
    label: "Protect",
    description: "Limit roles, integrations, exports, and incident exposure.",
    fields: ["accessRoles", "integrationsExports", "securityIncident"],
  },
  {
    id: "Retire",
    label: "Retire",
    description: "Review retention, archive, deletion, and system exit.",
    fields: ["retentionDeletion"],
  },
]

export const DEFAULT_CRM_PLAN: CrmPlanDraft = {
  version: 1,
  organizationName: "",
  planName: "",
  stage: "exploring",
  relationshipContext: "fundraising",
  reviewMonths: 6,
  systemPurpose: "",
  peopleAndDecisions: "",
  recordBoundary: "",
  collectionNoticeConsent: "",
  communicationPreferences: "",
  identityDeduplication: "",
  relationshipLifecycle: "",
  accessRoles: "",
  dataQualityCorrection: "",
  retentionDeletion: "",
  integrationsExports: "",
  securityIncident: "",
  accessibilityLanguage: "",
  reportingDecision: "",
  vendorMigration: "",
  fields: [createCrmField()],
  hasMinimumNecessaryReview: false,
  hasNoticePreferenceReview: false,
  hasAccessIntegrationReview: false,
  hasRetentionIncidentReview: false,
  hasLegalSectorReview: false,
}

const STAGES: DocumentationStageId[] = [
  "exploring",
  "forming",
  "operating",
  "growing",
]
const CONTEXT_IDS = CRM_RELATIONSHIP_CONTEXTS.map(({ id }) => id)
const CATEGORY_IDS = CRM_FIELD_CATEGORIES.map(({ id }) => id)
const SENSITIVITY_IDS = CRM_FIELD_SENSITIVITY.map(({ id }) => id)

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function safeText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : ""
}

function safeId(value: unknown, index: number) {
  const id = safeText(value, 80).replace(/[^a-zA-Z0-9_-]/g, "")
  return id || `field-${index + 1}`
}

function sanitizeCrmField(value: unknown, index: number): CrmFieldDraft {
  if (!isRecord(value)) return createCrmField(`field-${index + 1}`)
  return {
    id: safeId(value.id, index),
    label: safeText(value.label, 120),
    category: CATEGORY_IDS.includes(value.category as CrmFieldCategoryId)
      ? (value.category as CrmFieldCategoryId)
      : "identity",
    purpose: safeText(value.purpose, 500),
    source: safeText(value.source, 400),
    sensitivity: SENSITIVITY_IDS.includes(
      value.sensitivity as CrmFieldSensitivityId
    )
      ? (value.sensitivity as CrmFieldSensitivityId)
      : "standard",
    accessRole: safeText(value.accessRole, 240),
    retentionReview: safeText(value.retentionReview, 300),
  }
}

const TEXT_LIMITS: Partial<Record<keyof CrmPlanDraft, number>> = {
  organizationName: 120,
  planName: 140,
  systemPurpose: 800,
  peopleAndDecisions: 800,
  recordBoundary: 800,
  collectionNoticeConsent: 900,
  communicationPreferences: 900,
  identityDeduplication: 700,
  relationshipLifecycle: 800,
  accessRoles: 800,
  dataQualityCorrection: 800,
  retentionDeletion: 900,
  integrationsExports: 900,
  securityIncident: 900,
  accessibilityLanguage: 800,
  reportingDecision: 800,
  vendorMigration: 900,
}

export function sanitizeCrmPlan(value: unknown): CrmPlanDraft {
  if (!isRecord(value)) return DEFAULT_CRM_PLAN
  const stage = STAGES.includes(value.stage as DocumentationStageId)
    ? (value.stage as DocumentationStageId)
    : DEFAULT_CRM_PLAN.stage
  const relationshipContext = CONTEXT_IDS.includes(
    value.relationshipContext as CrmRelationshipContextId
  )
    ? (value.relationshipContext as CrmRelationshipContextId)
    : DEFAULT_CRM_PLAN.relationshipContext
  const reviewMonths = CRM_REVIEW_MONTHS.includes(
    value.reviewMonths as 3 | 6 | 12
  )
    ? (value.reviewMonths as 3 | 6 | 12)
    : DEFAULT_CRM_PLAN.reviewMonths
  const fields = Array.isArray(value.fields)
    ? value.fields.slice(0, MAX_CRM_FIELDS).map(sanitizeCrmField)
    : []
  const text = (key: keyof CrmPlanDraft) =>
    safeText(value[key], TEXT_LIMITS[key] ?? 900)

  return {
    version: 1,
    organizationName: text("organizationName"),
    planName: text("planName"),
    stage,
    relationshipContext,
    reviewMonths,
    systemPurpose: text("systemPurpose"),
    peopleAndDecisions: text("peopleAndDecisions"),
    recordBoundary: text("recordBoundary"),
    collectionNoticeConsent: text("collectionNoticeConsent"),
    communicationPreferences: text("communicationPreferences"),
    identityDeduplication: text("identityDeduplication"),
    relationshipLifecycle: text("relationshipLifecycle"),
    accessRoles: text("accessRoles"),
    dataQualityCorrection: text("dataQualityCorrection"),
    retentionDeletion: text("retentionDeletion"),
    integrationsExports: text("integrationsExports"),
    securityIncident: text("securityIncident"),
    accessibilityLanguage: text("accessibilityLanguage"),
    reportingDecision: text("reportingDecision"),
    vendorMigration: text("vendorMigration"),
    fields: fields.length > 0 ? fields : [createCrmField()],
    hasMinimumNecessaryReview: value.hasMinimumNecessaryReview === true,
    hasNoticePreferenceReview: value.hasNoticePreferenceReview === true,
    hasAccessIntegrationReview: value.hasAccessIntegrationReview === true,
    hasRetentionIncidentReview: value.hasRetentionIncidentReview === true,
    hasLegalSectorReview: value.hasLegalSectorReview === true,
  }
}

const DRAFT_AREAS: Array<keyof CrmPlanDraft> = CRM_LIFECYCLE.flatMap(
  ({ fields }) => fields
)

function definedFields(draft: CrmPlanDraft) {
  return draft.fields.filter(({ label }) => label.trim())
}

function fieldIsComplete(field: CrmFieldDraft) {
  return Boolean(
    field.label.trim() &&
    field.purpose.trim() &&
    field.source.trim() &&
    field.accessRole.trim() &&
    field.retentionReview.trim()
  )
}

export function summarizeCrmPlan(draft: CrmPlanDraft): CrmPlanSummary {
  const fields = definedFields(draft)
  return {
    draftedAreaCount: DRAFT_AREAS.filter((key) => String(draft[key]).trim())
      .length,
    totalAreaCount: DRAFT_AREAS.length,
    lifecycleStepCount: CRM_LIFECYCLE.filter(({ fields: stepFields }) =>
      stepFields.every((field) => String(draft[field]).trim())
    ).length,
    totalLifecycleStepCount: CRM_LIFECYCLE.length,
    safeguardCount: [
      draft.hasMinimumNecessaryReview,
      draft.hasNoticePreferenceReview,
      draft.hasAccessIntegrationReview,
      draft.hasRetentionIncidentReview,
      draft.hasLegalSectorReview,
    ].filter(Boolean).length,
    totalSafeguardCount: 5,
    fieldCount: fields.length,
    completeFieldCount: fields.filter(fieldIsComplete).length,
    representedCategoryCount: new Set(fields.map(({ category }) => category))
      .size,
    highRiskFieldCount: fields.filter(
      ({ sensitivity }) => sensitivity === "high-risk"
    ).length,
  }
}

export function crmRelationshipContextLabel(context: CrmRelationshipContextId) {
  return (
    CRM_RELATIONSHIP_CONTEXTS.find(({ id }) => id === context)?.label ?? context
  )
}

export function crmFieldCategoryLabel(category: CrmFieldCategoryId) {
  return (
    CRM_FIELD_CATEGORIES.find(({ id }) => id === category)?.label ?? category
  )
}

export function crmFieldSensitivityLabel(sensitivity: CrmFieldSensitivityId) {
  return (
    CRM_FIELD_SENSITIVITY.find(({ id }) => id === sensitivity)?.label ??
    sensitivity
  )
}

const STAGE_ACTIONS: Record<DocumentationStageId, CrmPlanAction> = {
  exploring: {
    id: "stage-exploring",
    phase: "Define",
    action:
      "Start with one relationship context, one decision, the minimum useful fields, and a maintainable review rhythm before choosing software.",
    evidence:
      "Current record locations, responsible owner, decision need, generic field dictionary, access boundary, and a small test using fictional records.",
  },
  forming: {
    id: "stage-forming",
    phase: "Protect",
    action:
      "Document collection, notice, communication preference, access, correction, retention, export, backup, incident, and system-exit practices before migration.",
    evidence:
      "Approved field dictionary, role matrix, notice and suppression path, migration test, retention decisions, vendor review, and response owner.",
  },
  operating: {
    id: "stage-operating",
    phase: "Maintain",
    action:
      "Run a recurring data-quality and relationship-work review that resolves duplicates, stale records, open commitments, access drift, and failed integrations.",
    evidence:
      "Correction log, duplicate review, preference updates, access review, integration failures, completed follow-ups, unresolved commitments, and decisions.",
  },
  growing: {
    id: "stage-growing",
    phase: "Use",
    action:
      "Separate purposes and permissions across programs, fundraising, volunteers, partners, and campaigns while preserving shared governance and accountable reporting.",
    evidence:
      "Common taxonomy, purpose-specific views, delegated roles, audit evidence, vendor inventory, data-flow map, retention schedule, incident exercises, and portfolio decisions.",
  },
}

export function buildCrmActions(draft: CrmPlanDraft): CrmPlanAction[] {
  const actions: CrmPlanAction[] = [STAGE_ACTIONS[draft.stage]]
  for (const step of CRM_LIFECYCLE) {
    const missing = step.fields.filter(
      (field) => !String(draft[field]).trim()
    ).length
    if (!missing) continue
    actions.push({
      id: `lifecycle-${step.id.toLowerCase()}`,
      phase: step.id,
      action: `Complete the ${step.label.toLowerCase()} decisions before treating this lifecycle step as defined.`,
      evidence: `${missing} of ${step.fields.length} working areas remain open in this step.`,
    })
  }

  const fields = definedFields(draft)
  if (fields.length === 0 || fields.some((field) => !fieldIsComplete(field))) {
    actions.push({
      id: "field-dictionary",
      phase: "Field dictionary",
      action:
        "Define each proposed field’s purpose, source, sensitivity, access role, and retention review before collecting or migrating it.",
      evidence:
        fields.length === 0
          ? "No generic field definitions are named."
          : `${fields.filter((field) => !fieldIsComplete(field)).length} of ${fields.length} named fields remain incomplete.`,
    })
  }

  if (
    !draft.hasMinimumNecessaryReview ||
    !draft.hasNoticePreferenceReview ||
    !draft.hasAccessIntegrationReview ||
    !draft.hasRetentionIncidentReview ||
    !draft.hasLegalSectorReview
  ) {
    actions.push({
      id: "safeguards",
      phase: "Safeguards",
      action:
        "Complete the applicable human reviews before collecting, importing, combining, segmenting, exporting, sharing, contacting, archiving, or deleting records.",
      evidence:
        "Named reviewer, current source, review date, decision, limits, changes, approval record, and renewed-review trigger.",
    })
  }
  return actions
}

function csvCell(value: string | number | boolean) {
  return documentationCsvCell(value)
}

export function buildCrmCsv(draft: CrmPlanDraft) {
  const summary = summarizeCrmPlan(draft)
  const planRows: Array<Array<string | number | boolean>> = [
    [
      "Record",
      "Label",
      "Category",
      "Purpose or value",
      "Source",
      "Sensitivity",
      "Access role",
      "Retention review",
    ],
    ["Plan", "Organization", "", draft.organizationName, "", "", "", ""],
    ["Plan", "Plan name", "", draft.planName, "", "", "", ""],
    ["Plan", "Stage", "", draft.stage, "", "", "", ""],
    [
      "Plan",
      "Relationship context",
      "",
      crmRelationshipContextLabel(draft.relationshipContext),
      "",
      "",
      "",
      "",
    ],
    [
      "Plan",
      "Review interval",
      "",
      `${draft.reviewMonths} months`,
      "",
      "",
      "",
      "",
    ],
    ...DRAFT_AREAS.map((key) => [
      "Plan",
      key,
      "",
      String(draft[key]),
      "",
      "",
      "",
      "",
    ]),
    ...definedFields(draft).map((field) => [
      "Field",
      field.label,
      crmFieldCategoryLabel(field.category),
      field.purpose,
      field.source,
      crmFieldSensitivityLabel(field.sensitivity),
      field.accessRole,
      field.retentionReview,
    ]),
    [
      "Summary",
      "Defined operating areas",
      "",
      `${summary.draftedAreaCount}/${summary.totalAreaCount}`,
      "",
      "",
      "",
      "",
    ],
    [
      "Summary",
      "Complete field definitions",
      "",
      `${summary.completeFieldCount}/${summary.fieldCount}`,
      "",
      "",
      "",
      "",
    ],
  ]
  return `\uFEFF${planRows.map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`
}

export function buildCrmReviewPrompt(draft: CrmPlanDraft) {
  const summary = summarizeCrmPlan(draft)
  const fieldLines = definedFields(draft).map(
    (field, index) =>
      `Field ${index + 1}: label=${field.label || "Open"}; category=${crmFieldCategoryLabel(field.category)}; purpose=${field.purpose || "Open"}; source=${field.source || "Open"}; sensitivity=${crmFieldSensitivityLabel(field.sensitivity)}; access=${field.accessRole || "Open"}; retention review=${field.retentionReview || "Open"}`
  )
  return [
    "Review this working nonprofit CRM data-stewardship plan as a cautious planning assistant.",
    "Do not import, identify, enrich, merge, segment, rank, score, contact, message, solicit, disclose, export, delete, or make a legal, privacy, security, consent, accessibility, records, tax, fundraising, service, employment, education, health, or vendor determination.",
    "Do not invent people, relationships, records, consent, preferences, permissions, notices, sources, laws, retention periods, security controls, vendor features, integrations, costs, or results.",
    "Mark missing and uncertain information. Distinguish proposed fields from approved collection. Ask whether every field is necessary for a stated decision and whether a less sensitive alternative exists.",
    "Remove all real names, contact details, donor or payment data, case notes, health or service information, education records, demographic details, credentials, identifiers, protected reports, and other personal or sensitive information before using another service.",
    "Return: (1) purpose and decision summary, (2) lifecycle gaps, (3) field-by-field necessity questions, (4) notice and preference questions, (5) access, integration, retention, and incident questions, (6) vendor and migration questions, and (7) a human-review checklist. Preserve the team’s judgment.",
    "",
    `Organization: ${draft.organizationName || "Not provided"}`,
    `Plan: ${draft.planName || "Not provided"}`,
    `Stage: ${draft.stage}`,
    `Relationship context: ${crmRelationshipContextLabel(draft.relationshipContext)}`,
    `Review interval: ${draft.reviewMonths} months`,
    `Defined operating areas: ${summary.draftedAreaCount}/${summary.totalAreaCount}`,
    ...DRAFT_AREAS.map((key) => `${key}: ${draft[key] || "Open"}`),
    ...(fieldLines.length > 0
      ? fieldLines
      : ["Field dictionary: No fields named"]),
  ].join("\n")
}
