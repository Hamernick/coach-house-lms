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

import {
  SUSTAINABILITY_DIRECTIONS,
  SUSTAINABILITY_HORIZONS,
} from "../../lib/sustainability-plan"
import type {
  DocumentationStageId,
  SustainabilityDirectionId,
  SustainabilityHorizonMonths,
  SustainabilityPlanDraft,
} from "../../types"
import { SustainabilityContinuityFields } from "./sustainability-continuity-fields"
import { SustainabilityFinancialFields } from "./sustainability-financial-fields"

const STAGES: Array<{ value: DocumentationStageId; label: string }> = [
  { value: "exploring", label: "Exploring" },
  { value: "forming", label: "Forming" },
  { value: "operating", label: "Operating" },
  { value: "growing", label: "Growing" },
]

type UpdateDraft = <Key extends keyof SustainabilityPlanDraft>(
  key: Key,
  value: SustainabilityPlanDraft[Key]
) => void

export function SustainabilityPlanFields({
  draft,
  updateDraft,
}: {
  draft: SustainabilityPlanDraft
  updateDraft: UpdateDraft
}) {
  return (
    <div>
      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sustainability-organization">Organization name</Label>
          <Input
            id="sustainability-organization"
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
          <Label htmlFor="sustainability-initiative">
            Program or initiative
          </Label>
          <Input
            id="sustainability-initiative"
            value={draft.initiativeName}
            onChange={(event) =>
              updateDraft("initiativeName", event.target.value)
            }
            maxLength={120}
            placeholder="Example: Neighborhood legal navigation pilot…"
            className="min-h-11 text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sustainability-stage">Organization stage</Label>
          <Select
            value={draft.stage}
            onValueChange={(value) =>
              updateDraft("stage", value as DocumentationStageId)
            }
          >
            <SelectTrigger
              id="sustainability-stage"
              className="min-h-11 w-full"
            >
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
          <Label htmlFor="sustainability-horizon">Planning horizon</Label>
          <Select
            value={String(draft.horizonMonths)}
            onValueChange={(value) =>
              updateDraft(
                "horizonMonths",
                Number(value) as SustainabilityHorizonMonths
              )
            }
          >
            <SelectTrigger
              id="sustainability-horizon"
              className="min-h-11 w-full"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUSTAINABILITY_HORIZONS.map((months) => (
                <SelectItem key={months} value={String(months)}>
                  {months} months
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <fieldset className="border-t p-5 sm:p-6">
        <legend className="px-1 text-sm font-semibold">
          What direction are you preparing to decide?
        </legend>
        <p className="text-muted-foreground mt-1 text-sm leading-6">
          Choose the primary direction for this scenario. It can change after
          review.
        </p>
        <RadioGroup
          value={draft.direction}
          onValueChange={(value) =>
            updateDraft("direction", value as SustainabilityDirectionId)
          }
          className="mt-4 grid gap-3 lg:grid-cols-2"
        >
          {SUSTAINABILITY_DIRECTIONS.map((direction) => (
            <Label
              key={direction.id}
              htmlFor={`sustainability-direction-${direction.id}`}
              className="has-[[data-state=checked]]:border-foreground has-[[data-state=checked]]:bg-muted/60 flex min-h-24 cursor-pointer items-start gap-3 border p-4"
            >
              <RadioGroupItem
                id={`sustainability-direction-${direction.id}`}
                value={direction.id}
                className="mt-0.5"
              />
              <span>
                <span className="block text-sm font-semibold">
                  {direction.label}
                </span>
                <span className="text-muted-foreground mt-1 block text-xs leading-5">
                  {direction.description}
                </span>
              </span>
            </Label>
          ))}
        </RadioGroup>
      </fieldset>

      <SustainabilityFinancialFields draft={draft} updateDraft={updateDraft} />
      <SustainabilityContinuityFields draft={draft} updateDraft={updateDraft} />
    </div>
  )
}
