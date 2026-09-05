import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type { FinancePeriodMonths, FinancePlanDraft } from "../../finance-types"
import { FINANCE_PERIODS } from "../../lib/finance-plan"
import type { DocumentationStageId } from "../../types"

type UpdateDraft = <Key extends keyof FinancePlanDraft>(
  key: Key,
  value: FinancePlanDraft[Key]
) => void

const STAGES: Array<{ value: DocumentationStageId; label: string }> = [
  { value: "exploring", label: "Exploring" },
  { value: "forming", label: "Forming" },
  { value: "operating", label: "Operating" },
  { value: "growing", label: "Growing" },
]

type MoneyKey =
  | "beginningUnrestrictedCash"
  | "beginningRestrictedCash"
  | "plannedUnrestrictedInflows"
  | "plannedRestrictedInflows"
  | "plannedUnrestrictedOutflows"
  | "plannedRestrictedOutflows"

const MONEY_FIELDS: Array<{
  key: MoneyKey
  label: string
  description: string
}> = [
  {
    key: "beginningUnrestrictedCash",
    label: "Beginning unrestricted cash",
    description:
      "Cash available for general operating use at the start of this period, subject to current records and board designations.",
  },
  {
    key: "beginningRestrictedCash",
    label: "Beginning restricted cash",
    description:
      "Cash subject to donor, award, contract, legal, board, or other limits. Kept separate in every calculation.",
  },
  {
    key: "plannedUnrestrictedInflows",
    label: "Planned unrestricted inflows",
    description:
      "Receipts expected during the period for general operating use. Distinguish commitments, forecasts, receivables, and cash in the evidence field below.",
  },
  {
    key: "plannedRestrictedInflows",
    label: "Planned restricted inflows",
    description:
      "Receipts expected during the period whose use is limited. Confirm each source, condition, purpose, and timing.",
  },
  {
    key: "plannedUnrestrictedOutflows",
    label: "Planned unrestricted outflows",
    description:
      "Cash payments expected from unrestricted resources during the period, including shared and operating costs.",
  },
  {
    key: "plannedRestrictedOutflows",
    label: "Planned restricted outflows",
    description:
      "Cash payments expected from restricted resources during the period after source-term and accounting review.",
  },
]

export function FinancePlanFields({
  draft,
  updateDraft,
}: {
  draft: FinancePlanDraft
  updateDraft: UpdateDraft
}) {
  return (
    <div>
      <div className="grid gap-3 p-4 sm:p-4 lg:grid-cols-3">
        <div className="space-y-2 lg:col-span-3">
          <Label htmlFor="finance-organization">Organization name</Label>
          <Input
            id="finance-organization"
            value={draft.organizationName}
            onChange={(event) =>
              updateDraft("organizationName", event.target.value)
            }
            maxLength={120}
            autoComplete="organization"
            placeholder="Example: Willow Street Family Resource Network…"
            className="min-h-11 text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="finance-stage">Organization stage</Label>
          <Select
            value={draft.stage}
            onValueChange={(value) =>
              updateDraft("stage", value as DocumentationStageId)
            }
          >
            <SelectTrigger id="finance-stage" className="min-h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAGES.map((stage) => (
                <SelectItem key={stage.value} value={stage.value}>
                  {stage.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="finance-period">Planning period</Label>
          <Select
            value={String(draft.periodMonths)}
            onValueChange={(value) =>
              updateDraft("periodMonths", Number(value) as FinancePeriodMonths)
            }
          >
            <SelectTrigger id="finance-period" className="min-h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FINANCE_PERIODS.map((months) => (
                <SelectItem key={months} value={String(months)}>
                  {months} months
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <section
        className="border-t p-4 sm:p-4"
        aria-labelledby="finance-cash-title"
      >
        <h3 id="finance-cash-title" className="font-semibold">
          Working cash view
        </h3>
        <p className="text-muted-foreground mt-1 max-w-3xl text-sm leading-5">
          Enter one bounded planning scenario. These totals do not replace a
          dated cash-flow forecast, ledger, bank reconciliation, or financial
          statements.
        </p>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {MONEY_FIELDS.map((field) => {
            const id = `finance-${field.key}`
            return (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={id}>{field.label}</Label>
                <p
                  id={`${id}-description`}
                  className="text-muted-foreground text-xs leading-5"
                >
                  {field.description}
                </p>
                <div className="relative">
                  <span
                    className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm"
                    aria-hidden
                  >
                    $
                  </span>
                  <Input
                    id={id}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={1_000_000_000}
                    step="0.01"
                    value={draft[field.key]}
                    onChange={(event) =>
                      updateDraft(
                        field.key,
                        Math.max(0, Number(event.target.value) || 0)
                      )
                    }
                    aria-describedby={`${id}-description`}
                    className="min-h-11 pl-7 text-sm tabular-nums"
                  />
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
