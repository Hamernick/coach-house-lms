"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { CampaignPlanDraft } from "../../campaign-types"
import {
  buildAdGrantsCampaignTemplate,
  type AdGrantsCampaignGoal,
} from "../../lib/ad-grants-campaign-template"
import { DEFAULT_CAMPAIGN_PLAN } from "../../lib/campaign-plan"

export function AdGrantsCampaignStarter({
  draft,
  onLoad,
}: {
  draft: CampaignPlanDraft
  onLoad: (draft: CampaignPlanDraft) => void
}) {
  const params = useSearchParams()
  const [goal, setGoal] = useState<AdGrantsCampaignGoal>("fundraising")
  if (params.get("template") !== "ad-grants") return null
  return (
    <div className="bg-muted/30 space-y-4 border-b p-4 sm:p-4">
      <div>
        <h3 className="font-semibold">Start an Ad Grants campaign</h3>
        <p className="text-muted-foreground mt-1 text-sm leading-5">
          Choose the action you want to measure. The starter keeps your
          organization name and stage; replace the bracketed prompts with your
          own details.
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <Field className="w-full sm:max-w-xs">
          <FieldLabel htmlFor="ad-grants-goal">Campaign goal</FieldLabel>
          <Select
            value={goal}
            onValueChange={(value) => setGoal(value as AdGrantsCampaignGoal)}
          >
            <SelectTrigger id="ad-grants-goal" className="min-h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fundraising">Fundraising</SelectItem>
              <SelectItem value="volunteer-recruitment">
                Volunteer recruitment
              </SelectItem>
              <SelectItem value="service-access">Program outreach</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Button
          type="button"
          className="min-h-11 rounded-full"
          onClick={() => {
            if (
              JSON.stringify(draft) !== JSON.stringify(DEFAULT_CAMPAIGN_PLAN) &&
              !window.confirm(
                "Replace this campaign brief with the Ad Grants starter? Your organization name and stage will be kept."
              )
            )
              return
            onLoad(buildAdGrantsCampaignTemplate(goal, draft))
            const url = new URL(window.location.href)
            url.searchParams.delete("template")
            url.searchParams.delete("step")
            window.history.replaceState(
              null,
              "",
              `${url.pathname}${url.search}#sandbox`
            )
          }}
        >
          Use starter
        </Button>
      </div>
    </div>
  )
}
