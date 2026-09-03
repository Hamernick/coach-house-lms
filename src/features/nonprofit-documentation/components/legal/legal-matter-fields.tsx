import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  LEGAL_MATTER_CATEGORIES,
  LEGAL_MATTER_URGENCIES,
} from "../../lib/legal-plan"
import type {
  LegalMatterCategoryId,
  LegalMatterUrgencyId,
  LegalPlanDraft,
} from "../../legal-types"
import type { DocumentationStageId } from "../../types"
import { LegalPlanTextarea } from "./legal-plan-textarea"

const STAGES: Array<{ value: DocumentationStageId; label: string }> = [
  { value: "exploring", label: "Exploring" },
  { value: "forming", label: "Forming" },
  { value: "operating", label: "Operating" },
  { value: "growing", label: "Growing" },
]

export function LegalMatterFields({
  draft,
  updateDraft,
}: {
  draft: LegalPlanDraft
  updateDraft: <Key extends keyof LegalPlanDraft>(
    key: Key,
    value: LegalPlanDraft[Key]
  ) => void
}) {
  const category = LEGAL_MATTER_CATEGORIES.find(
    ({ id }) => id === draft.category
  )
  const urgency = LEGAL_MATTER_URGENCIES.find(({ id }) => id === draft.urgency)

  return (
    <div>
      <fieldset className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
        <legend className="px-1 text-sm font-semibold">
          Matter identity and triage
        </legend>
        <div className="space-y-2">
          <Label htmlFor="legal-organization">Organization name</Label>
          <Input
            id="legal-organization"
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
          <Label htmlFor="legal-matter-title">Working matter title</Label>
          <Input
            id="legal-matter-title"
            name="matterTitle"
            value={draft.matterTitle}
            onChange={(event) => updateDraft("matterTitle", event.target.value)}
            maxLength={140}
            placeholder="Example: Proposed related-party storefront lease…"
            className="min-h-11 text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="legal-stage">Organization stage</Label>
          <Select
            value={draft.stage}
            onValueChange={(value) =>
              updateDraft("stage", value as DocumentationStageId)
            }
          >
            <SelectTrigger id="legal-stage" className="min-h-11 w-full">
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
          <Label htmlFor="legal-category">Matter category</Label>
          <Select
            value={draft.category}
            onValueChange={(value) =>
              updateDraft("category", value as LegalMatterCategoryId)
            }
          >
            <SelectTrigger id="legal-category" className="min-h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEGAL_MATTER_CATEGORIES.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-xs leading-5">
            {category?.description} This organizes the brief; it does not
            classify the legal issue.
          </p>
        </div>
        <div className="space-y-2 lg:col-span-2">
          <Label htmlFor="legal-urgency">Working urgency</Label>
          <Select
            value={draft.urgency}
            onValueChange={(value) =>
              updateDraft("urgency", value as LegalMatterUrgencyId)
            }
          >
            <SelectTrigger id="legal-urgency" className="min-h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEGAL_MATTER_URGENCIES.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-xs leading-5">
            {urgency?.description} This selection does not determine an
            emergency, duty, notice period, or legal deadline.
          </p>
        </div>
        {draft.urgency === "immediate-safety" ? (
          <div
            className="border-foreground bg-foreground text-background p-4 lg:col-span-2"
            role="note"
          >
            <p className="text-sm font-semibold">
              Use qualified urgent channels now
            </p>
            <p className="text-background/75 mt-2 text-sm leading-6">
              Do not wait for this brief. Contact emergency, safeguarding,
              incident-response, insurer, regulator, and qualified legal
              channels as appropriate. Protect people first and avoid putting
              sensitive details into this device-local planning tool.
            </p>
          </div>
        ) : null}
        <LegalPlanTextarea
          id="legal-decision-question"
          label="Decision or response question"
          value={draft.decisionQuestion}
          maxLength={700}
          placeholder="State the decision, who must make it, the responsible outcome sought, and what must remain undecided until qualified review…"
          onChange={(value) => updateDraft("decisionQuestion", value)}
          wide
        />
        <LegalPlanTextarea
          id="legal-known-facts"
          label="Known facts and sources"
          value={draft.knownFacts}
          maxLength={900}
          placeholder="Record first-hand facts, attributed statements, exact dates, and source documents without adding conclusions…"
          onChange={(value) => updateDraft("knownFacts", value)}
        />
        <LegalPlanTextarea
          id="legal-assumptions-unknowns"
          label="Assumptions, claims, and unknowns"
          value={draft.assumptionsUnknowns}
          maxLength={900}
          placeholder="List what is assumed, disputed, unverified, missing, or still needs a qualified answer…"
          onChange={(value) => updateDraft("assumptionsUnknowns", value)}
        />
        <LegalPlanTextarea
          id="legal-affected-people"
          label="Affected people and participation"
          value={draft.affectedPeople}
          maxLength={700}
          placeholder="Identify affected groups, roles, decision-makers, reporters, witnesses, counterparties, and participation, access, privacy, or retaliation considerations…"
          onChange={(value) => updateDraft("affectedPeople", value)}
          wide
        />
      </fieldset>
    </div>
  )
}
