import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase"

import {
  normalizeWorkspaceFinanceOpportunityIngestionBatch,
  type WorkspaceFinanceOpportunityCandidate,
} from "../lib/opportunity-ingestion"

type FinanceOpportunityInsert =
  Database["public"]["Tables"]["organization_finance_opportunities"]["Insert"]

export async function ingestRegisteredWorkspaceFinanceOpportunities({
  orgId,
  sourceKey,
  loadCandidates,
  trustedClient,
}: {
  orgId: string
  sourceKey: string
  loadCandidates: () => Promise<{
    observedAt: string
    items: WorkspaceFinanceOpportunityCandidate[]
  }>
  trustedClient: SupabaseClient<Database>
}) {
  const { data: source, error: sourceError } = await trustedClient
    .from("finance_opportunity_sources")
    .select("id,source_key,name,enabled")
    .eq("source_key", sourceKey)
    .eq("enabled", true)
    .maybeSingle()

  if (sourceError || !source) {
    throw new Error("The opportunity source is not registered and enabled.")
  }

  const startedAt = new Date().toISOString()
  const { data: scanRun, error: scanRunError } = await trustedClient
    .from("finance_opportunity_scan_runs")
    .insert({
      source_id: source.id,
      org_id: orgId,
      status: "running",
      started_at: startedAt,
    })
    .select("id")
    .single()

  if (scanRunError || !scanRun) {
    throw new Error("Unable to start the registered opportunity scan.")
  }

  try {
    const candidates = await loadCandidates()
    const normalized = normalizeWorkspaceFinanceOpportunityIngestionBatch({
      source: {
        id: source.id,
        key: source.source_key,
        name: source.name,
        enabled: source.enabled,
      },
      observedAt: candidates.observedAt,
      items: candidates.items,
    })
    if (!normalized) {
      throw new Error("The registered opportunity batch is invalid.")
    }

    const externalIds = normalized.items.map(({ externalId }) => externalId)
    const { data: existing, error: existingError } = externalIds.length
      ? await trustedClient
          .from("organization_finance_opportunities")
          .select("external_opportunity_id")
          .eq("org_id", orgId)
          .eq("external_provider", normalized.source.key)
          .in("external_opportunity_id", externalIds)
      : { data: [], error: null }

    if (existingError) throw existingError

    const existingIds = new Set(
      (existing ?? []).map(({ external_opportunity_id: id }) => id)
    )
    const rows: FinanceOpportunityInsert[] = normalized.items.map((item) => ({
      org_id: orgId,
      source_id: normalized.source.id,
      title: item.title,
      source_label: item.sourceLabel,
      opportunity_type: item.opportunityType,
      due_at: item.dueAt,
      external_provider: normalized.source.key,
      external_opportunity_id: item.externalId,
      discovered_at: normalized.observedAt,
    }))

    if (rows.length) {
      const { error } = await trustedClient
        .from("organization_finance_opportunities")
        .upsert(rows, {
          onConflict: "org_id,external_provider,external_opportunity_id",
          defaultToNull: false,
        })
      if (error) throw error
    }

    const itemsCreated = normalized.items.filter(
      ({ externalId }) => !existingIds.has(externalId)
    ).length
    const { error: completeError } = await trustedClient
      .from("finance_opportunity_scan_runs")
      .update({
        status: "succeeded",
        finished_at: new Date().toISOString(),
        items_seen: normalized.itemsSeen,
        items_created: itemsCreated,
        items_updated: normalized.items.length - itemsCreated,
        items_matched: normalized.items.length,
      })
      .eq("id", scanRun.id)
      .eq("org_id", orgId)

    if (completeError) throw completeError

    return {
      scanRunId: scanRun.id,
      itemsSeen: normalized.itemsSeen,
      itemsRejected: normalized.itemsRejected,
      itemsCreated,
      itemsUpdated: normalized.items.length - itemsCreated,
    }
  } catch (error) {
    await trustedClient
      .from("finance_opportunity_scan_runs")
      .update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error_code: "scan_failed",
        error_message: "Opportunity scan could not be completed.",
      })
      .eq("id", scanRun.id)
      .eq("org_id", orgId)

    throw new Error("Unable to ingest registered opportunities.", {
      cause: error,
    })
  }
}
