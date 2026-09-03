import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type { CrmPlanDraft, CrmRelationshipContextId } from "../../crm-types"
import {
  CRM_RELATIONSHIP_CONTEXTS,
  CRM_REVIEW_MONTHS,
} from "../../lib/crm-plan"
import type { DocumentationStageId } from "../../types"
import { CrmPlanTextarea } from "./crm-plan-textarea"

const STAGES: Array<{ value: DocumentationStageId; label: string }> = [
  { value: "exploring", label: "Exploring" },
  { value: "forming", label: "Forming" },
  { value: "operating", label: "Operating" },
  { value: "growing", label: "Growing" },
]

export function CrmPlanFields({
  draft,
  updateDraft,
}: {
  draft: CrmPlanDraft
  updateDraft: <Key extends keyof CrmPlanDraft>(
    key: Key,
    value: CrmPlanDraft[Key]
  ) => void
}) {
  const context = CRM_RELATIONSHIP_CONTEXTS.find(
    ({ id }) => id === draft.relationshipContext
  )

  return (
    <FieldSet className="p-5 sm:p-6">
      <FieldLegend className="px-1">
        Purpose, people, and record boundary
      </FieldLegend>
      <FieldGroup className="grid gap-5 lg:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="crm-organization">Organization name</FieldLabel>
          <Input
            id="crm-organization"
            name="organizationName"
            autoComplete="organization"
            value={draft.organizationName}
            onChange={(event) =>
              updateDraft("organizationName", event.target.value)
            }
            maxLength={120}
            placeholder="Example: Willow Street Family Resource Network…"
            className="min-h-11 text-base"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="crm-plan-name">Working plan name</FieldLabel>
          <Input
            id="crm-plan-name"
            name="planName"
            value={draft.planName}
            onChange={(event) => updateDraft("planName", event.target.value)}
            maxLength={140}
            placeholder="Example: Shared relationship record pilot…"
            className="min-h-11 text-base"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="crm-stage">Organization stage</FieldLabel>
          <Select
            name="stage"
            value={draft.stage}
            onValueChange={(value) =>
              updateDraft("stage", value as DocumentationStageId)
            }
          >
            <SelectTrigger id="crm-stage" className="min-h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {STAGES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="crm-context">
            Primary relationship context
          </FieldLabel>
          <Select
            name="relationshipContext"
            value={draft.relationshipContext}
            onValueChange={(value) =>
              updateDraft(
                "relationshipContext",
                value as CrmRelationshipContextId
              )
            }
          >
            <SelectTrigger id="crm-context" className="min-h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {CRM_RELATIONSHIP_CONTEXTS.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FieldDescription>
            {context?.description} This organizes the plan; it does not
            establish permission, legal treatment, or appropriate use.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="crm-review-months">
            Operating review interval
          </FieldLabel>
          <Select
            name="reviewMonths"
            value={String(draft.reviewMonths)}
            onValueChange={(value) =>
              updateDraft("reviewMonths", Number(value) as 3 | 6 | 12)
            }
          >
            <SelectTrigger id="crm-review-months" className="min-h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {CRM_REVIEW_MONTHS.map((months) => (
                  <SelectItem key={months} value={String(months)}>
                    Every {months} months
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FieldDescription>
            A planning cadence, not a legal retention or review deadline.
          </FieldDescription>
        </Field>
        <CrmPlanTextarea
          id="crm-system-purpose"
          label="System purpose and decisions"
          value={draft.systemPurpose}
          maxLength={800}
          placeholder="Name the relationship work and specific decisions the record should support—and what it should not be used for…"
          onChange={(value) => updateDraft("systemPurpose", value)}
        />
        <CrmPlanTextarea
          id="crm-people-decisions"
          label="Affected people, accountability, and authority"
          value={draft.peopleAndDecisions}
          maxLength={800}
          placeholder="Name who shapes the system, who is affected, who owns decisions, and who can challenge harmful or unnecessary practices…"
          onChange={(value) => updateDraft("peopleAndDecisions", value)}
        />
        <CrmPlanTextarea
          id="crm-record-boundary"
          label="Record boundary"
          value={draft.recordBoundary}
          maxLength={800}
          placeholder="State what belongs in this CRM, what belongs in another protected system, and what the organization will not collect…"
          onChange={(value) => updateDraft("recordBoundary", value)}
          wide
        />
      </FieldGroup>
    </FieldSet>
  )
}
