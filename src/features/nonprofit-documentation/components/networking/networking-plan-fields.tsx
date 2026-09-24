import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import {
  NETWORKING_OBJECTIVES,
  NETWORKING_REVIEW_WEEKS,
} from "../../lib/networking-plan"
import type {
  DocumentationStageId,
  NetworkingObjectiveId,
  NetworkingPlanDraft,
} from "../../types"

const STAGES: Array<{ value: DocumentationStageId; label: string }> = [
  { value: "exploring", label: "Exploring" },
  { value: "forming", label: "Forming" },
  { value: "operating", label: "Operating" },
  { value: "growing", label: "Growing" },
]

function DraftTextarea({
  id,
  label,
  value,
  placeholder,
  maxLength,
  onChange,
  wide = false,
}: {
  id: string
  label: string
  value: string
  placeholder: string
  maxLength: number
  onChange: (value: string) => void
  wide?: boolean
}) {
  return (
    <div className={`space-y-2 ${wide ? "lg:col-span-2" : ""}`}>
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        name={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={maxLength}
        rows={4}
        placeholder={placeholder}
        className="min-h-28 resize-y text-sm"
      />
    </div>
  )
}

export function NetworkingPlanFields({
  draft,
  updateDraft,
}: {
  draft: NetworkingPlanDraft
  updateDraft: <Key extends keyof NetworkingPlanDraft>(
    key: Key,
    value: NetworkingPlanDraft[Key]
  ) => void
}) {
  return (
    <div>
      <fieldset className="grid gap-3 p-4 sm:p-4 lg:grid-cols-2">
        <legend className="px-1 text-sm font-semibold">
          Purpose and community
        </legend>
        <div className="space-y-2">
          <Label htmlFor="networking-organization">Organization name</Label>
          <Input
            id="networking-organization"
            name="organizationName"
            autoComplete="organization"
            value={draft.organizationName}
            onChange={(event) =>
              updateDraft("organizationName", event.target.value)
            }
            maxLength={120}
            placeholder="Example: Willow Street Family Resource Network…"
            className="min-h-11 text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="networking-initiative">Initiative or focus</Label>
          <Input
            id="networking-initiative"
            name="initiativeName"
            value={draft.initiativeName}
            onChange={(event) =>
              updateDraft("initiativeName", event.target.value)
            }
            maxLength={120}
            placeholder="Example: Current referral pathway review…"
            className="min-h-11 text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="networking-stage">Organization stage</Label>
          <Select
            value={draft.stage}
            onValueChange={(value) =>
              updateDraft("stage", value as DocumentationStageId)
            }
          >
            <SelectTrigger id="networking-stage" className="min-h-11 w-full">
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
          <Label htmlFor="networking-objective">Primary objective</Label>
          <Select
            value={draft.objective}
            onValueChange={(value) =>
              updateDraft("objective", value as NetworkingObjectiveId)
            }
          >
            <SelectTrigger
              id="networking-objective"
              className="min-h-11 w-full"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NETWORKING_OBJECTIVES.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-xs leading-5">
            {
              NETWORKING_OBJECTIVES.find(({ id }) => id === draft.objective)
                ?.description
            }
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="networking-review-weeks">Review period</Label>
          <Select
            value={String(draft.reviewWeeks)}
            onValueChange={(value) =>
              updateDraft("reviewWeeks", Number(value) as 4 | 8 | 12)
            }
          >
            <SelectTrigger
              id="networking-review-weeks"
              className="min-h-11 w-full"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NETWORKING_REVIEW_WEEKS.map((weeks) => (
                <SelectItem key={weeks} value={String(weeks)}>
                  {weeks} weeks
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-xs leading-5">
            A planning interval, not a recommended relationship timeline.
          </p>
        </div>
        <DraftTextarea
          id="networking-purpose"
          label="Networking purpose"
          value={draft.networkingPurpose}
          maxLength={700}
          placeholder="Name the issue, community, decision, desired learning or action, and what networking cannot solve alone…"
          onChange={(value) => updateDraft("networkingPurpose", value)}
          wide
        />
        <DraftTextarea
          id="networking-community-accountability"
          label="Community accountability"
          value={draft.communityAccountability}
          maxLength={700}
          placeholder="Describe how people affected shape priorities, the map, decisions, interpretation, and follow-up…"
          onChange={(value) => updateDraft("communityAccountability", value)}
          wide
        />
        <DraftTextarea
          id="networking-existing-assets"
          label="Existing relationship assets"
          value={draft.existingAssets}
          maxLength={700}
          placeholder="List trusted relationships, community-controlled assets, prior learning, and commitments already in place…"
          onChange={(value) => updateDraft("existingAssets", value)}
        />
        <DraftTextarea
          id="networking-gaps"
          label="Relationship or knowledge gaps"
          value={draft.relationshipGaps}
          maxLength={700}
          placeholder="Name missing perspectives, capabilities, access, context, or accountability without inventing people…"
          onChange={(value) => updateDraft("relationshipGaps", value)}
        />
      </fieldset>

      <fieldset className="grid gap-3 border-t p-4 sm:p-4 lg:grid-cols-2">
        <legend className="px-1 text-sm font-semibold">
          Invitation, follow-through, and safeguards
        </legend>
        <DraftTextarea
          id="networking-invitation"
          label="Working invitation"
          value={draft.invitation}
          maxLength={700}
          placeholder="State why the role is relevant, what you hope to learn or do, time, format, reciprocal value, and limits…"
          onChange={(value) => updateDraft("invitation", value)}
          wide
        />
        <DraftTextarea
          id="networking-follow-up"
          label="Follow-up rhythm"
          value={draft.followUpRhythm}
          maxLength={500}
          placeholder="Define when notes, commitments, updates, corrections, and reviews close the loop…"
          onChange={(value) => updateDraft("followUpRhythm", value)}
        />
        <DraftTextarea
          id="networking-access-plan"
          label="Participation and access plan"
          value={draft.accessPlan}
          maxLength={700}
          placeholder="Plan language, disability access, format, scheduling, technology, place, compensation, and other needs…"
          onChange={(value) => updateDraft("accessPlan", value)}
        />
        <DraftTextarea
          id="networking-data-boundary"
          label="Notes, consent, and data boundary"
          value={draft.dataBoundary}
          maxLength={700}
          placeholder="Define the minimum record, notice or permission, sharing, access, security, correction, retention, and deletion…"
          onChange={(value) => updateDraft("dataBoundary", value)}
        />
        <DraftTextarea
          id="networking-plan-owner"
          label="Plan owner and backup"
          value={draft.planOwner}
          maxLength={240}
          placeholder="Name the responsible role and backup…"
          onChange={(value) => updateDraft("planOwner", value)}
        />
        <DraftTextarea
          id="networking-escalation"
          label="Authority and escalation path"
          value={draft.escalationPath}
          maxLength={500}
          placeholder="Define who reviews sensitive, regulated, political, lobbying, funding, conflict, media, or commitment questions…"
          onChange={(value) => updateDraft("escalationPath", value)}
        />
        <div className="grid gap-3 lg:col-span-2">
          {[
            {
              key: "hasCommunityVoiceReview" as const,
              title:
                "Community participation, influence, access, and follow-up were reviewed",
            },
            {
              key: "hasConsentDataReview" as const,
              title:
                "Consent, introductions, notes, data access, retention, and deletion were reviewed",
            },
            {
              key: "hasAccessibilityReview" as const,
              title:
                "Communication, meeting, language, disability, and participation access were reviewed",
            },
            {
              key: "hasAuthorityConflictReview" as const,
              title:
                "Authority, commitments, conflicts, gifts, lobbying, and political boundaries were reviewed",
            },
          ].map((item) => (
            <label
              key={item.key}
              className="hover:bg-muted/35 flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 transition-colors md:min-h-9 md:py-2"
            >
              <Checkbox
                checked={draft[item.key]}
                onCheckedChange={(checked) =>
                  updateDraft(item.key, checked === true)
                }
              />
              <span className="text-sm font-medium">{item.title}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  )
}
