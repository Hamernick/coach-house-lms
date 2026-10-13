import CopyIcon from "lucide-react/dist/esm/icons/copy"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

import type { ProgramWizardFormState } from "../schema"
import { computeBudgetBreakdown, money } from "../helpers"
import { SummaryBlock } from "./summary-block"

type StepReviewGenerateProps = {
  form: ProgramWizardFormState
  onCopyBrief: () => void
}

export function StepReviewGenerate({ form, onCopyBrief }: StepReviewGenerateProps) {
  const budget = computeBudgetBreakdown(form)

  return (
    <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <article className="space-y-4 rounded-xl border p-4">
        <div>
          <h3 className="text-lg font-semibold">{form.title || "Untitled program"}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {form.oneSentence || "Add one-sentence description in Step 1."}
          </p>
        </div>

        <Separator />

        <div className="grid gap-3 sm:grid-cols-2">
          <SummaryBlock label="Type" value={form.programType} />
          <SummaryBlock
            label="Format"
            value={`${form.coreFormat}${
              form.formatAddons.length > 0 ? ` + ${form.formatAddons.join(", ")}` : ""
            }`}
          />
          <SummaryBlock label="Who" value={form.servesWho || "Not set"} />
          <SummaryBlock
            label="Participants receive"
            value={
              [form.participantReceive1, form.participantReceive2, form.participantReceive3]
                .filter(Boolean)
                .join("; ") || "Not set"
            }
          />
          <SummaryBlock
            label="Outcomes"
            value={
              [form.successOutcome1, form.successOutcome2, form.successOutcome3]
                .filter(Boolean)
                .join("; ") || "Not set"
            }
          />
          <SummaryBlock
            label="Pilot + staffing"
            value={`${form.pilotPeopleServed} served, ${form.staffCount} staff, ${form.volunteerCount} volunteers`}
          />
          <SummaryBlock
            label="Schedule"
            value={`${form.startMonth || "No start"} • ${
              form.durationLabel || "No duration"
            } • ${form.frequency || "No frequency"}`}
          />
          <SummaryBlock
            label="Location"
            value={`${form.locationMode}${
              form.locationDetails ? ` • ${form.locationDetails}` : ""
            }`}
          />
          <SummaryBlock label="Program budget" value={money(budget.totalBudget)} />
          <SummaryBlock label="Raised or committed" value={money(budget.raised)} />
          <SummaryBlock label="Fundraising need" value={money(budget.fundraisingTarget)} />
          <SummaryBlock label="Funding source" value={form.fundingSource || "Not set"} />
        </div>
      </article>

      <aside className="space-y-3 rounded-xl border bg-muted/25 p-4">
        <h3 className="text-sm font-semibold">Program brief actions</h3>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start"
          onClick={onCopyBrief}
        >
          <CopyIcon className="h-4 w-4" aria-hidden />
          Copy brief
        </Button>
        <p className="text-xs text-muted-foreground">
          Copy the generated brief and share with staff, board, and funders.
        </p>
      </aside>
    </section>
  )
}
