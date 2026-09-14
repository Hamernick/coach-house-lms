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
  PARTNERSHIP_MODELS,
  PARTNERSHIP_REVIEW_INTERVALS,
  PARTNERSHIP_TERMS,
} from "../../lib/partnership-brief"
import type {
  DocumentationStageId,
  PartnershipBriefDraft,
  PartnershipModelId,
  PartnershipReviewMonths,
  PartnershipTermMonths,
} from "../../types"
import { PartnershipAgreementFields } from "./partnership-agreement-fields"

const STAGES: Array<{ value: DocumentationStageId; label: string }> = [
  { value: "exploring", label: "Exploring" },
  { value: "forming", label: "Forming" },
  { value: "operating", label: "Operating" },
  { value: "growing", label: "Growing" },
]

export type UpdatePartnershipDraft = <Key extends keyof PartnershipBriefDraft>(
  key: Key,
  value: PartnershipBriefDraft[Key]
) => void

export function PartnershipBriefFields({
  draft,
  updateDraft,
}: {
  draft: PartnershipBriefDraft
  updateDraft: UpdatePartnershipDraft
}) {
  return (
    <div>
      <section
        className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2"
        aria-labelledby="partnership-context-title"
      >
        <div className="lg:col-span-2">
          <h3 id="partnership-context-title" className="font-semibold">
            Partnership context
          </h3>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            Name a real potential relationship. Nothing entered here confirms
            the other party&apos;s interest or approval.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="partnership-organization">Your organization</Label>
          <Input
            id="partnership-organization"
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
          <Label htmlFor="partnership-partner">Potential partner</Label>
          <Input
            id="partnership-partner"
            value={draft.partnerName}
            onChange={(event) => updateDraft("partnerName", event.target.value)}
            maxLength={120}
            placeholder="Example: Harbor County Legal Aid…"
            className="min-h-11 text-base"
          />
        </div>
        <div className="space-y-2 lg:col-span-2">
          <Label htmlFor="partnership-name">Working partnership name</Label>
          <Input
            id="partnership-name"
            value={draft.partnershipName}
            onChange={(event) =>
              updateDraft("partnershipName", event.target.value)
            }
            maxLength={140}
            placeholder="Example: Neighborhood legal navigation pathway…"
            className="min-h-11 text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="partnership-stage">Organization stage</Label>
          <Select
            value={draft.stage}
            onValueChange={(value) =>
              updateDraft("stage", value as DocumentationStageId)
            }
          >
            <SelectTrigger id="partnership-stage" className="min-h-11 w-full">
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
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="partnership-term">Initial term</Label>
            <Select
              value={String(draft.termMonths)}
              onValueChange={(value) =>
                updateDraft(
                  "termMonths",
                  Number(value) as PartnershipTermMonths
                )
              }
            >
              <SelectTrigger id="partnership-term" className="min-h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PARTNERSHIP_TERMS.map((months) => (
                  <SelectItem key={months} value={String(months)}>
                    {months} months
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="partnership-review">Review every</Label>
            <Select
              value={String(draft.reviewEveryMonths)}
              onValueChange={(value) =>
                updateDraft(
                  "reviewEveryMonths",
                  Number(value) as PartnershipReviewMonths
                )
              }
            >
              <SelectTrigger
                id="partnership-review"
                className="min-h-11 w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PARTNERSHIP_REVIEW_INTERVALS.map((months) => (
                  <SelectItem key={months} value={String(months)}>
                    {months === 1 ? "1 month" : `${months} months`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <fieldset className="border-t p-5 sm:p-6">
        <legend className="px-1 text-sm font-semibold">
          What kind of relationship are you exploring?
        </legend>
        <p className="text-muted-foreground mt-1 text-sm leading-6">
          Choose the closest working model. Legal form and required review may
          differ from this planning label.
        </p>
        <RadioGroup
          value={draft.model}
          onValueChange={(value) =>
            updateDraft("model", value as PartnershipModelId)
          }
          className="mt-4 grid gap-3 lg:grid-cols-2"
        >
          {PARTNERSHIP_MODELS.map((model) => (
            <Label
              key={model.id}
              htmlFor={`partnership-model-${model.id}`}
              className="has-[[data-state=checked]]:border-foreground has-[[data-state=checked]]:bg-muted/60 flex min-h-24 cursor-pointer items-start gap-3 border p-4"
            >
              <RadioGroupItem
                id={`partnership-model-${model.id}`}
                value={model.id}
                className="mt-0.5"
              />
              <span>
                <span className="block text-sm font-semibold">
                  {model.label}
                </span>
                <span className="text-muted-foreground mt-1 block text-xs leading-5">
                  {model.description}
                </span>
              </span>
            </Label>
          ))}
        </RadioGroup>
      </fieldset>

      <PartnershipAgreementFields draft={draft} updateDraft={updateDraft} />
    </div>
  )
}
