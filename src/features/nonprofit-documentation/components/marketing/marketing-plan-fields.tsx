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
  MARKETING_CHANNELS,
  MARKETING_OBJECTIVES,
} from "../../lib/marketing-plan"
import type {
  DocumentationStageId,
  MarketingChannelId,
  MarketingObjectiveId,
  MarketingPlanDraft,
} from "../../types"

const STAGE_OPTIONS: Array<{
  value: DocumentationStageId
  label: string
}> = [
  { value: "exploring", label: "Exploring" },
  { value: "forming", label: "Forming" },
  { value: "operating", label: "Operating" },
  { value: "growing", label: "Growing" },
]

function cadenceInput(value: string) {
  const cadence = Number(value)
  if (!Number.isFinite(cadence)) return 0
  return Math.min(100, Math.max(0, Math.round(cadence)))
}

export function MarketingPlanFields({
  draft,
  updateDraft,
  updateChannelCadence,
}: {
  draft: MarketingPlanDraft
  updateDraft: <Key extends keyof MarketingPlanDraft>(
    key: Key,
    value: MarketingPlanDraft[Key]
  ) => void
  updateChannelCadence: (channelId: MarketingChannelId, value: number) => void
}) {
  return (
    <div>
      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="marketing-organization">Organization name</Label>
          <Input
            id="marketing-organization"
            name="organizationName"
            value={draft.organizationName}
            onChange={(event) =>
              updateDraft("organizationName", event.target.value)
            }
            maxLength={120}
            placeholder="Example: Willow Street Family Resource Network…"
            autoComplete="organization"
            className="min-h-11 text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="marketing-campaign">Campaign or period name</Label>
          <Input
            id="marketing-campaign"
            name="campaignName"
            value={draft.campaignName}
            onChange={(event) =>
              updateDraft("campaignName", event.target.value)
            }
            maxLength={120}
            placeholder="Example: Know your options…"
            className="min-h-11 text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="marketing-stage">Organization stage</Label>
          <Select
            value={draft.stage}
            onValueChange={(value) =>
              updateDraft("stage", value as DocumentationStageId)
            }
          >
            <SelectTrigger id="marketing-stage" className="min-h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="marketing-objective">Primary objective</Label>
          <Select
            value={draft.objective}
            onValueChange={(value) =>
              updateDraft("objective", value as MarketingObjectiveId)
            }
          >
            <SelectTrigger id="marketing-objective" className="min-h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MARKETING_OBJECTIVES.map((objective) => (
                <SelectItem key={objective.id} value={objective.id}>
                  {objective.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-xs leading-5">
            {
              MARKETING_OBJECTIVES.find(({ id }) => id === draft.objective)
                ?.description
            }
          </p>
        </div>

        <div className="space-y-2 lg:col-span-2">
          <Label htmlFor="marketing-audience">Primary audience</Label>
          <Textarea
            id="marketing-audience"
            name="primaryAudience"
            value={draft.primaryAudience}
            onChange={(event) =>
              updateDraft("primaryAudience", event.target.value)
            }
            maxLength={280}
            rows={3}
            placeholder="Describe one group by its relationship to the mission and the information or access need being served…"
            className="min-h-24 resize-y text-base"
          />
        </div>

        <div className="space-y-2 lg:col-span-2">
          <Label htmlFor="marketing-message">Main message</Label>
          <Textarea
            id="marketing-message"
            name="mainMessage"
            value={draft.mainMessage}
            onChange={(event) => updateDraft("mainMessage", event.target.value)}
            maxLength={500}
            rows={4}
            placeholder="Write the one to three sourced sentences the audience should understand…"
            className="min-h-28 resize-y text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="marketing-proof">Supporting proof</Label>
          <Textarea
            id="marketing-proof"
            name="proofPoint"
            value={draft.proofPoint}
            onChange={(event) => updateDraft("proofPoint", event.target.value)}
            maxLength={500}
            rows={4}
            placeholder="Add a cited fact, current measure, consented story, or an honest evidence limit…"
            className="min-h-32 resize-y text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="marketing-invitation">Primary invitation</Label>
          <Textarea
            id="marketing-invitation"
            name="invitation"
            value={draft.invitation}
            onChange={(event) => updateDraft("invitation", event.target.value)}
            maxLength={280}
            rows={4}
            placeholder="Name one voluntary action and the real destination where it can be completed…"
            className="min-h-32 resize-y text-base"
          />
        </div>
      </div>

      <fieldset className="border-t p-5 sm:p-6">
        <legend className="px-1 text-sm font-semibold">
          Planned outputs per month
        </legend>
        <p className="text-muted-foreground mt-1 text-xs leading-5">
          Set a maintainable cadence. Zero means the channel is outside this
          90-day period; no universal posting frequency is assumed.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {MARKETING_CHANNELS.map((channel) => (
            <div key={channel.id} className="border p-4">
              <Label htmlFor={`marketing-channel-${channel.id}`}>
                {channel.label}
              </Label>
              <p className="text-muted-foreground mt-1 min-h-10 text-xs leading-5">
                {channel.description}
              </p>
              <Input
                id={`marketing-channel-${channel.id}`}
                name={`marketing-channel-${channel.id}`}
                type="number"
                min={0}
                max={100}
                step={1}
                inputMode="numeric"
                value={draft.channelCadence[channel.id]}
                onChange={(event) =>
                  updateChannelCadence(
                    channel.id,
                    cadenceInput(event.target.value)
                  )
                }
                className="mt-3 min-h-11 text-base tabular-nums"
              />
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="grid gap-3 border-t p-5 sm:p-6">
        <legend className="px-1 text-sm font-semibold">
          Publishing readiness
        </legend>
        {[
          {
            key: "hasStoryPermissionProcess" as const,
            title: "Story and media permission is documented",
            description:
              "Scope, context, channels, duration, withdrawal, and asset rights are reviewable.",
          },
          {
            key: "hasContentReviewProcess" as const,
            title: "Content receives proportionate review",
            description:
              "Facts, accessibility, rights, privacy, disclosures, and risky claims have owners.",
          },
          {
            key: "hasLinkTrackingConvention" as const,
            title: "Campaign links use one naming convention",
            description:
              "Source, medium, campaign, and content terms remain lowercase and consistent.",
          },
        ].map((item) => (
          <label
            key={item.key}
            className="hover:bg-muted/35 flex min-h-14 cursor-pointer items-center gap-3 border p-4 transition-colors"
          >
            <Checkbox
              checked={draft[item.key]}
              onCheckedChange={(checked) =>
                updateDraft(item.key, checked === true)
              }
            />
            <span className="min-w-0">
              <span className="block text-sm font-medium">{item.title}</span>
              <span className="text-muted-foreground block text-xs leading-5">
                {item.description}
              </span>
            </span>
          </label>
        ))}
      </fieldset>
    </div>
  )
}
