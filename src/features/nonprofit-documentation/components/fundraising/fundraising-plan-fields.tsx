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

import { FUNDRAISING_CHANNELS } from "../../lib/fundraising-plan"
import type {
  DocumentationStageId,
  FundraisingChannelId,
  FundraisingPlanDraft,
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

const PERIOD_OPTIONS: Array<{
  value: FundraisingPlanDraft["periodMonths"]
  label: string
}> = [
  { value: 3, label: "3 months" },
  { value: 6, label: "6 months" },
  { value: 12, label: "12 months" },
  { value: 18, label: "18 months" },
]

function moneyInput(value: string) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return 0
  return Math.min(1_000_000_000, Math.max(0, amount))
}

export function FundraisingPlanFields({
  draft,
  updateDraft,
  updateChannelTarget,
}: {
  draft: FundraisingPlanDraft
  updateDraft: <Key extends keyof FundraisingPlanDraft>(
    key: Key,
    value: FundraisingPlanDraft[Key]
  ) => void
  updateChannelTarget: (channelId: FundraisingChannelId, value: number) => void
}) {
  return (
    <div>
      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
        <div className="space-y-2 lg:col-span-2">
          <Label htmlFor="fundraising-organization">Organization name</Label>
          <Input
            id="fundraising-organization"
            name="organizationName"
            value={draft.organizationName}
            onChange={(event) =>
              updateDraft("organizationName", event.target.value)
            }
            maxLength={120}
            placeholder="Example: East Harbor Youth Arts…"
            autoComplete="organization"
            className="min-h-11 text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fundraising-stage">Organization stage</Label>
          <Select
            value={draft.stage}
            onValueChange={(value) =>
              updateDraft("stage", value as DocumentationStageId)
            }
          >
            <SelectTrigger id="fundraising-stage" className="min-h-11 w-full">
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
          <Label htmlFor="fundraising-period">Planning period</Label>
          <Select
            value={String(draft.periodMonths)}
            onValueChange={(value) =>
              updateDraft(
                "periodMonths",
                Number(value) as FundraisingPlanDraft["periodMonths"]
              )
            }
          >
            <SelectTrigger id="fundraising-period" className="min-h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fundraising-goal">Total funding goal</Label>
          <Input
            id="fundraising-goal"
            name="fundingGoal"
            type="number"
            min={0}
            max={1_000_000_000}
            step="100"
            inputMode="decimal"
            value={draft.fundingGoal}
            onChange={(event) =>
              updateDraft("fundingGoal", moneyInput(event.target.value))
            }
            className="min-h-11 text-base tabular-nums"
          />
          <p className="text-muted-foreground text-xs leading-5">
            Use the approved cost of the work, including fundraising costs.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fundraising-committed">Committed funds</Label>
          <Input
            id="fundraising-committed"
            name="committedFunds"
            type="number"
            min={0}
            max={1_000_000_000}
            step="100"
            inputMode="decimal"
            value={draft.committedFunds}
            onChange={(event) =>
              updateDraft("committedFunds", moneyInput(event.target.value))
            }
            className="min-h-11 text-base tabular-nums"
          />
          <p className="text-muted-foreground text-xs leading-5">
            Include only secured resources available for this plan.
          </p>
        </div>
      </div>

      <fieldset className="border-t p-5 sm:p-6">
        <legend className="px-1 text-sm font-semibold">
          Planned amounts by channel
        </legend>
        <p className="text-muted-foreground mt-1 text-xs leading-5">
          Enter planning amounts, not predictions. Leave a channel at zero when
          it is not part of this period.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {FUNDRAISING_CHANNELS.map((channel) => (
            <div key={channel.id} className="border p-4">
              <Label htmlFor={`channel-${channel.id}`}>{channel.label}</Label>
              <p className="text-muted-foreground mt-1 min-h-10 text-xs leading-5">
                {channel.description}
              </p>
              <Input
                id={`channel-${channel.id}`}
                name={`channel-${channel.id}`}
                type="number"
                min={0}
                max={1_000_000_000}
                step="100"
                inputMode="decimal"
                value={draft.channelTargets[channel.id]}
                onChange={(event) =>
                  updateChannelTarget(
                    channel.id,
                    moneyInput(event.target.value)
                  )
                }
                className="mt-3 min-h-11 text-base tabular-nums"
              />
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="grid gap-3 border-t p-5 sm:p-6">
        <legend className="px-1 text-sm font-semibold">System readiness</legend>
        <label className="hover:bg-muted/35 flex min-h-14 cursor-pointer items-center gap-3 border p-4 transition-colors">
          <Checkbox
            checked={draft.hasCaseForSupport}
            onCheckedChange={(checked) =>
              updateDraft("hasCaseForSupport", checked === true)
            }
          />
          <span className="min-w-0">
            <span className="block text-sm font-medium">
              We have a reviewed case for support
            </span>
            <span className="text-muted-foreground block text-xs leading-5">
              Written in our voice and grounded in the approved work and budget.
            </span>
          </span>
        </label>
        <label className="hover:bg-muted/35 flex min-h-14 cursor-pointer items-center gap-3 border p-4 transition-colors">
          <Checkbox
            checked={draft.hasGiftAcknowledgmentProcess}
            onCheckedChange={(checked) =>
              updateDraft("hasGiftAcknowledgmentProcess", checked === true)
            }
          />
          <span className="min-w-0">
            <span className="block text-sm font-medium">
              We can acknowledge and track gifts
            </span>
            <span className="text-muted-foreground block text-xs leading-5">
              Including terms, restrictions, privacy preferences, and follow-up.
            </span>
          </span>
        </label>
      </fieldset>
    </div>
  )
}
