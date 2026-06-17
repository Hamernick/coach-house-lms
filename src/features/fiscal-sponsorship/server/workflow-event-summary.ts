import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase"

type FiscalWorkflowEventSummaryClient = SupabaseClient<Database, "public">

export type FiscalWorkflowEventSummaryRow = {
  id: string
  actor_id: string | null
  application_id: string | null
  created_at: string
  event_type: string
  metadata: unknown
  summary: string
}

export function mapFiscalWorkflowEventSummary(
  event: FiscalWorkflowEventSummaryRow
) {
  return {
    actorId: event.actor_id,
    applicationId: event.application_id,
    createdAt: event.created_at,
    eventType: event.event_type,
    id: event.id,
    metadata: event.metadata,
    summary: event.summary,
  }
}

export async function loadFiscalWorkflowEvents({
  orgId,
  projectId,
  supabase,
}: {
  orgId: string
  projectId: string
  supabase: FiscalWorkflowEventSummaryClient
}) {
  return supabase
    .from("fiscal_sponsorship_events")
    .select(
      "id, actor_id, application_id, created_at, event_type, metadata, summary"
    )
    .eq("org_id", orgId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(12)
    .returns<FiscalWorkflowEventSummaryRow[]>()
}
