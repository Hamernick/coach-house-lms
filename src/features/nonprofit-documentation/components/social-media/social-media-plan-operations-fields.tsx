import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { SOCIAL_MEDIA_CHANNELS } from "../../lib/social-media-plan"
import type { SocialMediaChannelId, SocialMediaPlanDraft } from "../../types"

function boundedCadence(value: string) {
  const cadence = Number(value)
  if (!Number.isFinite(cadence)) return 0
  return Math.min(100, Math.max(0, Math.round(cadence)))
}

export function SocialMediaPlanOperationsFields({
  draft,
  updateDraft,
  updateChannelCadence,
  part,
}: {
  draft: SocialMediaPlanDraft
  part: "channels" | "safeguards"
  updateDraft: <Key extends keyof SocialMediaPlanDraft>(
    key: Key,
    value: SocialMediaPlanDraft[Key]
  ) => void
  updateChannelCadence: (channel: SocialMediaChannelId, value: number) => void
}) {
  return (
    <>
      {part === "channels" && (
        <fieldset className="p-4">
          <legend className="px-1 text-sm font-semibold">
            User-entered outputs per week
          </legend>
          <p className="text-muted-foreground mt-1 text-xs leading-5">
            Zero excludes a channel. These are planning inputs, not recommended
            frequencies.
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {SOCIAL_MEDIA_CHANNELS.map((channel) => (
              <div key={channel.id} className="rounded-xl border p-4">
                <Label htmlFor={`social-channel-${channel.id}`}>
                  {channel.label}
                </Label>
                <p className="text-muted-foreground mt-1 min-h-10 text-xs leading-5">
                  {channel.description}
                </p>
                <Input
                  id={`social-channel-${channel.id}`}
                  name={`social-channel-${channel.id}`}
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  inputMode="numeric"
                  value={draft.channelCadence[channel.id]}
                  onChange={(event) =>
                    updateChannelCadence(
                      channel.id,
                      boundedCadence(event.target.value)
                    )
                  }
                  className="mt-3 min-h-11 text-sm tabular-nums"
                />
              </div>
            ))}
          </div>
        </fieldset>
      )}

      {part === "safeguards" && (
        <fieldset className="grid gap-3 p-4 sm:p-4 lg:grid-cols-2">
          <legend className="px-1 text-sm font-semibold">
            Ownership and safeguards
          </legend>
          {[
            {
              id: "social-response-protocol",
              label: "Response and moderation protocol",
              key: "responseProtocol" as const,
              maxLength: 700,
              placeholder:
                "Define public answers, private handoffs, response timing, moderation, corrections, and records…",
            },
            {
              id: "social-approval-owner",
              label: "Approval owner and backup",
              key: "approvalOwner" as const,
              maxLength: 240,
              placeholder: "Name the authorized approver and a backup…",
            },
            {
              id: "social-escalation-owner",
              label: "Escalation owner and conditions",
              key: "escalationOwner" as const,
              maxLength: 240,
              placeholder:
                "Name who handles safety, legal, privacy, media, political, service, or crisis concerns…",
            },
          ].map((item, index) => (
            <div
              key={item.id}
              className={`space-y-2 ${index === 0 ? "lg:col-span-2" : ""}`}
            >
              <Label htmlFor={item.id}>{item.label}</Label>
              <Textarea
                id={item.id}
                name={item.id}
                value={draft[item.key]}
                onChange={(event) => updateDraft(item.key, event.target.value)}
                maxLength={item.maxLength}
                rows={4}
                placeholder={item.placeholder}
                className="min-h-28 resize-y text-sm"
              />
            </div>
          ))}
          <div className="grid gap-3 lg:col-span-2">
            {[
              {
                key: "hasStoryPermissionReview" as const,
                title: "Story, media permission, and rights were reviewed",
              },
              {
                key: "hasClaimSourceReview" as const,
                title:
                  "Sources, claims, limits, links, and disclosures were reviewed",
              },
              {
                key: "hasAccessibilityReview" as const,
                title: "Content and destination accessibility were reviewed",
              },
              {
                key: "hasApprovalEscalationPlan" as const,
                title:
                  "Approval, response, correction, and escalation are assigned",
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
      )}
    </>
  )
}
