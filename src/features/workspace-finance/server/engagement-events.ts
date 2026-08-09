import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase"

import type { WorkspaceFinanceRecordInput } from "../types"

type OrganizationFinanceEngagementEventRow =
  Database["public"]["Tables"]["organization_finance_engagement_events"]["Row"]

const EVENT_TYPE_LABELS: Record<string, string> = {
  view: "View",
  click: "Click",
  conversion: "Conversion",
}

export function mapOrganizationFinanceEngagementEvent(
  event: OrganizationFinanceEngagementEventRow
): WorkspaceFinanceRecordInput | null {
  const typeLabel = EVENT_TYPE_LABELS[event.event_type]
  if (!typeLabel) return null

  return {
    id: `engagement:${event.id}`,
    effectiveAt: event.occurred_at,
    sourceLabel: event.source_label,
    typeLabel,
    amountCents: null,
    direction: null,
    status: null,
    sourceKind: null,
  }
}

export async function loadOrganizationFinanceEngagementEvents({
  orgId,
  supabase,
}: {
  orgId: string
  supabase: SupabaseClient<Database>
}): Promise<WorkspaceFinanceRecordInput[]> {
  const { data, error } = await supabase
    .from("organization_finance_engagement_events")
    .select(
      "id,org_id,occurred_at,event_type,source_label,surface,finance_record_id,external_provider,external_event_id,created_at"
    )
    .eq("org_id", orgId)
    .order("occurred_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(500)

  if (error) {
    throw new Error("Unable to load Finance engagement history.", {
      cause: error,
    })
  }

  return (data ?? [])
    .map(mapOrganizationFinanceEngagementEvent)
    .filter((event) => event !== null)
}
