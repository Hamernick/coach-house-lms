import { createHash } from "node:crypto"
import { revalidatePath } from "next/cache"
import { NextResponse, type NextRequest } from "next/server"

import {
  listConnectedStripeBalanceTransactions,
  mapStripeBalanceTransactionToFinanceRecord,
  resolveFinanceStripeAppClient,
} from "@/actions/workspace-finance-stripe-support"
import { getWorkspaceFinanceRecordTypeLabel } from "@/features/workspace-finance"
import { resolveAuthenticatedAppContext } from "@/lib/auth/request-context"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { canManageWorkspaceFinance } from "@/lib/workspace/workspace-finance-access"

const FIRST_SYNC_WINDOW_SECONDS = 90 * 24 * 60 * 60
const RESYNC_OVERLAP_SECONDS = 24 * 60 * 60

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin")
  return Boolean(origin && origin === request.nextUrl.origin)
}

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status })
}

function revalidateFinanceRoutes() {
  revalidatePath("/workspace")
  revalidatePath("/my-organization")
  revalidatePath("/organization/workspace")
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return errorResponse("Invalid request origin.", 403)

  let context: Awaited<ReturnType<typeof resolveAuthenticatedAppContext>>
  try {
    context = await resolveAuthenticatedAppContext()
  } catch {
    return errorResponse("Unauthorized", 401)
  }
  if (
    !(await canManageWorkspaceFinance({
      activeOrg: context.activeOrg,
      supabase: context.supabase,
      userId: context.user.id,
    }))
  ) {
    return errorResponse("Only Finance managers can sync Stripe.", 403)
  }

  let admin: ReturnType<typeof createSupabaseAdminClient>
  try {
    admin = createSupabaseAdminClient()
  } catch {
    return errorResponse("Stripe sync storage is not configured.", 503)
  }

  const { data: connection, error: connectionError } = await admin
    .from("organization_finance_stripe_connections")
    .select(
      "stripe_account_id,livemode,default_record_type,status,last_synced_at"
    )
    .eq("org_id", context.activeOrg.orgId)
    .maybeSingle()
  if (connectionError || !connection || connection.status !== "connected") {
    return errorResponse("Connect Stripe before syncing.", 409)
  }

  const stripe = resolveFinanceStripeAppClient(connection.livemode)
  if (!stripe)
    return errorResponse("Stripe sync is not configured for this mode.", 503)

  await admin
    .from("organization_finance_stripe_connections")
    .update({ last_sync_status: "running", last_sync_error: null })
    .eq("org_id", context.activeOrg.orgId)

  try {
    const lastSyncedSeconds = connection.last_synced_at
      ? Math.floor(new Date(connection.last_synced_at).getTime() / 1000)
      : null
    const createdGte = Math.max(
      0,
      lastSyncedSeconds
        ? lastSyncedSeconds - RESYNC_OVERLAP_SECONDS
        : Math.floor(Date.now() / 1000) - FIRST_SYNC_WINDOW_SECONDS
    )
    const transactions = await listConnectedStripeBalanceTransactions({
      stripe,
      connectedAccountId: connection.stripe_account_id,
      createdGte,
    })
    const mapped = transactions.flatMap((transaction) => {
      const record = mapStripeBalanceTransactionToFinanceRecord(transaction, {
        recordType: connection.default_record_type as
          | "donation"
          | "grant"
          | "earned_revenue"
          | "other_income",
      })
      if (!record) return []
      const payload = {
        effectiveAt: record.effective_at,
        recordType: record.record_type,
        direction: record.direction,
        sourceKind: record.source_kind ?? "",
        sourceLabel: record.source_label,
        amountCents: record.amount_cents,
        currencyCode: record.currency_code,
        externalRecordId: record.external_record_id,
      }
      return [
        {
          ...payload,
          payloadSha256: createHash("sha256")
            .update(JSON.stringify(payload))
            .digest("hex"),
        },
      ]
    })

    const { data: result, error: importError } = await admin.rpc(
      "import_organization_finance_stripe_records",
      {
        p_actor_id: context.user.id,
        p_org_id: context.activeOrg.orgId,
        p_stripe_account_id: connection.stripe_account_id,
        p_records: mapped,
      }
    )
    if (
      importError ||
      !result ||
      typeof result !== "object" ||
      Array.isArray(result) ||
      typeof result.imported !== "number" ||
      typeof result.skipped !== "number" ||
      typeof result.syncedAt !== "string"
    ) {
      throw new Error("Stripe import failed")
    }

    const externalIds = mapped.map((record) => record.externalRecordId)
    const { data: rows, error: rowsError } = externalIds.length
      ? await admin
          .from("organization_finance_records")
          .select(
            "id,program_id,effective_at,record_type,direction,source_kind,source_label,amount_cents,currency_code,status"
          )
          .eq("org_id", context.activeOrg.orgId)
          .eq("external_provider", "stripe_balance_transaction")
          .in("external_record_id", externalIds)
      : { data: [], error: null }
    if (rowsError) throw new Error("Stripe record reload failed")

    await admin
      .from("organization_finance_stripe_connections")
      .update({
        last_synced_at: result.syncedAt,
        last_sync_status: "succeeded",
        last_sync_error: null,
      })
      .eq("org_id", context.activeOrg.orgId)

    revalidateFinanceRoutes()
    return NextResponse.json({
      imported: result.imported,
      skipped: result.skipped,
      syncedAt: result.syncedAt,
      records: (rows ?? []).map((row) => ({
        id: row.id,
        programId: row.program_id,
        effectiveAt: row.effective_at,
        sourceLabel: row.source_label,
        recordType: row.record_type,
        typeLabel: getWorkspaceFinanceRecordTypeLabel(row.record_type),
        amountCents: row.amount_cents,
        currencyCode: row.currency_code,
        direction: row.direction,
        status: row.status,
        sourceKind: row.source_kind,
      })),
    })
  } catch {
    await admin
      .from("organization_finance_stripe_connections")
      .update({
        last_sync_status: "failed",
        last_sync_error: "Stripe could not be synced. Try again.",
      })
      .eq("org_id", context.activeOrg.orgId)
    return errorResponse("Stripe could not be synced. Try again.", 502)
  }
}
