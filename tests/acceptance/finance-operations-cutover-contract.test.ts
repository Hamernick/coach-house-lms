import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

type ResearchContract = {
  alertSeverities: Array<{
    acknowledgement?: string
    acknowledgementMinutes?: number
    haltsExpansion?: boolean
    id: string
  }>
  boundaries: {
    economicEngineUnchanged: boolean
    fiscalFee: {
      appliesOnlyTo: string
      approvalRequired: boolean
      percent: number
    }
    hcaptchaAllowed: boolean
    independentApplicationFeeAllowed: boolean
    independentChargeModel: string
    productUiBlockedOnScreenshots: boolean
  }
  canaryStages: Array<{
    capabilitiesEnabled?: boolean
    eligibleOrganizationPercentages?: number[]
    id: string
    maximumOrganizations?: number
    minimumObservationHours: number
    production: boolean
  }>
  integrityInvariants: string[]
  monitoringViews: string[]
  openEvidence: string[]
  ownerRoles: string[]
  requiredDrills: string[]
  rollback: {
    disable: string[]
    keepRunning: string[]
    never: string[]
  }
  schemaVersion: number
  serverControls: string[]
  slos: Array<{
    hardGate?: string
    hardMaximumSeconds?: number
    id: string
    targetPercent?: number
  }>
  status: string
}

const ROOT = process.cwd()
const CONTRACT_PATH = join(
  ROOT,
  "tests/fixtures/finance-operations-cutover/research-contract.json"
)
const PLAN_PATH = join(
  ROOT,
  "docs/plans/2026-08-06-finance-operations-cutover-contract.md"
)

const contract = JSON.parse(
  readFileSync(CONTRACT_PATH, "utf8")
) as ResearchContract
const plan = readFileSync(PLAN_PATH, "utf8")

describe("Finance operations and cutover research contract", () => {
  it("keeps approved product and policy boundaries explicit", () => {
    expect(contract.schemaVersion).toBe(1)
    expect(contract.status).toBe("draft_unsigned")
    expect(contract.boundaries).toEqual({
      economicEngineUnchanged: true,
      fiscalFee: {
        appliesOnlyTo: "approved_fiscally_sponsored_grant_allocation",
        approvalRequired: true,
        percent: 7,
      },
      hcaptchaAllowed: false,
      independentApplicationFeeAllowed: false,
      independentChargeModel: "connected_account_direct_charge",
      productUiBlockedOnScreenshots: true,
    })
  })

  it("separates zero-tolerance integrity from measurable service objectives", () => {
    expect(contract.integrityInvariants).toHaveLength(10)
    expect(contract.integrityInvariants).toEqual(
      expect.arrayContaining([
        "immutable_ledger_compensations_only",
        "organization_account_environment_currency_isolation",
        "no_private_data_in_public_payloads_metrics_or_alerts",
        "webhook_and_reconciliation_survive_presentation_rollback",
      ])
    )

    expect(contract.slos.map(({ id }) => id)).toEqual([
      "webhook_durable_acceptance",
      "event_processing_freshness",
      "connect_readiness_freshness",
      "reconciliation_freshness",
      "public_aggregate_freshness",
      "finance_route_availability",
    ])
    expect(
      contract.slos.find(({ id }) => id === "webhook_durable_acceptance")
    ).toMatchObject({ targetPercent: 99.9 })
    expect(
      contract.slos.find(({ id }) => id === "public_aggregate_freshness")
    ).toMatchObject({ hardMaximumSeconds: 900, targetPercent: 99 })
  })

  it("requires actionable severity, dashboard, and owner coverage", () => {
    expect(contract.alertSeverities.map(({ id }) => id)).toEqual([
      "sev0",
      "sev1",
      "sev2",
    ])
    expect(contract.alertSeverities[0]).toMatchObject({
      acknowledgement: "immediate",
      haltsExpansion: true,
    })
    expect(contract.alertSeverities[1]).toMatchObject({
      acknowledgementMinutes: 15,
      haltsExpansion: true,
    })
    expect(contract.monitoringViews).toHaveLength(6)
    expect(contract.ownerRoles).toEqual(
      expect.arrayContaining([
        "engineering_owner",
        "finance_operations",
        "fiscal_sponsorship_operations",
        "security_privacy",
        "member_support",
        "connected_organization_owner",
        "accounting_reviewer",
        "counsel",
      ])
    )
  })

  it("uses independent server controls and a gated production canary", () => {
    expect(contract.serverControls).toEqual([
      "connect_provisioning",
      "campaign_creation",
      "public_finance_projection",
      "fiscal_restricted_funds",
      "organization_cohort",
    ])
    expect(contract.canaryStages.map(({ id }) => id)).toEqual([
      "sandbox",
      "production_dark",
      "internal_live",
      "approved_organization",
      "limited_cohort",
      "broader_release",
    ])
    expect(contract.canaryStages[1]).toMatchObject({
      capabilitiesEnabled: false,
      minimumObservationHours: 24,
      production: true,
    })
    expect(contract.canaryStages[2]).toMatchObject({
      maximumOrganizations: 1,
      minimumObservationHours: 24,
    })
    expect(contract.canaryStages[3]).toMatchObject({
      maximumOrganizations: 1,
      minimumObservationHours: 72,
    })
    expect(
      contract.canaryStages.at(-1)?.eligibleOrganizationPercentages
    ).toEqual([25, 100])
  })

  it("preserves financial processing during presentation rollback", () => {
    expect(contract.rollback.disable).toEqual(
      expect.arrayContaining([
        "campaign_creation",
        "affected_payment_links",
        "affected_public_projection",
      ])
    )
    expect(contract.rollback.keepRunning).toEqual(
      expect.arrayContaining([
        "connect_webhook",
        "durable_event_inbox",
        "immutable_ledger",
        "reconciliation",
      ])
    )
    expect(contract.rollback.never).toEqual(
      expect.arrayContaining([
        "delete_financial_rows",
        "reverse_applied_migration",
        "invent_public_fallback_total",
        "skip_failed_canary_stage",
      ])
    )
    expect(contract.requiredDrills).toHaveLength(10)
  })

  it("keeps operational and screenshot evidence visibly open", () => {
    expect(contract.openEvidence).toEqual(
      expect.arrayContaining([
        "implemented_monitoring_dashboard",
        "delivered_alerts",
        "named_primary_and_backup_owners",
        "completed_drills",
        "signed_rollout_approval",
        "three_pass_screenshot_review",
        "responsive_and_error_state_visual_evidence",
      ])
    )
    expect(plan).toContain(
      "Status: Draft 1; Research 7 operations answer complete, operational evidence and"
    )
    expect(plan).toContain(
      "This contract defines required implementation and proof"
    )
    expect(plan).toContain("The evidence remains **collecting**")
    expect(plan).toContain(
      "No product-facing `/find` or Finance UI should be built"
    )
  })
})
