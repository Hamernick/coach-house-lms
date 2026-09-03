import { Checkbox } from "@/components/ui/checkbox"
import {
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"

import type { CrmPlanDraft } from "../../crm-types"
import { CrmPlanTextarea } from "./crm-plan-textarea"

export function CrmGovernanceFields({
  draft,
  updateDraft,
}: {
  draft: CrmPlanDraft
  updateDraft: <Key extends keyof CrmPlanDraft>(
    key: Key,
    value: CrmPlanDraft[Key]
  ) => void
}) {
  const safeguards = [
    {
      key: "hasMinimumNecessaryReview" as const,
      title:
        "Every proposed field has a stated decision purpose, source, less-sensitive-alternative review, owner, and minimum-necessary justification",
    },
    {
      key: "hasNoticePreferenceReview" as const,
      title:
        "Collection notice, permission where applicable, communication preferences, suppressions, corrections, access, language, and disability access were reviewed",
    },
    {
      key: "hasAccessIntegrationReview" as const,
      title:
        "Roles, administrators, former users, shared accounts, devices, integrations, exports, backups, contractors, vendors, and system exit were reviewed",
    },
    {
      key: "hasRetentionIncidentReview" as const,
      title:
        "Retention, deletion, preservation, restoration, incident response, evidence, notifications, communications, and responsible owners were reviewed",
    },
    {
      key: "hasLegalSectorReview" as const,
      title:
        "Current federal, state, Tribal, territorial, local, contract, funding, tax, fundraising, communications, health, education, employment, and other sector questions were reviewed where applicable",
    },
  ]

  return (
    <FieldSet className="border-t p-5 sm:p-6">
      <FieldLegend className="px-1">
        Collection, use, protection, and retirement
      </FieldLegend>
      <FieldGroup className="grid gap-5 lg:grid-cols-2">
        <CrmPlanTextarea
          id="crm-collection-notice"
          label="Collection, source, notice, and consent"
          value={draft.collectionNoticeConsent}
          maxLength={900}
          placeholder="Describe how information enters, why it is needed, what people are told, what permission or authority applies, and how changes or withdrawal work…"
          onChange={(value) => updateDraft("collectionNoticeConsent", value)}
        />
        <CrmPlanTextarea
          id="crm-communication-preferences"
          label="Communication preferences and suppressions"
          value={draft.communicationPreferences}
          maxLength={900}
          placeholder="Define channel choices, relationship basis, language and format, opt-outs, do-not-contact status, suppression flow, owner, and evidence…"
          onChange={(value) => updateDraft("communicationPreferences", value)}
        />
        <CrmPlanTextarea
          id="crm-identity-deduplication"
          label="Identity and duplicate handling"
          value={draft.identityDeduplication}
          maxLength={700}
          placeholder="Explain identifiers, possible-match review, merge authority, source preservation, reversible correction, and why name alone is insufficient…"
          onChange={(value) => updateDraft("identityDeduplication", value)}
        />
        <CrmPlanTextarea
          id="crm-relationship-lifecycle"
          label="Relationship stages and follow-through"
          value={draft.relationshipLifecycle}
          maxLength={800}
          placeholder="Define neutral stages, allowed next steps, commitments, owners, review dates, pauses, declines, and closure without ranking human value…"
          onChange={(value) => updateDraft("relationshipLifecycle", value)}
        />
        <CrmPlanTextarea
          id="crm-access-roles"
          label="Access roles and account administration"
          value={draft.accessRoles}
          maxLength={800}
          placeholder="Map minimum role access, administrators, approvals, account changes, contractors, volunteers, exports, shared-account limits, and review cadence…"
          onChange={(value) => updateDraft("accessRoles", value)}
        />
        <CrmPlanTextarea
          id="crm-data-quality"
          label="Data quality, correction, and provenance"
          value={draft.dataQualityCorrection}
          maxLength={800}
          placeholder="Plan source capture, verification, correction requests, bounce and returned-mail handling, stale records, change history, and accountable review…"
          onChange={(value) => updateDraft("dataQualityCorrection", value)}
        />
        <CrmPlanTextarea
          id="crm-retention-deletion"
          label="Retention, archive, preservation, and deletion"
          value={draft.retentionDeletion}
          maxLength={900}
          placeholder="Define purpose-based review triggers, source-record duties, restrictions, legal holds, archive, deletion, verification, suppression, and downstream handling…"
          onChange={(value) => updateDraft("retentionDeletion", value)}
        />
        <CrmPlanTextarea
          id="crm-integrations-exports"
          label="Integrations, exports, backups, and service providers"
          value={draft.integrationsExports}
          maxLength={900}
          placeholder="Inventory each data flow, fields, direction, frequency, purpose, owner, failure path, access, contract, backup, and exit process…"
          onChange={(value) => updateDraft("integrationsExports", value)}
        />
        <CrmPlanTextarea
          id="crm-security-incident"
          label="Security and incident response"
          value={draft.securityIncident}
          maxLength={900}
          placeholder="Plan accounts, authentication, devices, exports, recovery, vendor escalation, incident roles, evidence, qualified notification review, and communications…"
          onChange={(value) => updateDraft("securityIncident", value)}
        />
        <CrmPlanTextarea
          id="crm-accessibility-language"
          label="Accessible and language-appropriate participation"
          value={draft.accessibilityLanguage}
          maxLength={800}
          placeholder="Plan accessible collection, notice, preference, correction, opt-out, accommodation, language, format, and support paths with minimum detail…"
          onChange={(value) => updateDraft("accessibilityLanguage", value)}
        />
        <CrmPlanTextarea
          id="crm-reporting-decision"
          label="Reporting, learning, and decisions"
          value={draft.reportingDecision}
          maxLength={800}
          placeholder="Name the process measures and decisions to review without scoring people, inferring sensitive traits, or calling relationship activity impact…"
          onChange={(value) => updateDraft("reportingDecision", value)}
        />
        <CrmPlanTextarea
          id="crm-vendor-migration"
          label="Vendor, spreadsheet, and migration requirements"
          value={draft.vendorMigration}
          maxLength={900}
          placeholder="Define capacity, accessibility, permissions, exports, integrations, support, contract, cost, test, reconciliation, rollback, training, and exit requirements…"
          onChange={(value) => updateDraft("vendorMigration", value)}
        />
      </FieldGroup>
      <FieldSet className="mt-3 border-t pt-5">
        <FieldLegend>Human-review safeguards</FieldLegend>
        <FieldGroup>
          {safeguards.map((item) => (
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
        </FieldGroup>
        <FieldDescription className="leading-5">
          A checked box records a team review. It does not establish necessity,
          consent, permission, accuracy, accessibility, security, compliance,
          appropriate retention, or fitness for use.
        </FieldDescription>
      </FieldSet>
    </FieldSet>
  )
}
