import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import {
  MEASUREMENT_DECISIONS,
  MEASUREMENT_METHODS,
  MEASUREMENT_OUTCOME_LEVELS,
} from "../../lib/measurement-plan"
import type {
  DocumentationStageId,
  MeasurementDecisionId,
  MeasurementMethodId,
  MeasurementOutcomeLevel,
  MeasurementPlanDraft,
} from "../../types"

const STAGES: Array<{ value: DocumentationStageId; label: string }> = [
  { value: "exploring", label: "Exploring" },
  { value: "forming", label: "Forming" },
  { value: "operating", label: "Operating" },
  { value: "growing", label: "Growing" },
]

type UpdateDraft = <Key extends keyof MeasurementPlanDraft>(
  key: Key,
  value: MeasurementPlanDraft[Key]
) => void

function PlanTextarea({
  field,
  label,
  description,
  placeholder,
  maxLength = 1000,
  draft,
  updateDraft,
}: {
  field:
    | "outcomeStatement"
    | "evaluationQuestion"
    | "indicatorDefinition"
    | "dataSource"
    | "collectionSchedule"
    | "disaggregationPlan"
    | "limitations"
    | "owner"
    | "actionRule"
  label: string
  description: string
  placeholder: string
  maxLength?: number
  draft: MeasurementPlanDraft
  updateDraft: UpdateDraft
}) {
  const id = `measurement-${field}`
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <p
        id={`${id}-description`}
        className="text-muted-foreground text-xs leading-5"
      >
        {description}
      </p>
      <Textarea
        id={id}
        name={field}
        value={draft[field]}
        onChange={(event) => updateDraft(field, event.target.value)}
        aria-describedby={`${id}-description`}
        maxLength={maxLength}
        rows={4}
        placeholder={placeholder}
        className="min-h-32 resize-y text-base"
      />
    </div>
  )
}

export function MeasurementPlanFields({
  draft,
  updateDraft,
}: {
  draft: MeasurementPlanDraft
  updateDraft: UpdateDraft
}) {
  return (
    <div>
      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="measurement-organization">Organization name</Label>
          <Input
            id="measurement-organization"
            value={draft.organizationName}
            onChange={(event) =>
              updateDraft("organizationName", event.target.value)
            }
            maxLength={120}
            autoComplete="organization"
            placeholder="Example: Willow Street Family Resource Network…"
            className="min-h-11 text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="measurement-program">Program or initiative</Label>
          <Input
            id="measurement-program"
            value={draft.programName}
            onChange={(event) => updateDraft("programName", event.target.value)}
            maxLength={120}
            placeholder="Example: Neighborhood legal navigation pilot…"
            className="min-h-11 text-base"
          />
        </div>
        <div className="space-y-2 lg:col-span-2">
          <Label htmlFor="measurement-stage">Organization stage</Label>
          <Select
            value={draft.stage}
            onValueChange={(value) =>
              updateDraft("stage", value as DocumentationStageId)
            }
          >
            <SelectTrigger id="measurement-stage" className="min-h-11 w-full">
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
      </div>

      <fieldset className="border-t p-5 sm:p-6">
        <legend className="px-1 text-sm font-semibold">
          What decision should this evidence support?
        </legend>
        <p className="text-muted-foreground mt-1 text-sm leading-6">
          Choose one primary use. A bounded plan is more likely to produce
          evidence someone can act on.
        </p>
        <RadioGroup
          value={draft.decision}
          onValueChange={(value) =>
            updateDraft("decision", value as MeasurementDecisionId)
          }
          className="mt-4 grid gap-3 lg:grid-cols-2"
        >
          {MEASUREMENT_DECISIONS.map((decision) => (
            <Label
              key={decision.id}
              htmlFor={`measurement-decision-${decision.id}`}
              className="has-[[data-state=checked]]:border-foreground has-[[data-state=checked]]:bg-muted/60 flex min-h-24 cursor-pointer items-start gap-3 border p-4"
            >
              <RadioGroupItem
                id={`measurement-decision-${decision.id}`}
                value={decision.id}
                className="mt-0.5"
              />
              <span>
                <span className="block text-sm font-semibold">
                  {decision.label}
                </span>
                <span className="text-muted-foreground mt-1 block text-xs leading-5">
                  {decision.description}
                </span>
              </span>
            </Label>
          ))}
        </RadioGroup>
      </fieldset>

      <section
        className="grid gap-6 border-t p-5 sm:p-6"
        aria-labelledby="measurement-question-title"
      >
        <div>
          <h3 id="measurement-question-title" className="font-semibold">
            Outcome and question
          </h3>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            Define the expected change separately from the question used to
            examine it.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="measurement-outcome-level">Evidence level</Label>
          <Select
            value={draft.outcomeLevel}
            onValueChange={(value) =>
              updateDraft("outcomeLevel", value as MeasurementOutcomeLevel)
            }
          >
            <SelectTrigger
              id="measurement-outcome-level"
              className="min-h-11 w-full"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MEASUREMENT_OUTCOME_LEVELS.map((level) => (
                <SelectItem key={level.id} value={level.id}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <PlanTextarea
          field="outcomeStatement"
          label="Outcome statement"
          description="Name who or what may change, the kind or direction of change, and an appropriate timeframe."
          placeholder="Participating residents may better understand… within…"
          maxLength={800}
          draft={draft}
          updateDraft={updateDraft}
        />
        <PlanTextarea
          field="evaluationQuestion"
          label="Priority evaluation question"
          description="Ask one open, answerable question aligned with the intended decision and program stage."
          placeholder="How, if at all, does… change, for whom, and under what conditions?"
          maxLength={800}
          draft={draft}
          updateDraft={updateDraft}
        />
      </section>

      <section
        className="grid gap-6 border-t p-5 sm:p-6"
        aria-labelledby="measurement-evidence-title"
      >
        <div>
          <h3 id="measurement-evidence-title" className="font-semibold">
            Indicator and evidence
          </h3>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            Specify what will be observed, where it comes from, and what the
            method can and cannot answer.
          </p>
        </div>
        <PlanTextarea
          field="indicatorDefinition"
          label="Indicator definition"
          description="Define population, unit, numerator and denominator when relevant, timeframe, exclusions, and interpretation."
          placeholder="Among… the number and percentage who… within… Report…"
          draft={draft}
          updateDraft={updateDraft}
        />
        <div className="space-y-2">
          <Label htmlFor="measurement-method">Primary method</Label>
          <Select
            value={draft.method}
            onValueChange={(value) =>
              updateDraft("method", value as MeasurementMethodId)
            }
          >
            <SelectTrigger id="measurement-method" className="min-h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MEASUREMENT_METHODS.map((method) => (
                <SelectItem key={method.id} value={method.id}>
                  {method.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <PlanTextarea
          field="dataSource"
          label="Data source and collection protocol"
          description="Name existing records or new collection, who or what is included, and the consistent procedure."
          placeholder="Use program records plus a voluntary… administered by…"
          maxLength={800}
          draft={draft}
          updateDraft={updateDraft}
        />
        <PlanTextarea
          field="collectionSchedule"
          label="Collection and review schedule"
          description="State when evidence is recorded, when it is reviewed, and when a decision is due."
          placeholder="Record at each service; follow up after 30 days; review quarterly…"
          maxLength={500}
          draft={draft}
          updateDraft={updateDraft}
        />
      </section>

      <section
        className="border-t p-5 sm:p-6"
        aria-labelledby="measurement-burden-title"
      >
        <h3 id="measurement-burden-title" className="font-semibold">
          Respondent burden estimate
        </h3>
        <p className="text-muted-foreground mt-1 text-sm leading-6">
          Use zero when the method does not ask people to respond. This is
          planning arithmetic, not a compliance determination.
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          {[
            ["expectedRespondents", "People per cycle", "40", 1000000],
            ["minutesPerResponse", "Minutes per person", "5", 1440],
            ["cyclesPerYear", "Cycles per year", "4", 365],
          ].map(([field, label, placeholder, max]) => (
            <div key={String(field)} className="space-y-2">
              <Label htmlFor={`measurement-${field}`}>{String(label)}</Label>
              <Input
                id={`measurement-${field}`}
                type="number"
                inputMode="numeric"
                min={0}
                max={Number(max)}
                value={draft[field as keyof MeasurementPlanDraft] as number}
                onChange={(event) =>
                  updateDraft(
                    field as "expectedRespondents",
                    Math.max(0, Number(event.target.value) || 0)
                  )
                }
                placeholder={String(placeholder)}
                className="min-h-11 text-base"
              />
            </div>
          ))}
        </div>
      </section>

      <section
        className="grid gap-6 border-t p-5 sm:p-6"
        aria-labelledby="measurement-governance-title"
      >
        <div>
          <h3 id="measurement-governance-title" className="font-semibold">
            Interpretation, governance, and use
          </h3>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            Make uncertainty, responsibility, participant voice, and the next
            decision visible before results exist.
          </p>
        </div>
        <PlanTextarea
          field="disaggregationPlan"
          label="Disaggregation, missingness, and access plan"
          description="Name relevant safe comparisons, accessibility needs, minimum reporting rules, and how missing information will be handled."
          placeholder="Review safe variation by… Do not publish… Report missingness…"
          draft={draft}
          updateDraft={updateDraft}
        />
        <PlanTextarea
          field="limitations"
          label="Known limitations and alternative explanations"
          description="State what the design cannot determine, who may be missing, and what other conditions could shape the result."
          placeholder="Results may not represent… The program does not control…"
          draft={draft}
          updateDraft={updateDraft}
        />
        <PlanTextarea
          field="owner"
          label="Owner and interpretation group"
          description="Name who maintains the plan, reviews quality, interprets results, and has decision authority."
          placeholder="The program director owns… Participants and… interpret…"
          maxLength={200}
          draft={draft}
          updateDraft={updateDraft}
        />
        <PlanTextarea
          field="actionRule"
          label="Decision and action rule"
          description="Describe how different findings could lead to continuing, adapting, investigating, pausing, or stopping."
          placeholder="If… then… Before expanding, we will…"
          draft={draft}
          updateDraft={updateDraft}
        />

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold">Safeguard review</legend>
          {[
            [
              "hasDataMinimizationReview",
              "We reviewed whether every requested field is necessary and defined access, retention, and deletion.",
            ],
            [
              "hasAccessibleVoluntaryProcess",
              "New participant collection is accessible and voluntary, with a clear explanation and no service penalty for declining.",
            ],
            [
              "hasParticipantInterpretation",
              "People affected will help interpret findings before consequential conclusions or decisions.",
            ],
          ].map(([field, label]) => (
            <Label
              key={field}
              htmlFor={`measurement-${field}`}
              className="flex min-h-14 cursor-pointer items-start gap-3 border p-4 text-sm leading-6"
            >
              <Checkbox
                id={`measurement-${field}`}
                checked={draft[field as keyof MeasurementPlanDraft] as boolean}
                onCheckedChange={(checked) =>
                  updateDraft(
                    field as "hasDataMinimizationReview",
                    checked === true
                  )
                }
                className="mt-0.5"
              />
              <span>{label}</span>
            </Label>
          ))}
        </fieldset>
      </section>
    </div>
  )
}
