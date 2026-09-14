import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import type { SustainabilityPlanDraft } from "../../types"

type NumericKey =
  | "unrestrictedCash"
  | "expectedUnrestrictedRevenue"
  | "restrictedFunds"
  | "monthlyCoreCosts"
  | "monthlyProgramCosts"
  | "weeklyAvailableHours"
  | "weeklyCommittedHours"

type UpdateDraft = <Key extends keyof SustainabilityPlanDraft>(
  key: Key,
  value: SustainabilityPlanDraft[Key]
) => void

const FINANCIAL_FIELDS: Array<{
  key: NumericKey
  label: string
  description: string
  prefix: string
}> = [
  {
    key: "unrestrictedCash",
    label: "Unrestricted cash at start",
    description: "Cash currently available for general operating use.",
    prefix: "$",
  },
  {
    key: "expectedUnrestrictedRevenue",
    label: "Expected unrestricted revenue",
    description:
      "Unrestricted receipts expected during the full planning horizon; document timing and probability below.",
    prefix: "$",
  },
  {
    key: "restrictedFunds",
    label: "Restricted funds shown separately",
    description:
      "Resources limited by donor, grant, contract, board, law, or other terms. Excluded from flexible-resource math.",
    prefix: "$",
  },
  {
    key: "monthlyCoreCosts",
    label: "Monthly core operating costs",
    description:
      "Shared leadership, administration, finance, insurance, facilities, technology, and other core costs.",
    prefix: "$",
  },
  {
    key: "monthlyProgramCosts",
    label: "Monthly program costs",
    description:
      "Direct delivery, access, staffing, materials, evaluation, partner, and participant costs.",
    prefix: "$",
  },
]

const CAPACITY_FIELDS: Array<{
  key: NumericKey
  label: string
  description: string
}> = [
  {
    key: "weeklyAvailableHours",
    label: "Supported hours available each week",
    description:
      "Real staff and volunteer hours available for this work after leave, supervision, administration, and other commitments.",
  },
  {
    key: "weeklyCommittedHours",
    label: "Hours currently committed each week",
    description:
      "Estimated hours required to deliver and govern the commitments in this scenario.",
  },
]

function NumericField({
  field,
  draft,
  updateDraft,
}: {
  field: (typeof FINANCIAL_FIELDS)[number]
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
      <div className="relative">
        {field.prefix ? (
          <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
            {field.prefix}
          </span>
        ) : null}
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          max={1_000_000_000}
          step="0.01"
          value={draft[field.key]}
          onChange={(event) =>
            updateDraft(field.key, Math.max(0, Number(event.target.value) || 0))
          }
          aria-describedby={`${id}-description`}
          className={`min-h-11 text-base ${field.prefix ? "pl-7" : ""}`}
        />
      </div>
    </div>
  )
}

export function SustainabilityFinancialFields({
  draft,
  updateDraft,
}: {
  draft: SustainabilityPlanDraft
  updateDraft: UpdateDraft
}) {
  return (
    <>
      <section
        className="border-t p-5 sm:p-6"
        aria-labelledby="sustainability-finance-title"
      >
        <h3 id="sustainability-finance-title" className="font-semibold">
          Flexible resources and planned costs
        </h3>
        <p className="text-muted-foreground mt-1 text-sm leading-6">
          Enter one transparent scenario. Confirm restrictions and model actual
          receipt and payment timing separately.
        </p>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {FINANCIAL_FIELDS.map((field) => (
            <NumericField
              key={field.key}
              field={field}
              draft={draft}
              updateDraft={updateDraft}
            />
          ))}
        </div>
      </section>

      <section
        className="border-t p-5 sm:p-6"
        aria-labelledby="sustainability-capacity-title"
      >
        <h3 id="sustainability-capacity-title" className="font-semibold">
          Weekly people capacity
        </h3>
        <p className="text-muted-foreground mt-1 text-sm leading-6">
          Capacity is not free. Include supported staff and volunteer time
          without assuming overtime or unpaid labor.
        </p>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {CAPACITY_FIELDS.map((field) => (
            <NumericField
              key={field.key}
              field={{ ...field, prefix: "" }}
              draft={draft}
              updateDraft={updateDraft}
            />
          ))}
        </div>
      </section>
    </>
  )
}
