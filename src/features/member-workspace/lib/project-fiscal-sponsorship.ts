import type { Json } from "@/lib/supabase"
import type { FiscalSponsorshipProjectWorkflowSummary } from "@/features/fiscal-sponsorship"

function record(value: Json | undefined): Record<string, Json | undefined> {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {}
}

export function projectFiscalSponsorshipEnabled(options?: Json, guidedSetup?: Json) {
  return record(options).fiscalSponsorshipEnabled === true ||
    record(guidedSetup).fiscalSponsorshipEnabled === true
}

export function mergeProjectOptions(existing?: Json, options?: Json, enableFiscal?: boolean): Json {
  const current = record(existing)
  return {
    tags: [], sprintTypes: [], ...current, ...record(options),
    // Adding the tab is permanent here; ordinary project edits cannot remove it.
    ...(enableFiscal || current.fiscalSponsorshipEnabled === true
      ? { fiscalSponsorshipEnabled: true } : {}),
  }
}

export function hasFiscalSponsorshipWork(summary?: FiscalSponsorshipProjectWorkflowSummary | null) {
  return Boolean(summary && (summary.applicationId || summary.applicationStatus ||
    summary.latestAgreementDocument || summary.latestExecutedAgreementDocument ||
    summary.latestAuditCertificateDocument || summary.latestSignaturePacket ||
    summary.requiredDocuments.length || summary.events.length))
}
