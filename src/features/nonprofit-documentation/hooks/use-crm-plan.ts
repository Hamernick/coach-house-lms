"use client"

import { useDocumentationDraftPersistence } from "./use-documentation-draft-persistence"

import { useCallback, useState } from "react"

import type { CrmFieldDraft, CrmPlanDraft } from "../crm-types"
import {
  CRM_PLAN_STORAGE_KEY,
  DEFAULT_CRM_PLAN,
  MAX_CRM_FIELDS,
  createCrmField,
  sanitizeCrmPlan,
} from "../lib/crm-plan"

const EXAMPLE_CRM_PLAN: CrmPlanDraft = {
  version: 1,
  organizationName: "Willow Street Family Resource Network",
  planName: "Shared relationship record pilot",
  stage: "forming",
  relationshipContext: "mixed",
  reviewMonths: 3,
  systemPurpose:
    "Give authorized fundraising, volunteer, partnership, and program-access owners enough shared context to honor preferences, keep commitments, prevent duplicate outreach, and make named operating decisions without storing case details in the CRM.",
  peopleAndDecisions:
    "A paid resident advisor, program lead, development lead, volunteer coordinator, accessibility reviewer, operations owner, and executive director define the record. Decisions include the next agreed action, responsible owner, communication path, stale-record review, and whether a field remains necessary.",
  recordBoundary:
    "The CRM holds relationship-level facts, preferences, source, owner, commitments, and review dates. Service case notes, health details, identity documents, payment credentials, protected reports, passwords, and sensitive narrative stay in approved purpose-specific systems or are not collected.",
  collectionNoticeConsent:
    "Record how each field enters the system, why it is needed, what notice or permission applies, who supplied it, what uses were described, and how changes or withdrawal are handled. Imported records receive source and review status before use.",
  communicationPreferences:
    "Keep channel-specific preferences, language, accessible format, appropriate relationship basis, do-not-contact status, opt-out date and source, and a suppression process that reaches connected tools before the next send.",
  identityDeduplication:
    "Use an internal record ID and a two-person review for uncertain matches. Preserve source records during review, do not merge on name alone, document the decision, and restore a record when a merge was wrong.",
  relationshipLifecycle:
    "Use neutral stages: new, listening, active, follow-up due, paused, closed, or review needed. Each stage has a definition, allowed next steps, owner, date, and respectful pause or decline path; it does not rank a person’s value.",
  accessRoles:
    "Give each role only the fields and actions needed for assigned work. Review administrators, exports, shared accounts, former staff, volunteers, contractors, and service providers quarterly and after every role change.",
  dataQualityCorrection:
    "Owners review bounced channels, returned mail, conflicting preferences, duplicate candidates, missing sources, stale commitments, and correction requests weekly. Material changes retain date, source, owner, and a reversible history where appropriate.",
  retentionDeletion:
    "Assign each record and field a reviewed retention trigger based on purpose, promises, source documents, tax and grant records, disputes, legal holds, sector duties, and state rules. Pause routine deletion when qualified review requires preservation; verify deletion and downstream suppression separately.",
  integrationsExports:
    "Inventory forms, donation tools, email, events, spreadsheets, automations, backups, reports, and vendor support access. For each flow, document fields, direction, frequency, owner, failure alert, preference handling, contract, and exit export or deletion path.",
  securityIncident:
    "Require individual accounts, multifactor authentication where supported, password-manager use, approved devices, limited exports, tested recovery, vendor contacts, incident owner, evidence preservation, qualified notification review, and a plain-language communication plan.",
  accessibilityLanguage:
    "Offer accessible and language-appropriate collection, preference, correction, and opt-out paths. Do not infer disability, language, identity, or accommodation details from behavior; ask only what is needed to provide access and restrict the result.",
  reportingDecision:
    "Review open commitments, follow-up age, preference updates, corrections, duplicates, stale records, access changes, integration failures, field use, deletion work, and staff burden. Use reports to improve process, not score people or claim community impact.",
  vendorMigration:
    "Pilot with fictional records, compare requirements rather than logos, test permissions and exports, map every legacy field, quarantine unknown-source data, reconcile counts and suppressions, train role owners, preserve an approved rollback, and verify vendor deletion at exit.",
  fields: [
    {
      id: "constituent-record-id",
      label: "Constituent record ID",
      category: "system",
      purpose:
        "Distinguish records and support controlled duplicate review without using email as the permanent key.",
      source: "Generated by the approved CRM",
      sensitivity: "restricted",
      accessRole: "CRM administrators and authorized relationship owners",
      retentionReview:
        "Review with the parent record at closure and during the quarterly stale-record review.",
    },
    {
      id: "contact-preference-status",
      label: "Contact preference status",
      category: "contact-preference",
      purpose:
        "Honor channel choices, pauses, and do-not-contact instructions before outreach.",
      source:
        "Direct instruction or approved channel event with date and source",
      sensitivity: "restricted",
      accessRole: "Relationship owners and communication operators",
      retentionReview:
        "Keep an approved suppression record as needed; review its scope when systems or purposes change.",
    },
    {
      id: "relationship-stage",
      label: "Relationship stage",
      category: "relationship",
      purpose:
        "Show the current agreed work state and prevent duplicate or premature follow-up.",
      source: "Named relationship owner using the shared stage definitions",
      sensitivity: "standard",
      accessRole: "Authorized relationship owners",
      retentionReview:
        "Review at every follow-up and at the three-month operating review.",
    },
    {
      id: "access-support-requested",
      label: "Access support requested",
      category: "program-service",
      purpose:
        "Route an access request without storing diagnosis, case history, or unnecessary detail.",
      source: "Voluntary direct request through an accessible approved path",
      sensitivity: "high-risk",
      accessRole: "Program access coordinator only",
      retentionReview:
        "Review after the request is fulfilled; remove detail not needed for continuing access or records duties.",
    },
  ],
  hasMinimumNecessaryReview: true,
  hasNoticePreferenceReview: true,
  hasAccessIntegrationReview: true,
  hasRetentionIncidentReview: true,
  hasLegalSectorReview: true,
}

export function useCrmPlan() {
  const [draft, setDraft] = useState(DEFAULT_CRM_PLAN)
  const { storageReady, storageStatus, authorizeResetAfterReadFailure } =
    useDocumentationDraftPersistence(
      CRM_PLAN_STORAGE_KEY,
      draft,
      setDraft,
      sanitizeCrmPlan
    )

  const updateDraft = useCallback(
    <Key extends keyof CrmPlanDraft>(key: Key, value: CrmPlanDraft[Key]) =>
      setDraft((current) => ({ ...current, [key]: value })),
    []
  )

  const updateField = useCallback(
    <Key extends keyof CrmFieldDraft>(
      id: string,
      key: Key,
      value: CrmFieldDraft[Key]
    ) => {
      setDraft((current) => ({
        ...current,
        fields: current.fields.map((field) =>
          field.id === id ? { ...field, [key]: value } : field
        ),
      }))
    },
    []
  )

  const addField = useCallback(() => {
    setDraft((current) => {
      if (current.fields.length >= MAX_CRM_FIELDS) return current
      return {
        ...current,
        fields: [
          ...current.fields,
          createCrmField(`field-${Date.now()}-${current.fields.length + 1}`),
        ],
      }
    })
  }, [])

  const removeField = useCallback((id: string) => {
    setDraft((current) => {
      const remaining = current.fields.filter((field) => field.id !== id)
      return {
        ...current,
        fields:
          remaining.length > 0
            ? remaining
            : [createCrmField(`field-${Date.now()}`)],
      }
    })
  }, [])

  return {
    draft,
    storageReady,
    storageStatus,
    updateDraft,
    updateField,
    addField,
    removeField,
    loadExample: useCallback(() => setDraft(EXAMPLE_CRM_PLAN), []),
    reset: useCallback(() => {
      authorizeResetAfterReadFailure()
      setDraft(DEFAULT_CRM_PLAN)
    }, [authorizeResetAfterReadFailure]),
  }
}
