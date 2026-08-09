import type { FinancePlanningViewId } from "./finance-plan-diagram-data"
import {
  countFinancePlanEvidence,
  type FinancePlanEvidenceCounts,
} from "./finance-plan-evidence"
import type { FinancePlanEvidenceState } from "./finance-release-plan-data"

export type FinancePlanSecurityControl = {
  id: string
  state: FinancePlanEvidenceState
  target: {
    nodeId: string
    viewId: FinancePlanningViewId
  }
  title: string
}

const FINANCE_PLAN_SECURITY_CONTROL_DEFINITIONS = [
  {
    id: "security-rls-every-table",
    state: "not_started",
    target: { nodeId: "assurance-security-boundary", viewId: "assurance" },
    title: "Enable RLS on every table in its creating migration",
  },
  {
    id: "security-anonymous-public-fields",
    state: "not_started",
    target: { nodeId: "system-public-projection", viewId: "system" },
    title:
      "Anonymous users read only the public campaign projection and approved public resource fields",
  },
  {
    id: "security-finance-viewer-scope",
    state: "not_started",
    target: { nodeId: "assurance-security-boundary", viewId: "assurance" },
    title:
      "Organization finance viewers read approved summaries and allowed record fields",
  },
  {
    id: "security-restricted-fund-isolation",
    state: "not_started",
    target: { nodeId: "data-restricted-funds", viewId: "data" },
    title:
      "Fiscal finance records enforce indexed organization/project ownership with RLS; no organization member can read or mutate another organization's records",
  },
  {
    id: "security-donor-pii-permission",
    state: "not_started",
    target: { nodeId: "assurance-security-boundary", viewId: "assurance" },
    title:
      "Donor PII requires a separate permission and is never available to coaches by default",
  },
  {
    id: "security-finance-admin-mutations",
    state: "not_started",
    target: { nodeId: "system-finance-api", viewId: "system" },
    title:
      "Only finance owners/admins create finance records, campaigns, exports, and reports",
  },
  {
    id: "security-sponsor-operator-mutations",
    state: "not_started",
    target: { nodeId: "custody-approval", viewId: "custody" },
    title: "Only sponsor operators approve grants or record external payments",
  },
  {
    id: "security-server-authz",
    state: "not_started",
    target: { nodeId: "assurance-security-boundary", viewId: "assurance" },
    title:
      "Server actions repeat authorization; UI visibility is not authorization",
  },
  {
    id: "security-browser-write-boundary",
    state: "not_started",
    target: { nodeId: "assurance-security-boundary", viewId: "assurance" },
    title:
      "Browser clients cannot mark records reconciled, mutate summaries, cross organization/project scope, or write review results directly",
  },
  {
    id: "security-service-role-boundary",
    state: "not_started",
    target: { nodeId: "webhook-inbox", viewId: "webhooks" },
    title:
      "Service-role financial writes are confined to authorized import, reconciliation, summary, and audit paths",
  },
  {
    id: "security-membership-isolation",
    state: "not_started",
    target: { nodeId: "assurance-security-boundary", viewId: "assurance" },
    title:
      "Membership RLS prevents self-assignment, role escalation, cross-organization record assignment, and cross-project reuse",
  },
  {
    id: "security-connect-secret-signature",
    state: "not_started",
    target: { nodeId: "webhook-hook", viewId: "webhooks" },
    title:
      "Bank credentials are never collected; evidence access remains server-authorized and private",
  },
  {
    id: "security-csrf-stripe-id",
    state: "not_started",
    target: { nodeId: "system-finance-api", viewId: "system" },
    title:
      "Enforce trusted origins and CSRF protection; validate currency, dates, references, evidence, and scope before writes",
  },
  {
    id: "security-minimal-webhook-retention",
    state: "not_started",
    target: { nodeId: "webhook-inbox", viewId: "webhooks" },
    title:
      "Retain file hashes and minimal source metadata rather than bank credentials or complete statements when narrower evidence is sufficient",
  },
  {
    id: "security-risk-rate-limits",
    state: "not_started",
    target: { nodeId: "signup-server", viewId: "signup" },
    title:
      "Rate-limit signup, contact reveal, save replay, record imports, and exports by user and IP risk signal",
  },
  {
    id: "security-public-redaction",
    state: "not_started",
    target: { nodeId: "system-public-projection", viewId: "system" },
    title:
      "Redact protected contact data before public JSON serialization. CSS hiding is not protection",
  },
  {
    id: "security-contact-reveal-audit",
    state: "not_started",
    target: { nodeId: "assurance-security-boundary", viewId: "assurance" },
    title: "Log contact reveal events without logging the revealed value",
  },
  {
    id: "security-csv-neutralization",
    state: "not_started",
    target: { nodeId: "data-import-batches", viewId: "data" },
    title:
      "CSV exports neutralize cells beginning with =, +, -, or @ before normal CSV escaping",
  },
] as const satisfies readonly FinancePlanSecurityControl[]

export function buildFinancePlanSecurityControls(
  states: Partial<Record<string, FinancePlanEvidenceState>> = {}
): FinancePlanSecurityControl[] {
  return FINANCE_PLAN_SECURITY_CONTROL_DEFINITIONS.map((control) => ({
    ...control,
    state: states[control.id] ?? control.state,
  }))
}

export function countFinancePlanSecurityControls(
  controls: readonly FinancePlanSecurityControl[]
): FinancePlanEvidenceCounts {
  return countFinancePlanEvidence(controls)
}

export const FINANCE_PLAN_SECURITY_CONTROLS = buildFinancePlanSecurityControls()

export const FINANCE_PLAN_SECURITY_CONTROL_COUNTS =
  countFinancePlanSecurityControls(FINANCE_PLAN_SECURITY_CONTROLS)
