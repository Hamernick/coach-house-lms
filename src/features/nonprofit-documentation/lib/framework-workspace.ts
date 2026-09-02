import type {
  DocumentationStageId,
  FrameworkQuestionId,
  LogicModelAction,
  LogicModelDraft,
  LogicModelSummary,
  NonprofitFrameworkId,
} from "../types"

export const FRAMEWORK_WORKSPACE_STORAGE_KEY =
  "coach-house:documentation:framework-workspace:v1"

export const NONPROFIT_FRAMEWORKS: Array<{
  id: NonprofitFrameworkId
  title: string
  question: string
  description: string
  firstMove: string
  caution: string
}> = [
  {
    id: "systems-map",
    title: "Systems map",
    question: "What surrounds the problem?",
    description:
      "Map conditions, actors, relationships, incentives, constraints, and feedback before deciding where the program can contribute.",
    firstMove:
      "Invite people closest to the issue to name what shapes it and where your view is incomplete.",
    caution:
      "A map is a perspective, not a complete or neutral picture of the system.",
  },
  {
    id: "theory-of-change",
    title: "Theory of change",
    question: "How and why should change happen?",
    description:
      "State the expected pathway from action to near-term change and longer-term contribution, including the assumptions behind each link.",
    firstMove:
      "Draft an If, Then, So That statement and ask what must be true for each transition to hold.",
    caution:
      "A plausible explanation is still a hypothesis until evidence supports it.",
  },
  {
    id: "logic-model",
    title: "Logic model",
    question: "What will we invest, do, produce, and change?",
    description:
      "Connect resources and activities to direct outputs, sequenced outcomes, context, and measures in one reviewable program roadmap.",
    firstMove:
      "Work backward from the intended outcome, then test whether the planned activities can reasonably contribute to it.",
    caution:
      "A clean sequence can hide uncertainty, feedback, unequal effects, and external influences.",
  },
  {
    id: "responsibility-map",
    title: "Responsibility map",
    question: "Who owns and supports each decision?",
    description:
      "Name who owns the result, makes or approves decisions, contributes expertise, completes work, and needs timely information.",
    firstMove:
      "Choose one recurring decision or deliverable and assign one clear owner before mapping contributors.",
    caution:
      "A role chart cannot resolve unclear authority, missing capacity, or unsafe power dynamics by itself.",
  },
  {
    id: "learning-cycle",
    title: "Learning cycle",
    question: "What did we expect, observe, and change?",
    description:
      "Turn assumptions into focused questions, gather proportionate evidence, interpret it with affected people, and record the next decision.",
    firstMove:
      "Select one uncertain link in the pathway and define what evidence would change a decision.",
    caution:
      "Collecting more data is not learning unless someone is responsible for interpreting and using it.",
  },
]

export const FRAMEWORK_QUESTIONS: Array<{
  id: FrameworkQuestionId
  label: string
  description: string
  frameworkId: NonprofitFrameworkId
}> = [
  {
    id: "understand-system",
    label: "Understand a problem and its surrounding system",
    description:
      "Start before choosing an intervention or when important relationships and constraints are unclear.",
    frameworkId: "systems-map",
  },
  {
    id: "explain-change",
    label: "Explain how and why change should happen",
    description:
      "Make the causal hypothesis and its assumptions explicit for strategy, alignment, or a proposal.",
    frameworkId: "theory-of-change",
  },
  {
    id: "plan-program",
    label: "Connect a program plan to intended outcomes",
    description:
      "Organize resources, activities, direct products, outcomes, and evidence for implementation or evaluation.",
    frameworkId: "logic-model",
  },
  {
    id: "clarify-ownership",
    label: "Clarify ownership and decision roles",
    description:
      "Use when work stalls because responsibility, approval, contribution, or communication is ambiguous.",
    frameworkId: "responsibility-map",
  },
  {
    id: "learn-and-adapt",
    label: "Review evidence and adapt the work",
    description:
      "Use during piloting or delivery when the team must compare expectations with observations and decide what changes.",
    frameworkId: "learning-cycle",
  },
]

export const DEFAULT_LOGIC_MODEL_DRAFT: LogicModelDraft = {
  version: 1,
  organizationName: "",
  programName: "",
  stage: "exploring",
  primaryQuestion: "plan-program",
  need: "",
  people: "",
  inputs: "",
  activities: "",
  outputs: "",
  nearTermOutcomes: "",
  intermediateOutcomes: "",
  longTermContribution: "",
  assumptions: "",
  context: "",
  learningQuestion: "",
}

const STAGES: DocumentationStageId[] = [
  "exploring",
  "forming",
  "operating",
  "growing",
]
const QUESTIONS = FRAMEWORK_QUESTIONS.map(({ id }) => id)
const CONTENT_KEYS: Array<keyof LogicModelDraft> = [
  "need",
  "people",
  "inputs",
  "activities",
  "outputs",
  "nearTermOutcomes",
  "intermediateOutcomes",
  "longTermContribution",
  "assumptions",
  "context",
  "learningQuestion",
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function safeText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : ""
}

export function sanitizeLogicModelDraft(value: unknown): LogicModelDraft {
  if (!isRecord(value)) return DEFAULT_LOGIC_MODEL_DRAFT
  const stage = STAGES.includes(value.stage as DocumentationStageId)
    ? (value.stage as DocumentationStageId)
    : DEFAULT_LOGIC_MODEL_DRAFT.stage
  const primaryQuestion = QUESTIONS.includes(
    value.primaryQuestion as FrameworkQuestionId
  )
    ? (value.primaryQuestion as FrameworkQuestionId)
    : DEFAULT_LOGIC_MODEL_DRAFT.primaryQuestion

  return {
    version: 1,
    organizationName: safeText(value.organizationName, 120),
    programName: safeText(value.programName, 120),
    stage,
    primaryQuestion,
    need: safeText(value.need, 800),
    people: safeText(value.people, 500),
    inputs: safeText(value.inputs, 800),
    activities: safeText(value.activities, 800),
    outputs: safeText(value.outputs, 800),
    nearTermOutcomes: safeText(value.nearTermOutcomes, 800),
    intermediateOutcomes: safeText(value.intermediateOutcomes, 800),
    longTermContribution: safeText(value.longTermContribution, 800),
    assumptions: safeText(value.assumptions, 1000),
    context: safeText(value.context, 1000),
    learningQuestion: safeText(value.learningQuestion, 800),
  }
}

export function recommendedFramework(question: FrameworkQuestionId) {
  const frameworkId =
    FRAMEWORK_QUESTIONS.find(({ id }) => id === question)?.frameworkId ??
    "logic-model"
  return (
    NONPROFIT_FRAMEWORKS.find(({ id }) => id === frameworkId) ??
    NONPROFIT_FRAMEWORKS[2]
  )
}

export function summarizeLogicModel(draft: LogicModelDraft): LogicModelSummary {
  const draftedAreaCount = CONTENT_KEYS.filter((key) => draft[key]).length
  const causalPairs: Array<[keyof LogicModelDraft, keyof LogicModelDraft]> = [
    ["inputs", "activities"],
    ["activities", "outputs"],
    ["outputs", "nearTermOutcomes"],
    ["nearTermOutcomes", "intermediateOutcomes"],
    ["intermediateOutcomes", "longTermContribution"],
  ]
  const causalLinkCount = causalPairs.filter(
    ([from, to]) => draft[from] && draft[to]
  ).length

  return {
    draftedAreaCount,
    totalAreaCount: CONTENT_KEYS.length,
    causalLinkCount,
    hasCompletePathway: [
      draft.activities,
      draft.outputs,
      draft.nearTermOutcomes,
      draft.intermediateOutcomes,
      draft.longTermContribution,
    ].every(Boolean),
  }
}

const STAGE_ACTIONS: Record<DocumentationStageId, LogicModelAction[]> = {
  exploring: [
    {
      id: "exploring-listen",
      phase: "Context",
      action:
        "Build the first map with people closest to the issue before narrowing to one intervention.",
      evidence:
        "Multiple perspectives, points of disagreement, known exclusions, unanswered questions, and a record of who participated.",
    },
  ],
  forming: [
    {
      id: "forming-align",
      phase: "Pathway",
      action:
        "Test the pathway against the need statement, mission, program design, budget, and responsibilities.",
      evidence:
        "A versioned model with named owners, assumptions, resource requirements, and unresolved links.",
    },
  ],
  operating: [
    {
      id: "operating-compare",
      phase: "Evidence",
      action:
        "Compare planned activities and outputs with actual delivery before interpreting outcomes.",
      evidence:
        "Defined implementation records, output counts, outcome evidence, context notes, and documented program decisions.",
    },
  ],
  growing: [
    {
      id: "growing-revise",
      phase: "Governance",
      action:
        "Set a shared review cadence so teams can revise models without silently changing definitions or claims.",
      evidence:
        "Model owners, version history, decision log, evidence definitions, review dates, and approved changes across programs.",
    },
  ],
}

export function buildLogicModelActions(
  draft: LogicModelDraft
): LogicModelAction[] {
  const actions = [...STAGE_ACTIONS[draft.stage]]
  const framework = recommendedFramework(draft.primaryQuestion)

  actions.push({
    id: `framework-${framework.id}`,
    phase: framework.id === "responsibility-map" ? "Governance" : "Pathway",
    action: framework.firstMove,
    evidence: `Keep the working ${framework.title.toLowerCase()}, participant notes, open questions, and revision date.`,
  })

  if (!draft.need || !draft.people) {
    actions.push({
      id: "missing-context",
      phase: "Context",
      action:
        "Describe the specific need and people affected before completing the program pathway.",
      evidence:
        "A sourced need statement, community perspective, scope, location or population context, and explicit evidence limits.",
    })
  }
  if (!draft.inputs || !draft.activities) {
    actions.push({
      id: "missing-delivery",
      phase: "Pathway",
      action:
        "Name the resources the program actually has and the activities participants will experience.",
      evidence:
        "Staff, partners, funding, facilities, materials, evidence base, activity description, dose, access conditions, and owner.",
    })
  }
  if (!draft.outputs || !draft.nearTermOutcomes) {
    actions.push({
      id: "missing-distinction",
      phase: "Pathway",
      action:
        "Separate direct products of the work from changes expected for people, organizations, or conditions.",
      evidence:
        "Output definitions and near-term outcome statements with distinct units, timing, and responsible data source.",
    })
  }
  if (!draft.assumptions || !draft.context) {
    actions.push({
      id: "missing-assumptions",
      phase: "Context",
      action:
        "Name what must be true and which external conditions could support, weaken, or change the pathway.",
      evidence:
        "Testable assumptions, contrary evidence, contextual factors, risks, dependencies, and conditions outside program control.",
    })
  }
  if (!draft.learningQuestion) {
    actions.push({
      id: "missing-learning",
      phase: "Evidence",
      action:
        "Choose one uncertain link and ask a focused question whose answer could change a decision.",
      evidence:
        "Question, intended user, decision, feasible evidence, collection responsibility, interpretation date, and action threshold.",
    })
  }

  return actions.slice(0, 6)
}

function csvCell(value: string | number | boolean) {
  let text = String(value)
  if (/^[=+\-@]/.test(text)) text = `'${text}`
  return `"${text.replaceAll('"', '""')}"`
}

export function buildLogicModelCsv(draft: LogicModelDraft) {
  const framework = recommendedFramework(draft.primaryQuestion)
  const rows: Array<[string, string]> = [
    ["Organization", draft.organizationName],
    ["Program", draft.programName],
    ["Stage", draft.stage],
    ["Primary planning question", draft.primaryQuestion],
    ["Recommended starting framework", framework.title],
    ["Need", draft.need],
    ["People affected", draft.people],
    ["Inputs", draft.inputs],
    ["Activities", draft.activities],
    ["Outputs", draft.outputs],
    ["Near-term outcomes", draft.nearTermOutcomes],
    ["Intermediate outcomes", draft.intermediateOutcomes],
    ["Long-term contribution", draft.longTermContribution],
    ["Assumptions", draft.assumptions],
    ["Contextual factors", draft.context],
    ["Learning question", draft.learningQuestion],
  ]
  const actionRows = buildLogicModelActions(draft).map((item, index) => [
    `Action ${index + 1} — ${item.phase}`,
    `${item.action} Keep: ${item.evidence}`,
  ])

  return [
    ["Area", "Working draft"].map(csvCell).join(","),
    ...[...rows, ...actionRows].map((row) => row.map(csvCell).join(",")),
  ].join("\n")
}

export function buildLogicModelReviewPrompt(draft: LogicModelDraft) {
  const framework = recommendedFramework(draft.primaryQuestion)
  return `You are reviewing a nonprofit program framework. Treat every entry below as an unverified working hypothesis, not established fact.

Do not invent facts, statistics, quotes, outcomes, causal relationships, community agreement, evidence, dates, partners, resources, or permissions. Mark missing information as [NEEDS HUMAN INPUT]. Preserve uncertainty and distinctions between activities, outputs, outcomes, and long-term contribution.

Starting framework: ${framework.title}
Organization: ${draft.organizationName || "[NEEDS HUMAN INPUT]"}
Program: ${draft.programName || "[NEEDS HUMAN INPUT]"}
Stage: ${draft.stage}
Need: ${draft.need || "[NEEDS HUMAN INPUT]"}
People affected: ${draft.people || "[NEEDS HUMAN INPUT]"}
Inputs: ${draft.inputs || "[NEEDS HUMAN INPUT]"}
Activities: ${draft.activities || "[NEEDS HUMAN INPUT]"}
Outputs: ${draft.outputs || "[NEEDS HUMAN INPUT]"}
Near-term outcomes: ${draft.nearTermOutcomes || "[NEEDS HUMAN INPUT]"}
Intermediate outcomes: ${draft.intermediateOutcomes || "[NEEDS HUMAN INPUT]"}
Long-term contribution: ${draft.longTermContribution || "[NEEDS HUMAN INPUT]"}
Assumptions: ${draft.assumptions || "[NEEDS HUMAN INPUT]"}
Contextual factors: ${draft.context || "[NEEDS HUMAN INPUT]"}
Learning question: ${draft.learningQuestion || "[NEEDS HUMAN INPUT]"}

Return:
1. A concise restatement of the proposed pathway without strengthening any claim.
2. A list of missing or ambiguous links.
3. Assumptions that need community input, research, piloting, or operational verification.
4. Places where an output is confused with an outcome.
5. Five questions for a human review meeting.

End with: This review does not validate causality, effectiveness, feasibility, community agreement, or impact.`
}
