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
  SOCIAL_MEDIA_CAMPAIGN_WEEKS,
  SOCIAL_MEDIA_CHANNELS,
  SOCIAL_MEDIA_OBJECTIVES,
} from "../../lib/social-media-plan"
import type {
  DocumentationStageId,
  SocialMediaChannelId,
  SocialMediaObjectiveId,
  SocialMediaPlanDraft,
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

export function SocialMediaPlanFields({
  draft,
  updateDraft,
  part,
}: {
  draft: SocialMediaPlanDraft
  updateDraft: <Key extends keyof SocialMediaPlanDraft>(
    key: Key,
    value: SocialMediaPlanDraft[Key]
  ) => void
  part: "purpose" | "message"
}) {
  return (
    <div>
      {part === "purpose" && (
        <fieldset className="grid gap-3 p-4 sm:p-4 lg:grid-cols-2">
          <legend className="px-1 text-sm font-semibold">
            Purpose and audience
          </legend>
          <div className="space-y-2">
            <Label htmlFor="social-organization">Organization name</Label>
            <Input
              id="social-organization"
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
            <Label htmlFor="social-campaign">Campaign or period name</Label>
            <Input
              id="social-campaign"
              name="campaignName"
              value={draft.campaignName}
              onChange={(event) =>
                updateDraft("campaignName", event.target.value)
              }
              maxLength={120}
              placeholder="Example: Know your options…"
              className="min-h-11 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="social-stage">Organization stage</Label>
            <Select
              value={draft.stage}
              onValueChange={(value) =>
                updateDraft("stage", value as DocumentationStageId)
              }
            >
              <SelectTrigger id="social-stage" className="min-h-11 w-full">
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
            <Label htmlFor="social-objective">Primary objective</Label>
            <Select
              value={draft.objective}
              onValueChange={(value) =>
                updateDraft("objective", value as SocialMediaObjectiveId)
              }
            >
              <SelectTrigger id="social-objective" className="min-h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOCIAL_MEDIA_OBJECTIVES.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs leading-5">
              {
                SOCIAL_MEDIA_OBJECTIVES.find(({ id }) => id === draft.objective)
                  ?.description
              }
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="social-weeks">Campaign period</Label>
            <Select
              value={String(draft.campaignWeeks)}
              onValueChange={(value) =>
                updateDraft("campaignWeeks", Number(value) as 4 | 8 | 12)
              }
            >
              <SelectTrigger id="social-weeks" className="min-h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOCIAL_MEDIA_CAMPAIGN_WEEKS.map((weeks) => (
                  <SelectItem key={weeks} value={String(weeks)}>
                    {weeks} weeks
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="social-preview-channel">Preview channel</Label>
            <Select
              value={draft.previewChannel}
              onValueChange={(value) =>
                updateDraft("previewChannel", value as SocialMediaChannelId)
              }
            >
              <SelectTrigger
                id="social-preview-channel"
                className="min-h-11 w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOCIAL_MEDIA_CHANNELS.map((channel) => (
                  <SelectItem key={channel.id} value={channel.id}>
                    {channel.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DraftTextarea
            id="social-primary-audience"
            label="Primary audience"
            value={draft.primaryAudience}
            maxLength={400}
            placeholder="Describe one group, its relationship to the mission, and the information or access need being served…"
            onChange={(value) => updateDraft("primaryAudience", value)}
          />
          <DraftTextarea
            id="social-desired-action"
            label="Desired action"
            value={draft.desiredAction}
            maxLength={300}
            placeholder="Name one voluntary action the audience can actually complete…"
            onChange={(value) => updateDraft("desiredAction", value)}
          />
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="social-destination">Destination URL</Label>
            <Input
              id="social-destination"
              name="destinationUrl"
              type="url"
              inputMode="url"
              autoComplete="url"
              value={draft.destinationUrl}
              onChange={(event) =>
                updateDraft("destinationUrl", event.target.value)
              }
              maxLength={1000}
              placeholder="https://example.org/program…"
              className="min-h-11 text-sm"
            />
            <p className="text-muted-foreground text-xs leading-5">
              Used only to build a local preview link. Nothing is opened or
              sent.
            </p>
          </div>
        </fieldset>
      )}

      {part === "message" && (
        <fieldset className="grid gap-3 p-4 sm:p-4 lg:grid-cols-2">
          <legend className="px-1 text-sm font-semibold">
            Source and content
          </legend>
          <DraftTextarea
            id="social-main-message"
            label="Main message"
            value={draft.mainMessage}
            maxLength={700}
            placeholder="Write the sourced message this audience should understand, including relevant limits…"
            onChange={(value) => updateDraft("mainMessage", value)}
            wide
          />
          <DraftTextarea
            id="social-source-evidence"
            label="Source or evidence"
            value={draft.sourceEvidence}
            maxLength={900}
            placeholder="Name the source, owner, review date, supported facts, and evidence limits…"
            onChange={(value) => updateDraft("sourceEvidence", value)}
          />
          <DraftTextarea
            id="social-permission-context"
            label="Story and permission context"
            value={draft.storyPermissionContext}
            maxLength={700}
            placeholder="Describe whether people, stories, quotes, images, voices, or sensitive details appear and what review applies…"
            onChange={(value) => updateDraft("storyPermissionContext", value)}
          />
          <DraftTextarea
            id="social-voice-guidance"
            label="Voice guidance"
            value={draft.voiceGuidance}
            maxLength={400}
            placeholder="Define tone, language, terms to use, and terms to avoid…"
            onChange={(value) => updateDraft("voiceGuidance", value)}
          />
          <DraftTextarea
            id="social-post-copy"
            label="Draft post copy"
            value={draft.postCopy}
            maxLength={2200}
            placeholder="Draft the working post. Keep material limits, disclosures, and the invitation visible…"
            onChange={(value) => updateDraft("postCopy", value)}
          />
          <DraftTextarea
            id="social-visual-description"
            label="Visual direction"
            value={draft.visualDescription}
            maxLength={700}
            placeholder="Describe the intended image, carousel, or video and the communication job it performs…"
            onChange={(value) => updateDraft("visualDescription", value)}
          />
          <DraftTextarea
            id="social-alternative-text"
            label="Alternative text"
            value={draft.alternativeText}
            maxLength={700}
            placeholder="Convey the image's relevant meaning and any essential text without writing 'image of'…"
            onChange={(value) => updateDraft("alternativeText", value)}
          />
          <DraftTextarea
            id="social-captions-plan"
            label="Captions or transcript plan"
            value={draft.captionsPlan}
            maxLength={700}
            placeholder="Plan reviewed captions or a transcript, including speakers, meaningful sounds, language, and timing…"
            onChange={(value) => updateDraft("captionsPlan", value)}
          />
          <DraftTextarea
            id="social-link-label"
            label="Descriptive link label"
            value={draft.linkLabel}
            maxLength={160}
            placeholder="Example: Review eligibility and request an appointment…"
            onChange={(value) => updateDraft("linkLabel", value)}
          />
        </fieldset>
      )}
    </div>
  )
}
