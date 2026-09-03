import { Checkbox } from "@/components/ui/checkbox"

import type { LegalPlanDraft } from "../../legal-types"
import { LegalPlanTextarea } from "./legal-plan-textarea"

export function LegalOperationsFields({
  draft,
  updateDraft,
}: {
  draft: LegalPlanDraft
  updateDraft: <Key extends keyof LegalPlanDraft>(
    key: Key,
    value: LegalPlanDraft[Key]
  ) => void
}) {
  return (
    <fieldset className="grid gap-5 border-t p-5 sm:p-6 lg:grid-cols-2">
      <legend className="px-1 text-sm font-semibold">
        Scope, referral, and follow-through
      </legend>
      <LegalPlanTextarea
        id="legal-jurisdictions-locations"
        label="Jurisdictions and locations"
        value={draft.jurisdictionsLocations}
        maxLength={700}
        placeholder="Map entity, service, work, fundraising, property, data, remote, online, federal, state, Tribal, territorial, and local locations to verify…"
        onChange={(value) => updateDraft("jurisdictionsLocations", value)}
      />
      <LegalPlanTextarea
        id="legal-timeline-deadlines"
        label="Timeline and stated dates"
        value={draft.timelineDeadlines}
        maxLength={700}
        placeholder="Record when events and documents occurred, when material was received, every stated date, and which deadlines remain unverified…"
        onChange={(value) => updateDraft("timelineDeadlines", value)}
      />
      <LegalPlanTextarea
        id="legal-governing-documents"
        label="Governing documents and primary sources"
        value={draft.governingDocuments}
        maxLength={900}
        placeholder="List current organizing documents, bylaws, resolutions, policies, agreements, grants, restrictions, licenses, insurance, filings, and agency sources…"
        onChange={(value) => updateDraft("governingDocuments", value)}
      />
      <LegalPlanTextarea
        id="legal-actions-communications"
        label="Actions and communications to date"
        value={draft.actionsCommunications}
        maxLength={900}
        placeholder="Record protective steps, commitments, notices, acknowledgments, public statements, contacts, temporary controls, and actions that should pause…"
        onChange={(value) => updateDraft("actionsCommunications", value)}
      />
      <LegalPlanTextarea
        id="legal-authority-conflicts"
        label="Authority, interests, and conflicts"
        value={draft.authorityConflicts}
        maxLength={800}
        placeholder="Identify board, officer, staff, sponsor, funder, signer, investigator, and communication authority plus related parties, disclosures, recusals, and alternatives…"
        onChange={(value) => updateDraft("authorityConflicts", value)}
      />
      <LegalPlanTextarea
        id="legal-safety-rights-access"
        label="Safety, rights, access, and continuity"
        value={draft.safetyRightsAccess}
        maxLength={800}
        placeholder="Identify immediate danger, safeguarding, retaliation, discrimination, accessibility, cybersecurity, property, service, and qualified routing questions…"
        onChange={(value) => updateDraft("safetyRightsAccess", value)}
      />
      <LegalPlanTextarea
        id="legal-evidence-preservation"
        label="Evidence and preservation"
        value={draft.evidencePreservation}
        maxLength={800}
        placeholder="List originals, custodians, systems, logs, physical items, routine deletion, access, handling, and preservation questions for counsel…"
        onChange={(value) => updateDraft("evidencePreservation", value)}
      />
      <LegalPlanTextarea
        id="legal-confidentiality-data"
        label="Confidentiality and data boundary"
        value={draft.confidentialityDataBoundary}
        maxLength={800}
        placeholder="Define minimum necessary information, excluded sensitive details, approved systems, access roles, secure channels, and questions for counsel…"
        onChange={(value) => updateDraft("confidentialityDataBoundary", value)}
      />
      <LegalPlanTextarea
        id="legal-counsel-referral"
        label="Counsel and specialist referral"
        value={draft.counselReferral}
        maxLength={800}
        placeholder="Describe needed jurisdiction and subject expertise, licensing check, engagement scope, conflicts check, fee approval, secure channel, documents, timing, and questions…"
        onChange={(value) => updateDraft("counselReferral", value)}
      />
      <LegalPlanTextarea
        id="legal-decision-follow-up"
        label="Decision, implementation, and follow-up"
        value={draft.decisionFollowUp}
        maxLength={800}
        placeholder="Plan how advice, authority, recusal, options, decision, conditions, notices, owners, completion evidence, review date, and closure will be recorded…"
        onChange={(value) => updateDraft("decisionFollowUp", value)}
      />
      <div className="grid gap-3 lg:col-span-2">
        {[
          {
            key: "hasUrgentSafetyReview" as const,
            title:
              "Immediate safety, safeguarding, rights, access, incident, evidence, insurer, and reporting questions were reviewed through qualified channels",
          },
          {
            key: "hasAuthorityConflictReview" as const,
            title:
              "Governing authority, delegations, affected people, related parties, conflicts, recusals, and alternate routes were reviewed",
          },
          {
            key: "hasJurisdictionSourceReview" as const,
            title:
              "Current governing documents and federal, state, Tribal, territorial, local, contract, grant, license, and insurance sources were reviewed",
          },
          {
            key: "hasQualifiedCounselReview" as const,
            title:
              "A licensed attorney qualified for the relevant jurisdiction and subject reviewed the matter before consequential action",
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
        A checked box records that your team performed a review. It does not
        prove the review was complete, correct, current, privileged,
        confidential, authorized, or legally sufficient.
      </p>
    </fieldset>
  )
}
