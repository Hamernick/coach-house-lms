import type {
  DocumentationStageId,
  MeasurementDecisionId,
  MeasurementMethodId,
  MeasurementOutcomeLevel,
  MeasurementPlanAction,
  MeasurementPlanDraft,
  MeasurementPlanSummary,
} from "../types"

export const MEASUREMENT_PLAN_STORAGE_KEY =
  "coach-house:documentation:measurement-plan:v1"

export const MEASUREMENT_DECISIONS: Array<{
  id: MeasurementDecisionId
  label: string
  description: string
}> = [
  {
    id: "improve-delivery",
    label: "Improve delivery",
    description: "Change how the program is implemented or experienced.",
  },
  {
    id: "understand-reach",
    label: "Understand reach and access",
    description: "Learn who participates, who does not, and why.",
  },
  {
    id: "assess-near-term-outcome",
    label: "Assess a near-term outcome",
    description: "Examine an early change after participation.",
  },
  {
    id: "assess-intermediate-outcome",
    label: "Assess an intermediate outcome",
    description: "Examine a later change in behavior, practice, or condition.",
  },
  {
    id: "report-accountability",
    label: "Report and account for results",
    description: "Answer a defined governance, partner, or funder question.",
  },
  {
    id: "consider-expansion",
    label: "Consider expansion",
    description: "Decide whether, where, or how the work should grow.",
  },
]

export const MEASUREMENT_OUTCOME_LEVELS: Array<{
  id: MeasurementOutcomeLevel
  label: string
}> = [
  { id: "implementation", label: "Implementation or process" },
  { id: "output", label: "Direct output" },
  { id: "near-term", label: "Near-term outcome" },
  { id: "intermediate", label: "Intermediate outcome" },
  { id: "long-term-contribution", label: "Long-term contribution" },
]

export const MEASUREMENT_METHODS: Array<{
  id: MeasurementMethodId
  label: string
}> = [
  { id: "administrative-records", label: "Administrative records" },
  { id: "survey", label: "Survey or questionnaire" },
  { id: "interview-listening", label: "Interviews or listening sessions" },
  { id: "observation", label: "Structured observation" },
  { id: "partner-data", label: "Partner-held data" },
  { id: "public-data", label: "Public or population data" },
  { id: "mixed-methods", label: "Mixed methods" },
]

export const DEFAULT_MEASUREMENT_PLAN: MeasurementPlanDraft = {
  version: 1,
  organizationName: "",
  programName: "",
  stage: "exploring",
  decision: "improve-delivery",
  outcomeLevel: "near-term",
  outcomeStatement: "",
  evaluationQuestion: "",
  indicatorDefinition: "",
  method: "administrative-records",
  dataSource: "",
  collectionSchedule: "",
  expectedRespondents: 0,
  minutesPerResponse: 0,
  cyclesPerYear: 0,
  disaggregationPlan: "",
  limitations: "",
  owner: "",
  actionRule: "",
  hasDataMinimizationReview: false,
  hasAccessibleVoluntaryProcess: false,
  hasParticipantInterpretation: false,
}

const STAGES: DocumentationStageId[] = [
  "exploring",
  "forming",
  "operating",
  "growing",
]
const DECISIONS = MEASUREMENT_DECISIONS.map(({ id }) => id)
const OUTCOME_LEVELS = MEASUREMENT_OUTCOME_LEVELS.map(({ id }) => id)
const METHODS = MEASUREMENT_METHODS.map(({ id }) => id)
const DRAFTED_KEYS: Array<keyof MeasurementPlanDraft> = [
  "outcomeStatement",
  "evaluationQuestion",
  "indicatorDefinition",
  "dataSource",
  "collectionSchedule",
  "disaggregationPlan",
  "limitations",
  "actionRule",
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function safeText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : ""
}

function safeInteger(value: unknown, maximum: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 0
  return Math.min(maximum, Math.max(0, Math.round(parsed)))
}

export function sanitizeMeasurementPlan(value: unknown): MeasurementPlanDraft {
  if (!isRecord(value)) return DEFAULT_MEASUREMENT_PLAN
  return {
    version: 1,
    organizationName: safeText(value.organizationName, 120),
    programName: safeText(value.programName, 120),
    stage: STAGES.includes(value.stage as DocumentationStageId)
      ? (value.stage as DocumentationStageId)
      : DEFAULT_MEASUREMENT_PLAN.stage,
    decision: DECISIONS.includes(value.decision as MeasurementDecisionId)
      ? (value.decision as MeasurementDecisionId)
      : DEFAULT_MEASUREMENT_PLAN.decision,
    outcomeLevel: OUTCOME_LEVELS.includes(
      value.outcomeLevel as MeasurementOutcomeLevel
    )
      ? (value.outcomeLevel as MeasurementOutcomeLevel)
      : DEFAULT_MEASUREMENT_PLAN.outcomeLevel,
    outcomeStatement: safeText(value.outcomeStatement, 800),
    evaluationQuestion: safeText(value.evaluationQuestion, 800),
    indicatorDefinition: safeText(value.indicatorDefinition, 1000),
    method: METHODS.includes(value.method as MeasurementMethodId)
      ? (value.method as MeasurementMethodId)
      : DEFAULT_MEASUREMENT_PLAN.method,
    dataSource: safeText(value.dataSource, 800),
    collectionSchedule: safeText(value.collectionSchedule, 500),
    expectedRespondents: safeInteger(value.expectedRespondents, 1_000_000),
    minutesPerResponse: safeInteger(value.minutesPerResponse, 1_440),
    cyclesPerYear: safeInteger(value.cyclesPerYear, 365),
    disaggregationPlan: safeText(value.disaggregationPlan, 1000),
    limitations: safeText(value.limitations, 1000),
    owner: safeText(value.owner, 200),
    actionRule: safeText(value.actionRule, 1000),
    hasDataMinimizationReview: value.hasDataMinimizationReview === true,
    hasAccessibleVoluntaryProcess: value.hasAccessibleVoluntaryProcess === true,
    hasParticipantInterpretation: value.hasParticipantInterpretation === true,
  }
}

export function measurementDecisionLabel(decision: MeasurementDecisionId) {
  return (
    MEASUREMENT_DECISIONS.find(({ id }) => id === decision)?.label ??
    "Improve delivery"
  )
}

export function measurementMethodLabel(method: MeasurementMethodId) {
  return (
    MEASUREMENT_METHODS.find(({ id }) => id === method)?.label ??
    "Administrative records"
  )
}

export function measurementOutcomeLabel(level: MeasurementOutcomeLevel) {
  return (
    MEASUREMENT_OUTCOME_LEVELS.find(({ id }) => id === level)?.label ??
    "Near-term outcome"
  )
}

export function summarizeMeasurementPlan(
  draft: MeasurementPlanDraft
): MeasurementPlanSummary {
  const annualResponses = draft.expectedRespondents * draft.cyclesPerYear
  const annualRespondentHours =
    Math.round(((annualResponses * draft.minutesPerResponse) / 60) * 10) / 10
  const draftedAreaCount = DRAFTED_KEYS.filter((key) =>
    String(draft[key]).trim()
  ).length
  return {
    draftedAreaCount,
    totalAreaCount: DRAFTED_KEYS.length,
    annualResponses,
    annualRespondentHours,
    hasDecisionReadyChain: Boolean(
      draft.outcomeStatement &&
      draft.evaluationQuestion &&
      draft.indicatorDefinition &&
      draft.dataSource &&
      draft.owner &&
      draft.actionRule
    ),
  }
}

const STAGE_ACTIONS: Record<
  DocumentationStageId,
  Omit<MeasurementPlanAction, "id">
> = {
  exploring: {
    phase: "Purpose",
    action:
      "Validate the intended change and evaluation purpose with people affected before selecting more measures.",
    evidence:
      "Keep dated notes showing who shaped the outcome, which perspectives are missing, and what changed.",
  },
  forming: {
    phase: "Evidence",
    action:
      "Pilot the definition and collection method on a small scale before using the result for a consequential claim.",
    evidence:
      "Keep the tested instrument, comprehension and access notes, missingness, time burden, revisions, and approval.",
  },
  operating: {
    phase: "Use",
    action:
      "Review implementation and outcome evidence together, then document one adaptation or reason to continue unchanged.",
    evidence:
      "Keep the finding, limitation, interpretation, participant input, decision, owner, and next review date.",
  },
  growing: {
    phase: "Definition",
    action:
      "Standardize core definitions and governance while preserving site, population, and delivery context.",
    evidence:
      "Keep the data dictionary, version history, access and retention rules, site variations, and claim-review record.",
  },
}

export function buildMeasurementPlanActions(
  draft: MeasurementPlanDraft
): MeasurementPlanAction[] {
  const actions: MeasurementPlanAction[] = [
    { id: `stage-${draft.stage}`, ...STAGE_ACTIONS[draft.stage] },
  ]
  if (!draft.outcomeStatement || !draft.evaluationQuestion) {
    actions.push({
      id: "define-question",
      phase: "Definition",
      action:
        "Define one outcome and one answerable evaluation question before selecting an instrument.",
      evidence:
        "Keep the outcome definition, question, intended user, intended use, timeframe, and program-pathway link.",
    })
  }
  if (!draft.indicatorDefinition || !draft.dataSource) {
    actions.push({
      id: "specify-evidence",
      phase: "Evidence",
      action:
        "Specify the indicator, source, population, timeframe, calculation or coding method, and exclusions.",
      evidence:
        "Keep a versioned indicator definition and collection protocol that another person could follow.",
    })
  }
  if (
    !draft.hasDataMinimizationReview ||
    !draft.hasAccessibleVoluntaryProcess ||
    !draft.hasParticipantInterpretation
  ) {
    actions.push({
      id: "review-safeguards",
      phase: "Ethics",
      action:
        "Complete the collection, access, participation, and interpretation safeguards before gathering new information.",
      evidence:
        "Keep the necessity review, consent and access process, privacy and retention decisions, and interpretation plan.",
    })
  }
  if (!draft.owner || !draft.actionRule) {
    actions.push({
      id: "plan-use",
      phase: "Use",
      action:
        "Assign an owner and state how different findings could change a real decision.",
      evidence:
        "Keep the decision rule, authority, review date, communication plan, and resulting decision record.",
    })
  }
  return actions
}

function safeCsvCell(value: string | number | boolean) {
  const text = String(value)
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text
  return `"${safe.replaceAll('"', '""')}"`
}

export function buildMeasurementPlanCsv(draft: MeasurementPlanDraft) {
  const summary = summarizeMeasurementPlan(draft)
  const rows: Array<[string, string | number | boolean]> = [
    ["Organization", draft.organizationName],
    ["Program", draft.programName],
    ["Organization stage", draft.stage],
    ["Intended decision", measurementDecisionLabel(draft.decision)],
    ["Outcome level", measurementOutcomeLabel(draft.outcomeLevel)],
    ["Outcome statement", draft.outcomeStatement],
    ["Evaluation question", draft.evaluationQuestion],
    ["Indicator definition", draft.indicatorDefinition],
    ["Method", measurementMethodLabel(draft.method)],
    ["Data source and protocol", draft.dataSource],
    ["Collection schedule", draft.collectionSchedule],
    ["Expected respondents per cycle", draft.expectedRespondents],
    ["Minutes per response", draft.minutesPerResponse],
    ["Cycles per year", draft.cyclesPerYear],
    ["Estimated annual responses", summary.annualResponses],
    ["Estimated annual respondent hours", summary.annualRespondentHours],
    ["Disaggregation and access plan", draft.disaggregationPlan],
    ["Limitations", draft.limitations],
    ["Owner", draft.owner],
    ["Decision and action rule", draft.actionRule],
    ["Data minimization reviewed", draft.hasDataMinimizationReview],
    ["Accessible and voluntary process", draft.hasAccessibleVoluntaryProcess],
    ["Participant interpretation planned", draft.hasParticipantInterpretation],
  ]
  return [
    '"Area","Working plan"',
    ...rows.map((row) => row.map(safeCsvCell).join(",")),
  ].join("\n")
}

export function buildMeasurementReviewPrompt(draft: MeasurementPlanDraft) {
  const summary = summarizeMeasurementPlan(draft)
  return `You are reviewing a nonprofit measurement plan. Treat every entry below as an unverified working draft, not established fact.

Do not invent facts, statistics, definitions, baselines, benchmarks, targets, participant views, findings, outcomes, causal relationships, permissions, or compliance conclusions. Mark missing information as [NEEDS HUMAN INPUT]. Do not strengthen contribution language into attribution.

Organization: ${draft.organizationName || "[NEEDS HUMAN INPUT]"}
Program: ${draft.programName || "[NEEDS HUMAN INPUT]"}
Stage: ${draft.stage}
Intended decision: ${measurementDecisionLabel(draft.decision)}
Outcome level: ${measurementOutcomeLabel(draft.outcomeLevel)}
Outcome statement: ${draft.outcomeStatement || "[NEEDS HUMAN INPUT]"}
Evaluation question: ${draft.evaluationQuestion || "[NEEDS HUMAN INPUT]"}
Indicator definition: ${draft.indicatorDefinition || "[NEEDS HUMAN INPUT]"}
Method: ${measurementMethodLabel(draft.method)}
Data source and protocol: ${draft.dataSource || "[NEEDS HUMAN INPUT]"}
Collection schedule: ${draft.collectionSchedule || "[NEEDS HUMAN INPUT]"}
Estimated annual response volume: ${summary.annualResponses}
Estimated annual respondent burden: ${summary.annualRespondentHours} hours
Disaggregation and access plan: ${draft.disaggregationPlan || "[NEEDS HUMAN INPUT]"}
Known limitations: ${draft.limitations || "[NEEDS HUMAN INPUT]"}
Owner: ${draft.owner || "[NEEDS HUMAN INPUT]"}
Decision and action rule: ${draft.actionRule || "[NEEDS HUMAN INPUT]"}
Data minimization reviewed: ${draft.hasDataMinimizationReview ? "yes" : "no"}
Accessible and voluntary process planned: ${draft.hasAccessibleVoluntaryProcess ? "yes" : "no"}
Participant interpretation planned: ${draft.hasParticipantInterpretation ? "yes" : "no"}

Return:
1. A concise restatement of the question, indicator, method, and intended use without strengthening any claim.
2. Missing definitions, data-quality risks, and feasibility concerns.
3. Participant burden, privacy, access, power, and interpretation questions for human review.
4. Plausible alternative explanations and limitations that should accompany any result.
5. Five questions for a review meeting and one smallest responsible next test.

End with: This review does not validate the method, data, causality, effectiveness, consent, legal compliance, or impact.`
}
