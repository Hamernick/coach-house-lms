import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase"

import type { WorkspaceFinanceStripeConnectionInput } from "../types"
import { isFinanceStripeAppConfigured } from "./stripe-app"

const RECORD_TYPES = new Set([
  "donation",
  "grant",
  "earned_revenue",
  "other_income",
] as const)

export async function loadOrganizationFinanceStripeConnection({
  orgId,
  supabase,
}: {
  orgId: string
  supabase: SupabaseClient<Database>
}): Promise<WorkspaceFinanceStripeConnectionInput> {
  if (!isFinanceStripeAppConfigured()) return { state: "not_configured" }

  const { data, error } = await supabase
    .from("organization_finance_stripe_connections")
    .select(
      "stripe_account_id,livemode,default_record_type,status,connected_at,last_synced_at,last_sync_status,last_sync_error"
    )
    .eq("org_id", orgId)
    .maybeSingle()

  if (error)
    throw new Error("Unable to load the Stripe connection.", { cause: error })
  if (!data) return { state: "not_connected" }
  if (
    data.status !== "connected" ||
    !RECORD_TYPES.has(
      data.default_record_type as NonNullable<
        WorkspaceFinanceStripeConnectionInput["defaultRecordType"]
      >
    )
  ) {
    return { state: "error" }
  }

  return {
    state: "connected",
    accountId: data.stripe_account_id,
    livemode: data.livemode,
    defaultRecordType: data.default_record_type as NonNullable<
      WorkspaceFinanceStripeConnectionInput["defaultRecordType"]
    >,
    connectedAt: data.connected_at,
    lastSyncedAt: data.last_synced_at,
    lastSyncStatus: data.last_sync_status as NonNullable<
      WorkspaceFinanceStripeConnectionInput["lastSyncStatus"]
    >,
    lastSyncError: data.last_sync_error,
  }
}
