import type Stripe from "stripe"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it, vi } from "vitest"

import { mapStripeBalanceTransactionToFinanceRecord } from "@/features/workspace-finance/lib/stripe-balance-transaction"
import {
  listConnectedStripeBalanceTransactions,
  type StripeBalanceTransactionReader,
} from "@/features/workspace-finance/server/stripe-balance-transactions"

function buildBalanceTransaction(
  input: Partial<Stripe.BalanceTransaction> &
    Pick<Stripe.BalanceTransaction, "amount" | "id" | "type">
): Stripe.BalanceTransaction {
  const { amount, id, type, ...overrides } = input

  return {
    amount,
    available_on: 1_786_124_800,
    balance_type: "payments",
    created: 1_786_124_800,
    currency: "usd",
    description: "Private Stripe description",
    exchange_rate: null,
    fee: 0,
    fee_details: [],
    id,
    net: amount,
    object: "balance_transaction",
    reporting_category: "charge",
    source: null,
    status: "available",
    type,
    ...overrides,
  }
}

describe("workspace Finance Stripe import contract", () => {
  it("uses a permissioned Stripe App install instead of user API keys", () => {
    const root = process.cwd()
    const manifest = readFileSync(join(root, "stripe-app.yaml"), "utf8")
    const startRoute = readFileSync(
      join(
        root,
        "src/app/api/account/finance-connections/stripe/start/route.ts"
      ),
      "utf8"
    )
    const callbackRoute = readFileSync(
      join(
        root,
        "src/app/api/account/finance-connections/stripe/callback/route.ts"
      ),
      "utf8"
    )

    expect(manifest).toContain("stripe_api_access_type: platform")
    expect(manifest).toContain("permission: balance_read")
    expect(manifest).not.toContain("charge_write")
    expect(startRoute).toContain("canManageWorkspaceFinance")
    expect(startRoute).toContain('createHash("sha256")')
    expect(startRoute).toContain('searchParams.set("state", state)')
    expect(callbackRoute).toContain("verifyFinanceStripeInstallSignature")
    expect(callbackRoute).toContain(
      '"complete_organization_finance_stripe_install"'
    )
    expect(callbackRoute).toContain("p_org_id: context.activeOrg.orgId")

    const authorizationMigration = readFileSync(
      join(
        root,
        "supabase/migrations/20260814061500_bind_finance_stripe_install_to_authorized_org.sql"
      ),
      "utf8"
    )
    expect(authorizationMigration).toContain("and org_id = p_org_id")
    expect(authorizationMigration).toContain("access.access_level = 'manager'")
    expect(authorizationMigration).toContain("membership.role = 'board'")
    expect(authorizationMigration).toContain(
      "Keep the released five-argument caller working"
    )
  })

  it("syncs only through the connected account and atomic provider evidence", () => {
    const root = process.cwd()
    const route = readFileSync(
      join(
        root,
        "src/app/api/account/finance-connections/stripe/sync/route.ts"
      ),
      "utf8"
    )
    const migration = readFileSync(
      join(
        root,
        "supabase/migrations/20260808203000_add_finance_stripe_app_connection.sql"
      ),
      "utf8"
    )

    expect(route).toContain("listConnectedStripeBalanceTransactions")
    expect(route).toContain("connection.stripe_account_id")
    expect(route).toContain("FIRST_SYNC_WINDOW_SECONDS")
    expect(route).toContain('"import_organization_finance_stripe_records"')
    expect(migration).toContain(
      "create table if not exists public.organization_finance_record_provider_evidence"
    )
    expect(migration).toContain("'reconciled',")
    expect(migration).toContain("'providerEvidence', true")
    expect(migration).not.toContain("access_token")
    expect(migration).not.toContain("refresh_token")
  })

  it("requires explicit classification before counting Stripe income", () => {
    const transaction = buildBalanceTransaction({
      amount: 5_000,
      id: "txn_donation",
      type: "charge",
    })

    expect(mapStripeBalanceTransactionToFinanceRecord(transaction)).toBeNull()
    expect(
      mapStripeBalanceTransactionToFinanceRecord(transaction, {
        recordType: "donation",
        sourceLabel: "Stripe donations",
      })
    ).toEqual({
      effective_at: "2026-08-07T17:46:40.000Z",
      record_type: "donation",
      direction: "in",
      source_kind: "donations",
      source_label: "Stripe donations",
      amount_cents: 5_000,
      currency_code: "USD",
      status: "recorded",
      external_provider: "stripe_balance_transaction",
      external_record_id: "txn_donation",
      created_source: "stripe",
    })
  })

  it("maps refunds and fees without marking them as fundraising sources", () => {
    expect(
      mapStripeBalanceTransactionToFinanceRecord(
        buildBalanceTransaction({
          amount: -1_500,
          id: "txn_refund",
          type: "refund",
        })
      )
    ).toMatchObject({
      record_type: "reversal",
      direction: "out",
      source_kind: null,
      source_label: "Stripe refund",
      amount_cents: 1_500,
    })

    expect(
      mapStripeBalanceTransactionToFinanceRecord(
        buildBalanceTransaction({
          amount: -175,
          id: "txn_fee",
          type: "stripe_fee",
        })
      )
    ).toMatchObject({
      record_type: "fee",
      direction: "out",
      source_kind: null,
      source_label: "Stripe fee",
      amount_cents: 175,
    })
  })

  it("rejects unsupported balance movements instead of guessing", () => {
    expect(
      mapStripeBalanceTransactionToFinanceRecord(
        buildBalanceTransaction({
          amount: -5_000,
          id: "txn_payout",
          type: "payout",
        })
      )
    ).toBeNull()
  })

  it("reads connected-account pages with a hard import bound", async () => {
    const first = buildBalanceTransaction({
      amount: 5_000,
      id: "txn_first",
      type: "charge",
    })
    const second = buildBalanceTransaction({
      amount: 4_000,
      id: "txn_second",
      type: "charge",
    })
    const third = buildBalanceTransaction({
      amount: -500,
      id: "txn_third",
      type: "refund",
    })
    const list = vi
      .fn()
      .mockResolvedValueOnce({ data: [first, second], has_more: true })
      .mockResolvedValueOnce({ data: [third], has_more: false })
    const stripe = {
      balanceTransactions: { list },
    } satisfies StripeBalanceTransactionReader

    await expect(
      listConnectedStripeBalanceTransactions({
        stripe,
        connectedAccountId: "acct_fixture",
        createdGte: 1_786_124_800,
        maxRecords: 3,
      })
    ).resolves.toEqual([first, second, third])

    expect(list).toHaveBeenNthCalledWith(
      1,
      { created: { gte: 1_786_124_800 }, limit: 3 },
      { stripeAccount: "acct_fixture" }
    )
    expect(list).toHaveBeenNthCalledWith(
      2,
      {
        created: { gte: 1_786_124_800 },
        limit: 1,
        starting_after: "txn_second",
      },
      { stripeAccount: "acct_fixture" }
    )
  })

  it("rejects unscoped or unbounded reads before calling Stripe", async () => {
    const list = vi.fn()
    const stripe = {
      balanceTransactions: { list },
    } as unknown as StripeBalanceTransactionReader

    await expect(
      listConnectedStripeBalanceTransactions({
        stripe,
        connectedAccountId: "platform",
        createdGte: 0,
      })
    ).rejects.toThrow("connected Stripe account")
    await expect(
      listConnectedStripeBalanceTransactions({
        stripe,
        connectedAccountId: "acct_fixture",
        createdGte: 0,
        maxRecords: 501,
      })
    ).rejects.toThrow("limited to 500")
    expect(list).not.toHaveBeenCalled()
  })
})
