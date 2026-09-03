import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type { CampaignPlanDraft, CampaignTypeId } from "../../campaign-types"
import { CAMPAIGN_TYPES } from "../../lib/campaign-plan"
import type { DocumentationStageId } from "../../types"
import { CampaignPlanTextarea } from "./campaign-plan-textarea"

const STAGES: Array<{ value: DocumentationStageId; label: string }> = [
  { value: "exploring", label: "Exploring" },
  { value: "forming", label: "Forming" },
  { value: "operating", label: "Operating" },
  { value: "growing", label: "Growing" },
]

export function CampaignBriefFields({
  draft,
  updateDraft,
}: {
  draft: CampaignPlanDraft
  updateDraft: <Key extends keyof CampaignPlanDraft>(
    key: Key,
    value: CampaignPlanDraft[Key]
  ) => void
}) {
  const campaignType = CAMPAIGN_TYPES.find(
    ({ id }) => id === draft.campaignType
  )

  return (
    <fieldset className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
      <legend className="px-1 text-sm font-semibold">
        Campaign identity, decision, and audience
      </legend>
      <div className="space-y-2">
        <Label htmlFor="campaign-organization">Organization name</Label>
        <Input
          id="campaign-organization"
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
        <Label htmlFor="campaign-name">Working campaign name</Label>
        <Input
          id="campaign-name"
          name="campaignName"
          value={draft.campaignName}
          onChange={(event) => updateDraft("campaignName", event.target.value)}
          maxLength={140}
          placeholder="Example: Appointments without the guesswork…"
          className="min-h-11 text-base"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="campaign-stage">Organization stage</Label>
        <Select
          value={draft.stage}
          onValueChange={(value) =>
            updateDraft("stage", value as DocumentationStageId)
          }
        >
          <SelectTrigger id="campaign-stage" className="min-h-11 w-full">
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
        <Label htmlFor="campaign-type">Campaign type</Label>
        <Select
          value={draft.campaignType}
          onValueChange={(value) =>
            updateDraft("campaignType", value as CampaignTypeId)
          }
        >
          <SelectTrigger id="campaign-type" className="min-h-11 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CAMPAIGN_TYPES.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-xs leading-5">
          {campaignType?.description} This organizes the brief; it does not
          determine legal or tax treatment.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="campaign-start-date">Working start date</Label>
        <Input
          id="campaign-start-date"
          name="startDate"
          type="date"
          value={draft.startDate}
          onChange={(event) => updateDraft("startDate", event.target.value)}
          className="min-h-11 text-base"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="campaign-end-date">Working end date</Label>
        <Input
          id="campaign-end-date"
          name="endDate"
          type="date"
          value={draft.endDate}
          onChange={(event) => updateDraft("endDate", event.target.value)}
          min={draft.startDate || undefined}
          className="min-h-11 text-base"
        />
        <p className="text-muted-foreground text-xs leading-5">
          Planning dates only. Confirm every filing, notice, registration,
          event, funding, contract, and legal deadline separately.
        </p>
      </div>
      <CampaignPlanTextarea
        id="campaign-objective"
        label="Objective and decision"
        value={draft.objective}
        maxLength={700}
        placeholder="State the mission-aligned change this campaign can support and the decision its evidence will inform…"
        onChange={(value) => updateDraft("objective", value)}
      />
      <CampaignPlanTextarea
        id="campaign-desired-action"
        label="One observable audience action"
        value={draft.desiredAction}
        maxLength={600}
        placeholder="Describe what a person should be able to do, through which path, and what they should not share in public…"
        onChange={(value) => updateDraft("desiredAction", value)}
      />
      <CampaignPlanTextarea
        id="campaign-primary-audience"
        label="Primary audience"
        value={draft.primaryAudience}
        maxLength={700}
        placeholder="Define the people, relationship, geography, need, context, and material access conditions for this campaign…"
        onChange={(value) => updateDraft("primaryAudience", value)}
      />
      <CampaignPlanTextarea
        id="campaign-audience-evidence"
        label="Audience evidence and unknowns"
        value={draft.audienceEvidence}
        maxLength={900}
        placeholder="Record recent listening, program or relationship evidence, assumptions, exclusions, missing voices, and limits…"
        onChange={(value) => updateDraft("audienceEvidence", value)}
      />
    </fieldset>
  )
}
