import type {
  DocumentationStageId,
  FundraisingChannelId,
  FundraisingPlanAction,
  FundraisingPlanDraft,
  FundraisingPlanSummary,
} from "../types"

export const FUNDRAISING_PLAN_STORAGE_KEY =
  "coach-house:documentation:fundraising-plan:v1"

export const FUNDRAISING_CHANNELS: Array<{
  id: FundraisingChannelId
  label: string
  description: string
}> = [
  {
    id: "individuals",
    label: "Individual donors",
    description:
      "Personal outreach, recurring gifts, major gifts, and public appeals.",
  },
  {
    id: "foundations",
    label: "Foundations",
    description: "Private, family, community, and corporate foundation grants.",
  },
  {
    id: "government",
    label: "Government grants",
    description: "Federal, state, local, or tribal funding opportunities.",
  },
  {
    id: "corporate",
    label: "Corporate support",
    description:
      "Charitable gifts, sponsorships, matching gifts, and partnerships.",
  },
  {
    id: "events",
    label: "Events and peer campaigns",
    description:
      "Gatherings, community campaigns, and supporter-led fundraising.",
  },
]

export const DEFAULT_FUNDRAISING_PLAN: FundraisingPlanDraft = {
  version: 1,
  organizationName: "",
  stage: "exploring",
  periodMonths: 12,
  fundingGoal: 0,
  committedFunds: 0,
  channelTargets: {
    individuals: 0,
    foundations: 0,
    government: 0,
    corporate: 0,
    events: 0,
  },
  hasCaseForSupport: false,
  hasGiftAcknowledgmentProcess: false,
}

const STAGES: DocumentationStageId[] = [
  "exploring",
  "forming",
  "operating",
  "growing",
]
const PERIODS = [3, 6, 12, 18] as const

function safeMoney(value: unknown) {
  const amount = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(amount)) return 0
  return Math.min(1_000_000_000, Math.max(0, Math.round(amount * 100) / 100))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

export function sanitizeFundraisingPlan(value: unknown): FundraisingPlanDraft {
  if (!isRecord(value)) return DEFAULT_FUNDRAISING_PLAN
  const rawTargets = isRecord(value.channelTargets) ? value.channelTargets : {}
  const stage = STAGES.includes(value.stage as DocumentationStageId)
    ? (value.stage as DocumentationStageId)
    : DEFAULT_FUNDRAISING_PLAN.stage
  const periodMonths = PERIODS.includes(
    value.periodMonths as (typeof PERIODS)[number]
  )
    ? (value.periodMonths as FundraisingPlanDraft["periodMonths"])
    : DEFAULT_FUNDRAISING_PLAN.periodMonths

  return {
    version: 1,
    organizationName:
      typeof value.organizationName === "string"
        ? value.organizationName.trim().slice(0, 120)
        : "",
    stage,
    periodMonths,
    fundingGoal: safeMoney(value.fundingGoal),
    committedFunds: safeMoney(value.committedFunds),
    channelTargets: Object.fromEntries(
      FUNDRAISING_CHANNELS.map(({ id }) => [id, safeMoney(rawTargets[id])])
    ) as FundraisingPlanDraft["channelTargets"],
    hasCaseForSupport: value.hasCaseForSupport === true,
    hasGiftAcknowledgmentProcess: value.hasGiftAcknowledgmentProcess === true,
  }
}

export function summarizeFundraisingPlan(
  draft: FundraisingPlanDraft
): FundraisingPlanSummary {
  const fundingNeed = Math.max(0, draft.fundingGoal - draft.committedFunds)
  const plannedTotal = Object.values(draft.channelTargets).reduce(
    (total, amount) => total + amount,
    0
  )
  return {
    fundingNeed,
    plannedTotal,
    remainingGap: Math.max(0, fundingNeed - plannedTotal),
    overplannedAmount: Math.max(0, plannedTotal - fundingNeed),
    monthlyPace: fundingNeed / draft.periodMonths,
  }
}

const STAGE_ACTIONS: Record<DocumentationStageId, FundraisingPlanAction[]> = {
  exploring: [
    {
      id: "exploring-need",
      phase: "Foundation",
      action:
        "Test whether the funding need belongs in a new nonprofit, a fiscally sponsored project, or an existing partner program.",
      evidence:
        "A written comparison of structure, cost, timing, decision rights, and fundraising constraints.",
    },
    {
      id: "exploring-listening",
      phase: "Relationships",
      action:
        "Hold listening conversations before treating possible supporters as a revenue pipeline.",
      evidence:
        "Conversation notes capturing community priorities, questions, introductions, and explicit next steps.",
    },
  ],
  forming: [
    {
      id: "forming-budget",
      phase: "Foundation",
      action:
        "Connect the fundraising goal to an approved program and operating budget, including fundraising costs.",
      evidence:
        "A dated budget showing committed revenue, funding need, assumptions, and responsible reviewers.",
    },
    {
      id: "forming-roles",
      phase: "Systems",
      action:
        "Define who may solicit, approve proposals, accept restrictions, process gifts, and access donor information.",
      evidence:
        "Board-approved roles, account permissions, review steps, and escalation contacts.",
    },
  ],
  operating: [
    {
      id: "operating-review",
      phase: "Systems",
      action:
        "Review the relationship and opportunity pipeline on a consistent cadence without counting uncommitted prospects as revenue.",
      evidence:
        "A dated pipeline with stage, owner, next action, expected decision date, amount, and restriction notes.",
    },
    {
      id: "operating-reconcile",
      phase: "Stewardship",
      action:
        "Reconcile fundraising records with accounting, acknowledgments, restrictions, and promised reports.",
      evidence:
        "Monthly exception review covering missing receipts, coding differences, restrictions, and overdue reports.",
    },
  ],
  growing: [
    {
      id: "growing-portfolio",
      phase: "Relationships",
      action:
        "Assign relationship portfolios and channel ownership without making donor knowledge dependent on one person.",
      evidence:
        "Documented ownership, backup access, contact preferences, next actions, and portfolio review dates.",
    },
    {
      id: "growing-risk",
      phase: "Systems",
      action:
        "Review concentration, restricted-revenue exposure, renewal timing, and reporting capacity before expanding goals.",
      evidence:
        "A board-visible revenue-risk review tied to cash planning and program commitments.",
    },
  ],
}

const CHANNEL_ACTIONS: Record<FundraisingChannelId, FundraisingPlanAction> = {
  individuals: {
    id: "channel-individuals",
    phase: "Relationships",
    action:
      "Map known people by relationship stage and choose the next five to ten consent-based conversations.",
    evidence:
      "Name, relationship context, stage, communication preference, next action, owner, and target date.",
  },
  foundations: {
    id: "channel-foundations",
    phase: "Ask",
    action:
      "Screen foundation opportunities for mission, geography, eligibility, amount, timing, restrictions, and reporting fit before writing.",
    evidence:
      "A go or no-go record linked to the funder guidance, deadline, relationship path, and required attachments.",
  },
  government: {
    id: "channel-government",
    phase: "Systems",
    action:
      "Confirm registrations, authorized submitters, eligibility, match requirements, budget rules, and post-award capacity before applying.",
    evidence:
      "Registration status, opportunity notice, compliance checklist, approvals, submission receipt, and reporting calendar.",
  },
  corporate: {
    id: "channel-corporate",
    phase: "Relationships",
    action:
      "Separate charitable gifts from sponsorship or marketing value and build a specific mission and community fit for each prospect.",
    evidence:
      "Prospect fit, relationship path, proposed value exchange, tax review questions, decision process, and next action.",
  },
  events: {
    id: "channel-events",
    phase: "Ask",
    action:
      "Define the event’s purpose, full cost, audience, follow-up path, and treatment of benefits before setting a gross-revenue goal.",
    evidence:
      "Gross and net budget, staff time, attendee consent, benefit valuation, acknowledgment plan, and post-event follow-up list.",
  },
}

export function buildFundraisingActions(
  draft: FundraisingPlanDraft
): FundraisingPlanAction[] {
  const actions = [...STAGE_ACTIONS[draft.stage]]
  if (!draft.hasCaseForSupport) {
    actions.push({
      id: "case-for-support",
      phase: "Foundation",
      action:
        "Write a case for support in the organization’s own voice before adapting it for different audiences or using AI.",
      evidence:
        "A source draft covering the need, affected people, response, evidence, budget, invitation, and truthful limits.",
    })
  }
  for (const { id } of FUNDRAISING_CHANNELS) {
    if (draft.channelTargets[id] > 0) actions.push(CHANNEL_ACTIONS[id])
  }
  if (!draft.hasGiftAcknowledgmentProcess) {
    actions.push({
      id: "gift-acknowledgment",
      phase: "Stewardship",
      action:
        "Create a timely gift acknowledgment and disclosure process before accepting contributions at scale.",
      evidence:
        "Approved templates, donor-preference fields, responsible owner, delivery record, and escalation for unusual gifts.",
    })
  }
  return actions
}

function csvCell(value: string | number) {
  let text = String(value)
  if (/^[=+\-@]/.test(text)) text = `'${text}`
  return `"${text.replaceAll('"', '""')}"`
}

export function buildFundraisingCsv(draft: FundraisingPlanDraft) {
  const summary = summarizeFundraisingPlan(draft)
  const rows: Array<Array<string | number>> = [
    ["Organization", draft.organizationName || "Untitled organization"],
    ["Stage", draft.stage],
    ["Planning period months", draft.periodMonths],
    ["Total funding goal", draft.fundingGoal],
    ["Committed funds", draft.committedFunds],
    ["Fundraising need", summary.fundingNeed],
    ["Planned channel total", summary.plannedTotal],
    ["Remaining gap", summary.remainingGap],
    [],
    ["Channel", "Planned amount", "Share of fundraising need"],
    ...FUNDRAISING_CHANNELS.map(({ id, label }) => [
      label,
      draft.channelTargets[id],
      summary.fundingNeed > 0
        ? `${((draft.channelTargets[id] / summary.fundingNeed) * 100).toFixed(1)}%`
        : "0.0%",
    ]),
    [],
    ["Action phase", "Action", "Evidence"],
    ...buildFundraisingActions(draft).map((item) => [
      item.phase,
      item.action,
      item.evidence,
    ]),
  ]
  return rows.map((row) => row.map(csvCell).join(",")).join("\n")
}
