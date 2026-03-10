import ReceiptTextIcon from "lucide-react/dist/esm/icons/receipt-text"
import TargetIcon from "lucide-react/dist/esm/icons/target"
import WalletIcon from "lucide-react/dist/esm/icons/wallet"

import { AssignmentBudgetTableField } from "@/components/training/module-detail/assignment-form/assignment-budget-table-field"
import type { ModuleAssignmentField } from "@/lib/modules"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

import { computeBudgetBreakdown, money, ratio } from "../helpers"
import type { ProgramWizardFormState } from "../schema"
import type { ProgramWizardFieldErrors, ProgramWizardUpdate } from "../types"
import { MetricRow } from "./metric-row"
import { NumberField } from "./number-field"

const PROGRAM_BUDGET_FIELD: ModuleAssignmentField = {
  name: "budgetRows",
  label: "Budget breakdown",
  type: "budget_table",
  required: true,
  description:
    "Build the program budget with the same line-item table used in the accelerator. Your subtotal becomes the total program budget, and the wizard subtracts committed funds to calculate fundraising need.",
}

type StepBudgetFeasibilityProps = {
  form: ProgramWizardFormState
  errors: ProgramWizardFieldErrors
  update: ProgramWizardUpdate
  feasibility: {
    costPerParticipant: number | null
    participantsPerStaff: number | null
    serviceIntensity: number | null
    flags: string[]
  }
}

export function StepBudgetFeasibility({
  form,
  errors,
  update,
  feasibility,
}: StepBudgetFeasibilityProps) {
  const budget = computeBudgetBreakdown(form)

  return (
    <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-4">
        <div className="rounded-xl border border-border/60 bg-background/30 p-4">
          <div className="flex items-start gap-3">
            <div className="bg-muted text-muted-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
              <ReceiptTextIcon className="h-4 w-4" aria-hidden />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold">Budget breakdown</h3>
              <p className="text-sm text-muted-foreground">
                Add the cost buckets for this program. The wizard will calculate the total budget
                and the fundraising amount from these numbers.
              </p>
            </div>
          </div>
          <div className="mt-4">
            <AssignmentBudgetTableField
              field={{ ...PROGRAM_BUDGET_FIELD, rows: budget.rows }}
              values={{ budgetRows: budget.rows }}
              isStepper={false}
              labelClassName="text-sm font-medium text-foreground"
              labelText="Budget breakdown"
              updateValue={(_name, value) =>
                update({ budgetRows: value as ProgramWizardFormState["budgetRows"] })
              }
            />
            {errors.budgetUsd ? (
              <p className="mt-3 text-xs text-destructive">{errors.budgetUsd}</p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField
            id="raisedUsd"
            label="Already raised or committed (USD)"
            value={form.raisedUsd}
            onChange={(value) => update({ raisedUsd: value })}
            min={0}
          />
          <div className="grid gap-1.5">
            <Label htmlFor="fundingSource">Funding source (optional)</Label>
            <Input
              id="fundingSource"
              value={form.fundingSource}
              onChange={(event) => update({ fundingSource: event.currentTarget.value })}
              placeholder="Foundation grant + donor circle"
              className="text-base"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-background/30 p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <ReceiptTextIcon className="h-3.5 w-3.5" aria-hidden />
              Total program budget
            </div>
            <p className="mt-2 text-lg font-semibold tabular-nums">
              {money(budget.totalBudget)}
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/30 p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <WalletIcon className="h-3.5 w-3.5" aria-hidden />
              Raised or committed
            </div>
            <p className="mt-2 text-lg font-semibold tabular-nums">
              {money(budget.raised)}
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/30 p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <TargetIcon className="h-3.5 w-3.5" aria-hidden />
              Fundraising need
            </div>
            <p className="mt-2 text-lg font-semibold tabular-nums">
              {money(budget.fundraisingTarget)}
            </p>
          </div>
        </div>
      </div>

      <aside className="space-y-3 rounded-xl border bg-muted/25 p-4">
        <h3 className="text-sm font-semibold">Instant feasibility snapshot</h3>
        <MetricRow
          label="Cost per participant"
          value={money(feasibility.costPerParticipant)}
        />
        <MetricRow
          label="Staff-to-participant ratio"
          value={ratio(feasibility.participantsPerStaff)}
        />
        <MetricRow
          label="Estimated service intensity"
          value={
            feasibility.serviceIntensity !== null
              ? `${feasibility.serviceIntensity} sessions`
              : "Not enough data"
          }
        />
        <Separator />
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Flags
          </p>
          {feasibility.flags.length > 0 ? (
            <ul className="space-y-1">
              {feasibility.flags.map((flag) => (
                <li key={flag} className="text-sm text-foreground">
                  - {flag}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No feasibility flags right now.
            </p>
          )}
        </div>
      </aside>
    </section>
  )
}
