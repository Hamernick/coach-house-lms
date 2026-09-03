import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { HR_RELATIONSHIPS, HR_REVIEW_DAYS } from "../../lib/hr-plan"
import type { HrPlanDraft, HrRelationshipId } from "../../hr-types"
import type { DocumentationStageId } from "../../types"
import { HrPlanTextarea } from "./hr-plan-textarea"

const STAGES: Array<{ value: DocumentationStageId; label: string }> = [
  { value: "exploring", label: "Exploring" },
  { value: "forming", label: "Forming" },
  { value: "operating", label: "Operating" },
  { value: "growing", label: "Growing" },
]

export function HrPlanFields({
  draft,
  updateDraft,
}: {
  draft: HrPlanDraft
  updateDraft: <Key extends keyof HrPlanDraft>(
    key: Key,
    value: HrPlanDraft[Key]
  ) => void
}) {
  const relationship = HR_RELATIONSHIPS.find(
    ({ id }) => id === draft.relationship
  )
  return (
    <div>
      <fieldset className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
        <legend className="px-1 text-sm font-semibold">
          Role purpose and working relationship
        </legend>
        <div className="space-y-2">
          <Label htmlFor="hr-organization">Organization name</Label>
          <Input
            id="hr-organization"
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
        </div>
        <div className="space-y-2">
          <Label htmlFor="hr-role-title">Working role title</Label>
          <Input
            id="hr-role-title"
            name="roleTitle"
            value={draft.roleTitle}
            onChange={(event) => updateDraft("roleTitle", event.target.value)}
            maxLength={120}
            placeholder="Example: Community Navigation Coordinator…"
            className="min-h-11 text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hr-stage">Organization stage</Label>
          <Select
            value={draft.stage}
            onValueChange={(value) =>
              updateDraft("stage", value as DocumentationStageId)
            }
          >
            <SelectTrigger id="hr-stage" className="min-h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAGES.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="hr-relationship">
            Working relationship under review
          </Label>
          <Select
            value={draft.relationship}
            onValueChange={(value) =>
              updateDraft("relationship", value as HrRelationshipId)
            }
          >
            <SelectTrigger id="hr-relationship" className="min-h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HR_RELATIONSHIPS.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-xs leading-5">
            {relationship?.description} This selection records a question; it
            does not determine legal status.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="hr-review-days">Role review period</Label>
          <Select
            value={String(draft.reviewDays)}
            onValueChange={(value) =>
              updateDraft("reviewDays", Number(value) as 30 | 60 | 90 | 180)
            }
          >
            <SelectTrigger id="hr-review-days" className="min-h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HR_REVIEW_DAYS.map((days) => (
                <SelectItem key={days} value={String(days)}>
                  {days} days
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-xs leading-5">
            A planning interval, not a probation, renewal, notice, or legal
            deadline.
          </p>
        </div>
        <HrPlanTextarea
          id="hr-mission-need"
          label="Mission or program need"
          value={draft.missionNeed}
          maxLength={700}
          placeholder="Describe the need, people affected, evidence, work required, limits, and alternatives considered…"
          onChange={(value) => updateDraft("missionNeed", value)}
          wide
        />
        <HrPlanTextarea
          id="hr-role-outcomes"
          label="Observable role outcomes"
          value={draft.roleOutcomes}
          maxLength={700}
          placeholder="State what should be true because the role exists without promising impact one person cannot control…"
          onChange={(value) => updateDraft("roleOutcomes", value)}
        />
        <HrPlanTextarea
          id="hr-essential-functions"
          label="Essential functions and boundaries"
          value={draft.essentialFunctions}
          maxLength={900}
          placeholder="List necessary work, authority, decisions, records, participant contact, physical or communication demands, and work owned elsewhere…"
          onChange={(value) => updateDraft("essentialFunctions", value)}
        />
        <HrPlanTextarea
          id="hr-qualifications"
          label="Job-related qualifications"
          value={draft.qualifications}
          maxLength={700}
          placeholder="Describe knowledge, skills, experience, credentials, language, or training tied to essential work; distinguish required from learnable…"
          onChange={(value) => updateDraft("qualifications", value)}
        />
        <HrPlanTextarea
          id="hr-schedule-location"
          label="Schedule, location, direction, and tools"
          value={draft.scheduleLocation}
          maxLength={600}
          placeholder="Describe hours, timing, place, travel, remote work, supervision, independence, systems, equipment, and duration as they will actually occur…"
          onChange={(value) => updateDraft("scheduleLocation", value)}
        />
        <HrPlanTextarea
          id="hr-compensation-resources"
          label="Compensation, resources, and full cost"
          value={draft.compensationResources}
          maxLength={700}
          placeholder="Document pay or fee assumptions, taxes, benefits, leave, insurance, equipment, access, training, supervision, expenses, funding, and approvals…"
          onChange={(value) => updateDraft("compensationResources", value)}
          wide
        />
      </fieldset>
    </div>
  )
}
