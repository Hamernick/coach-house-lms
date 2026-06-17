import ReceiptTextIcon from "lucide-react/dist/esm/icons/receipt-text"
import TargetIcon from "lucide-react/dist/esm/icons/target"
import WalletIcon from "lucide-react/dist/esm/icons/wallet"

import { AssignmentBudgetTableField } from "@/components/training/module-detail/assignment-form/assignment-budget-table-field"
import type { ModuleAssignmentField } from "@/lib/modules"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
    <section className="flex w-full max-w-full min-w-0 flex-col gap-4 overflow-x-hidden">
      <div className="flex w-full max-w-full min-w-0 flex-col gap-4 overflow-x-hidden">
        <div className="bg-muted/35 sticky top-0 z-10 grid w-full max-w-full min-w-0 gap-3 pb-3">
          <div className="border-border/60 bg-background/30 rounded-xl border p-4">
            <div className="text-muted-foreground flex items-center gap-2 text-xs tracking-wide uppercase">
              <ReceiptTextIcon className="h-3.5 w-3.5" aria-hidden />
              Total program budget
            </div>
            <p className="mt-2 text-lg font-semibold tabular-nums">
              {money(budget.totalBudget)}
            </p>
          </div>
          <div className="border-border/60 bg-background/30 rounded-xl border p-4">
            <div className="text-muted-foreground flex items-center gap-2 text-xs tracking-wide uppercase">
              <WalletIcon className="h-3.5 w-3.5" aria-hidden />
              Raised or committed
            </div>
            <p className="mt-2 text-lg font-semibold tabular-nums">
              {money(budget.raised)}
            </p>
          </div>
          <div className="border-border/60 bg-background/30 rounded-xl border p-4">
            <div className="text-muted-foreground flex items-center gap-2 text-xs tracking-wide uppercase">
              <TargetIcon className="h-3.5 w-3.5" aria-hidden />
              Fundraising need
            </div>
            <p className="mt-2 text-lg font-semibold tabular-nums">
              {money(budget.fundraisingTarget)}
            </p>
          </div>
        </div>

        <div className="border-border/60 bg-background/30 max-w-full min-w-0 overflow-x-hidden rounded-xl border p-4">
          <div className="flex items-start gap-3">
            <div className="bg-muted text-muted-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
              <ReceiptTextIcon className="h-4 w-4" aria-hidden />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-semibold">Budget breakdown</h3>
              <p className="text-muted-foreground text-sm">
                Add the cost buckets for this program. The wizard will calculate
                the total budget and the fundraising amount from these numbers.
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
              layout="stacked"
              updateValue={(_name, value) =>
                update({
                  budgetRows: value as ProgramWizardFormState["budgetRows"],
                })
              }
            />
            {errors.budgetUsd ? (
              <p className="text-destructive mt-3 text-xs">
                {errors.budgetUsd}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid w-full max-w-full min-w-0 gap-4">
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
              onChange={(event) =>
                update({ fundingSource: event.currentTarget.value })
              }
              placeholder="Foundation grant + donor circle"
              className="text-base"
            />
          </div>
        </div>
      </div>

      <aside className="bg-muted/25 flex min-w-0 flex-col gap-3 rounded-xl border p-4">
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
        <div className="flex flex-col gap-1">
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Flags
          </p>
          {feasibility.flags.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {feasibility.flags.map((flag) => (
                <li key={flag} className="text-foreground text-sm">
                  - {flag}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">
              No feasibility flags right now.
            </p>
          )}
        </div>
      </aside>
    </section>
  )
}
