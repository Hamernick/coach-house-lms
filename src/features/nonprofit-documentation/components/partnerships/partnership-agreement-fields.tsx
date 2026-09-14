import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import type { PartnershipBriefDraft } from "../../types"
import type { UpdatePartnershipDraft } from "./partnership-brief-fields"

type TextKey =
  | "sharedPurpose"
  | "communityRole"
  | "organizationContribution"
  | "partnerContribution"
  | "jointActivities"
  | "intendedResult"
  | "decisionRights"
  | "financialTerms"
  | "dataBoundaries"
  | "communicationRhythm"
  | "conflictPath"
  | "closeoutPlan"
  | "organizationLead"
  | "partnerLead"

type BooleanKey =
  | "hasConflictReview"
  | "hasDataReview"
  | "hasAccessibilityPlan"
  | "hasAuthorizedApproval"

const GROUPS: Array<{
  title: string
  description: string
  fields: Array<{
    key: TextKey
    label: string
    description: string
    placeholder: string
    maximum?: number
  }>
}> = [
  {
    title: "Purpose, people, and mutual value",
    description:
      "Start with the public benefit and the people affected, then make each party's contribution visible.",
    fields: [
      {
        key: "sharedPurpose",
        label: "Shared purpose",
        description:
          "Name the problem, people, place, and bounded public benefit that require joint work.",
        placeholder:
          "Together, we intend to help… by… because neither party alone can…",
      },
      {
        key: "communityRole",
        label: "Community role and participation",
        description:
          "State how affected people shape decisions, access the work, give or withhold consent, interpret learning, and raise concerns.",
        placeholder:
          "People affected by this work will participate by… Access and compensation include…",
      },
      {
        key: "organizationContribution",
        label: "Your organization's contribution and limits",
        description:
          "Include time, expertise, trust, money, space, systems, relationships, intellectual property, and what is excluded.",
        placeholder: "We contribute… We are not committing to…",
      },
      {
        key: "partnerContribution",
        label: "Partner contribution and limits to confirm",
        description:
          "Record what the partner has actually proposed and what still requires confirmation.",
        placeholder:
          "The potential partner has proposed… We still need to confirm…",
      },
    ],
  },
  {
    title: "Work, result, and responsibility",
    description:
      "Turn the idea into bounded activities, evidence, named leads, and decision rights.",
    fields: [
      {
        key: "jointActivities",
        label: "Joint activities and handoffs",
        description:
          "Describe who does what, for whom, where, when, with which dependencies, and how handoffs work.",
        placeholder:
          "We will jointly… Our organization owns… The partner owns… Handoffs occur when…",
      },
      {
        key: "intendedResult",
        label: "Intended result, evidence, and limitations",
        description:
          "Name a result the partners can examine, the evidence to keep, and what the partnership cannot establish.",
        placeholder:
          "We will examine… using… We will not claim that the partnership caused…",
      },
      {
        key: "organizationLead",
        label: "Your operational and escalation leads",
        description:
          "Use roles when names may change. Include backup coverage.",
        placeholder: "Program lead… Escalation lead… Backup…",
        maximum: 300,
      },
      {
        key: "partnerLead",
        label: "Partner leads to confirm",
        description:
          "Record the partner's operational, escalation, and backup roles only after confirmation.",
        placeholder: "Partner program lead… Escalation lead… Backup…",
        maximum: 300,
      },
      {
        key: "decisionRights",
        label: "Decision rights and approvals",
        description:
          "State who recommends, decides, approves, must be consulted, and must be informed for scope, money, data, brand, safety, and ending the work.",
        placeholder:
          "Operational leads may… Both executive leaders approve… Boards reserve authority for…",
      },
    ],
  },
  {
    title: "Resources, information, and communication",
    description:
      "Surface the operating conditions that often remain hidden until a partnership is under strain.",
    fields: [
      {
        key: "financialTerms",
        label: "Financial, in-kind, ownership, and insurance terms",
        description:
          "Identify full cost, payment, reimbursement, restrictions, assets, intellectual property, insurance, and terms still requiring review.",
        placeholder:
          "Each party bears… Payment occurs… Ownership remains… Qualified review is needed for…",
      },
      {
        key: "dataBoundaries",
        label: "Data, consent, security, and record boundaries",
        description:
          "Define purpose, minimum data, authority or consent, access, transfer, retention, deletion, incident response, and records ownership.",
        placeholder:
          "We may share… We will not share… Access is limited to… Records are retained until…",
      },
      {
        key: "communicationRhythm",
        label: "Communication and review rhythm",
        description:
          "Name meeting cadence, capacity updates, records, community interpretation, executive or board reporting, and the next decision date.",
        placeholder:
          "Leads meet… Capacity is confirmed… Community review occurs… The next decision is…",
      },
    ],
  },
  {
    title: "Conflict, renewal, and closeout",
    description:
      "A responsible partnership defines how disagreement and endings work before either becomes urgent.",
    fields: [
      {
        key: "conflictPath",
        label: "Concern, conflict, and escalation path",
        description:
          "Include routine disagreement, urgent safety or confidentiality concerns, retaliation protection, authority, documentation, and outside review.",
        placeholder:
          "Routine concerns go to… Urgent concerns escalate to… Participants and staff may report by…",
      },
      {
        key: "closeoutPlan",
        label: "Renewal, transition, or closeout plan",
        description:
          "Define the decision date, notice, open commitments, participant communication, funds, assets, records, public claims, and lessons.",
        placeholder:
          "By… we will renew, revise, transfer, or end. If ending, the parties will…",
      },
    ],
  },
]

const SAFEGUARDS: Array<{ key: BooleanKey; label: string }> = [
  {
    key: "hasConflictReview",
    label:
      "Actual or potential conflicts, private benefit, related-party interests, and recusal needs will be disclosed and reviewed.",
  },
  {
    key: "hasDataReview",
    label:
      "Personal-data purpose, minimum fields, authority or consent, security, access, retention, deletion, and incident response will be reviewed before sharing.",
  },
  {
    key: "hasAccessibilityPlan",
    label:
      "Participation, communications, events, documents, digital tools, and feedback routes include appropriate accessibility and language access planning.",
  },
  {
    key: "hasAuthorizedApproval",
    label:
      "The people or governing bodies with actual authority will review and approve the final terms before either party represents the partnership as committed.",
  },
]

function BriefTextarea({
  field,
  draft,
  updateDraft,
}: {
  field: (typeof GROUPS)[number]["fields"][number]
  draft: PartnershipBriefDraft
  updateDraft: UpdatePartnershipDraft
}) {
  const id = `partnership-${field.key}`
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{field.label}</Label>
      <p
        id={`${id}-description`}
        className="text-muted-foreground text-xs leading-5"
      >
        {field.description}
      </p>
      <Textarea
        id={id}
        value={draft[field.key]}
        onChange={(event) => updateDraft(field.key, event.target.value)}
        aria-describedby={`${id}-description`}
        maxLength={field.maximum ?? 1000}
        rows={4}
        placeholder={field.placeholder}
        className="min-h-32 resize-y text-base"
      />
    </div>
  )
}

export function PartnershipAgreementFields({
  draft,
  updateDraft,
}: {
  draft: PartnershipBriefDraft
  updateDraft: UpdatePartnershipDraft
}) {
  return (
    <>
      {GROUPS.map((group) => (
        <section key={group.title} className="grid gap-6 border-t p-5 sm:p-6">
          <div>
            <h3 className="font-semibold">{group.title}</h3>
            <p className="text-muted-foreground mt-1 text-sm leading-6">
              {group.description}
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {group.fields.map((field) => (
              <BriefTextarea
                key={field.key}
                field={field}
                draft={draft}
                updateDraft={updateDraft}
              />
            ))}
          </div>
        </section>
      ))}

      <fieldset className="space-y-3 border-t p-5 sm:p-6">
        <legend className="px-1 text-sm font-semibold">
          Pre-commitment safeguards
        </legend>
        <p className="text-muted-foreground text-sm leading-6">
          These checks describe planned review. Selecting them does not mean the
          review occurred or that a requirement was satisfied.
        </p>
        {SAFEGUARDS.map((safeguard) => (
          <Label
            key={safeguard.key}
            htmlFor={`partnership-${safeguard.key}`}
            className="flex min-h-14 cursor-pointer items-start gap-3 border p-4 text-sm leading-6"
          >
            <Checkbox
              id={`partnership-${safeguard.key}`}
              checked={draft[safeguard.key]}
              onCheckedChange={(checked) =>
                updateDraft(safeguard.key, checked === true)
              }
              className="mt-0.5"
            />
            <span>{safeguard.label}</span>
          </Label>
        ))}
      </fieldset>
    </>
  )
}
