import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import type { SustainabilityPlanDraft } from "../../types"

type TextKey =
  | "missionPriority"
  | "essentialCommitments"
  | "fundingAssumptions"
  | "peopleDependencies"
  | "systemsDependencies"
  | "adaptationTriggers"
  | "continuityOwner"
  | "reviewRhythm"

type UpdateDraft = <Key extends keyof SustainabilityPlanDraft>(
  key: Key,
  value: SustainabilityPlanDraft[Key]
) => void

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
    title: "Mission and commitments",
    description:
      "Protect the valued benefit, then identify the full set of obligations required to provide or transition it responsibly.",
    fields: [
      {
        key: "missionPriority",
        label: "Mission benefit to protect",
        description:
          "Name the benefit, who should experience it, and what can adapt without losing that value.",
        placeholder:
          "Maintain reliable access to… for… while allowing… to change…",
        maximum: 800,
      },
      {
        key: "essentialCommitments",
        label: "Essential commitments and full-cost requirements",
        description:
          "Include delivery, access, people, supervision, systems, facilities, partners, evaluation, governance, communication, and closeout duties.",
        placeholder: "To deliver or transition this work responsibly, we must…",
      },
    ],
  },
  {
    title: "Assumptions and dependencies",
    description:
      "Document what could make the scenario stronger, weaker, later, more restricted, or impossible.",
    fields: [
      {
        key: "fundingAssumptions",
        label: "Revenue, restriction, cost, and timing assumptions",
        description:
          "Name what is committed or uncertain, when cash may arrive, allowable uses, shared costs, concentration, and future expenses.",
        placeholder: "This scenario assumes… It does not yet include…",
      },
      {
        key: "peopleDependencies",
        label: "People, leadership, and knowledge dependencies",
        description:
          "Name essential roles, skills, relationships, approvals, workload, supervision, and backup coverage.",
        placeholder: "This work currently depends on… If unavailable…",
      },
      {
        key: "systemsDependencies",
        label: "Systems, partner, and infrastructure dependencies",
        description:
          "Name critical workflows, records, credentials, technology, facilities, vendors, partners, controls, and workarounds.",
        placeholder:
          "Reliable delivery requires… The current single points of failure are…",
      },
    ],
  },
  {
    title: "Triggers, ownership, and review",
    description:
      "Decide in advance when the scenario must be reviewed and who has authority to protect people and commitments.",
    fields: [
      {
        key: "adaptationTriggers",
        label: "Adaptation and continuity triggers",
        description:
          "Name material mission, finance, capacity, evidence, safety, leadership, system, partner, or context changes and the expected response.",
        placeholder: "Review or pause when… The authorized response is…",
      },
      {
        key: "continuityOwner",
        label: "Continuity owner and decision authority",
        description:
          "Name who maintains the scenario, who decides, who provides backup, and who must be informed.",
        placeholder: "The… owns this plan; the… approves…; backup is…",
        maximum: 300,
      },
      {
        key: "reviewRhythm",
        label: "Review rhythm",
        description:
          "State what staff and board review, how often, and when the next material decision occurs.",
        placeholder:
          "Staff review… monthly; board reviews… quarterly; next decision…",
        maximum: 500,
      },
    ],
  },
]

function ScenarioTextarea({
  field,
  draft,
  updateDraft,
}: {
  field: (typeof GROUPS)[number]["fields"][number]
  draft: SustainabilityPlanDraft
  updateDraft: UpdateDraft
}) {
  const id = `sustainability-${field.key}`
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

export function SustainabilityContinuityFields({
  draft,
  updateDraft,
}: {
  draft: SustainabilityPlanDraft
  updateDraft: UpdateDraft
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
          {group.fields.map((field) => (
            <ScenarioTextarea
              key={field.key}
              field={field}
              draft={draft}
              updateDraft={updateDraft}
            />
          ))}
        </section>
      ))}

      <fieldset className="space-y-3 border-t p-5 sm:p-6">
        <legend className="px-1 text-sm font-semibold">
          Governance safeguards
        </legend>
        {[
          [
            "hasBoardFinancialReview",
            "The board or authorized committee will review current financial reports, restrictions, variance, cash timing, and the scenario before the decision.",
          ],
          [
            "hasRestrictionReview",
            "Funding restrictions and allowable uses were reconciled with source documentation and current accounting records.",
          ],
          [
            "hasContinuityPlan",
            "Essential functions have documented temporary authority, backup access, communications, succession, and emergency continuity procedures.",
          ],
        ].map(([field, label]) => (
          <Label
            key={field}
            htmlFor={`sustainability-${field}`}
            className="flex min-h-14 cursor-pointer items-start gap-3 border p-4 text-sm leading-6"
          >
            <Checkbox
              id={`sustainability-${field}`}
              checked={draft[field as keyof SustainabilityPlanDraft] as boolean}
              onCheckedChange={(checked) =>
                updateDraft(
                  field as "hasBoardFinancialReview",
                  checked === true
                )
              }
              className="mt-0.5"
            />
            <span>{label}</span>
          </Label>
        ))}
      </fieldset>
    </>
  )
}
