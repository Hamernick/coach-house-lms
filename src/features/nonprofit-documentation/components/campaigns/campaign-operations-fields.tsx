import { Checkbox } from "@/components/ui/checkbox"

import type { CampaignPlanDraft } from "../../campaign-types"
import { CampaignPlanTextarea } from "./campaign-plan-textarea"

export function CampaignOperationsFields({
  draft,
  updateDraft,
}: {
  draft: CampaignPlanDraft
  updateDraft: <Key extends keyof CampaignPlanDraft>(
    key: Key,
    value: CampaignPlanDraft[Key]
  ) => void
}) {
  return (
    <fieldset className="grid gap-5 border-t p-5 sm:p-6 lg:grid-cols-2">
      <legend className="px-1 text-sm font-semibold">
        Message, delivery, safeguards, and learning
      </legend>
      <CampaignPlanTextarea
        id="campaign-main-message"
        label="One main message"
        value={draft.mainMessage}
        maxLength={700}
        placeholder="Write the one message the primary audience should understand, using plain language and preserving material limits…"
        onChange={(value) => updateDraft("mainMessage", value)}
      />
      <CampaignPlanTextarea
        id="campaign-supporting-evidence"
        label="Supporting evidence, claims, and limits"
        value={draft.supportingEvidence}
        maxLength={900}
        placeholder="List current sources, owners, review dates, claim boundaries, definitions, uncertainty, eligibility, and what must not be promised…"
        onChange={(value) => updateDraft("supportingEvidence", value)}
      />
      <CampaignPlanTextarea
        id="campaign-offer-destination"
        label="Offer and destination"
        value={draft.offerDestination}
        maxLength={800}
        placeholder="Describe where a person acts and how it explains fit, cost, timing, access, privacy, expectations, contact, and next steps…"
        onChange={(value) => updateDraft("offerDestination", value)}
      />
      <CampaignPlanTextarea
        id="campaign-channel-roles"
        label="Channel and partner roles"
        value={draft.channelRoles}
        maxLength={900}
        placeholder="Give each email, text, social, web, print, media, event, paid, or partner path one audience-based role, owner, and destination…"
        onChange={(value) => updateDraft("channelRoles", value)}
      />
      <CampaignPlanTextarea
        id="campaign-timeline-milestones"
        label="Timeline and milestones"
        value={draft.timelineMilestones}
        maxLength={900}
        placeholder="Plan source freeze, review, small launch, distribution, live checks, response, correction, closeout, and renewed-review triggers…"
        onChange={(value) => updateDraft("timelineMilestones", value)}
      />
      <CampaignPlanTextarea
        id="campaign-budget-capacity"
        label="Budget, delivery, and response capacity"
        value={draft.budgetCapacity}
        maxLength={800}
        placeholder="Record authorized spending, staff and volunteer time, service or event limits, partner dependencies, contingency, and pause thresholds…"
        onChange={(value) => updateDraft("budgetCapacity", value)}
      />
      <CampaignPlanTextarea
        id="campaign-owners-approvals"
        label="Owners, approvals, and backups"
        value={draft.ownersApprovals}
        maxLength={800}
        placeholder="Assign objective, source, content, access, budget, publishing, destination, response, measurement, correction, and stop authority…"
        onChange={(value) => updateDraft("ownersApprovals", value)}
      />
      <CampaignPlanTextarea
        id="campaign-accessibility-language"
        label="Accessibility and language access"
        value={draft.accessibilityLanguage}
        maxLength={800}
        placeholder="Plan language versions, plain language, alternative text, captions, transcripts, documents, forms, events, effective communication, and access requests…"
        onChange={(value) => updateDraft("accessibilityLanguage", value)}
      />
      <CampaignPlanTextarea
        id="campaign-consent-privacy"
        label="Consent, permissions, privacy, and security"
        value={draft.consentPrivacy}
        maxLength={800}
        placeholder="Record story and asset permissions, list source, purpose, channel, consent, opt-outs, data minimization, access, retention, sharing, and withdrawal…"
        onChange={(value) => updateDraft("consentPrivacy", value)}
      />
      <CampaignPlanTextarea
        id="campaign-compliance-review"
        label="Legal, tax, funding, and channel review"
        value={draft.complianceReview}
        maxLength={900}
        placeholder="List organization status, jurisdictions, fundraising, lobbying, candidate or ballot context, email, text, disclosures, grants, contracts, rights, and platform sources to review…"
        onChange={(value) => updateDraft("complianceReview", value)}
      />
      <CampaignPlanTextarea
        id="campaign-response-escalation"
        label="Response, correction, pause, and escalation"
        value={draft.responseEscalation}
        maxLength={800}
        placeholder="Define routine response, private handoff, access support, opt-outs, complaints, corrections, misinformation, safety, privacy, press, legal review, and pause rules…"
        onChange={(value) => updateDraft("responseEscalation", value)}
      />
      <CampaignPlanTextarea
        id="campaign-measurement-plan"
        label="Measurement plan and limitations"
        value={draft.measurementPlan}
        maxLength={900}
        placeholder="Define distribution, response, destination use, completed actions, access, cost, workload, program evidence, attribution, duplication, and collection limits…"
        onChange={(value) => updateDraft("measurementPlan", value)}
      />
      <CampaignPlanTextarea
        id="campaign-learning-decision"
        label="Closeout and learning decision"
        value={draft.learningDecision}
        maxLength={700}
        placeholder="Name the maintain, revise, repeat, expand, pause, archive, or stop decision, its evidence, limits, owner, and next review date…"
        onChange={(value) => updateDraft("learningDecision", value)}
        wide
      />
      <div className="grid gap-3 lg:col-span-2">
        {[
          {
            key: "hasClaimReview" as const,
            title:
              "Material facts, claims, dates, eligibility, offers, quotes, statistics, outcomes, sources, and limitations were reviewed",
          },
          {
            key: "hasAccessibilityReview" as const,
            title:
              "Relevant language, disability, format, destination, event, and effective-communication access was reviewed with accountable people",
          },
          {
            key: "hasConsentPrivacyReview" as const,
            title:
              "Stories, assets, contact lists, tracking, consent, permissions, opt-outs, privacy, security, sharing, and withdrawal were reviewed",
          },
          {
            key: "hasLegalChannelReview" as const,
            title:
              "Current legal, tax, fundraising, lobbying, election, funding, contract, intellectual-property, disclosure, and channel questions were reviewed",
          },
          {
            key: "hasDeliveryCapacityReview" as const,
            title:
              "Budget, authority, delivery, service or event limits, response load, backups, contingency, correction, escalation, and pause capacity were reviewed",
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
            <span className="text-sm leading-6">{item.title}</span>
          </label>
        ))}
      </div>
      <p className="text-muted-foreground text-xs leading-5 lg:col-span-2">
        A checked box records a team review. It does not prove the campaign is
        accurate, authorized, accessible, permitted, compliant, safe, adequately
        resourced, or likely to work.
      </p>
    </fieldset>
  )
}
